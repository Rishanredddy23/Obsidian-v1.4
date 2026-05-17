import {
  detectProvider, formatMessagesForProvider, buildRequestBody,
  buildRequestHeaders, buildEndpoint, parseStreamToken, isStreamDone,
  formatMessagesWithMergedFallback,
} from './providerAdapters'

const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.startChatStream

export async function streamChatResponse({
  baseUrl,
  apiKey,
  model,
  messages,
  onToken,
  onDone,
  onError,
  timeoutMs = 600000,
}) {
  const systemMsg = messages.find(m => m.role === 'system')
  const systemPrompt = systemMsg?.content || ''
  const chatMsgs = messages.filter(m => m.role !== 'system')

  const provider = detectProvider(baseUrl)
  const formatted = formatMessagesForProvider(provider, systemPrompt, chatMsgs)
  const body = buildRequestBody(provider, model, formatted)
  const headers = buildRequestHeaders(provider, apiKey)
  const endpoint = buildEndpoint(provider, baseUrl)
  const doStream = isElectron
    ? (params) => streamViaIPC({ ...params, provider })
    : (params) => streamViaFetch({ ...params, provider })

  try {
    let needsMergedRetry = false
    let attemptError = null

    await doStream({
      endpoint, headers, body, provider, timeoutMs,
      onToken,
      onDone,
      onError: (err) => {
        const msg = err.message || ''
        if (msg.toLowerCase().includes('system role') ||
            msg.toLowerCase().includes('unsupported role') ||
            msg.toLowerCase().includes('invalid role') ||
            (msg.includes('400') && msg.toLowerCase().includes('system'))) {
          needsMergedRetry = true
          attemptError = err
          return
        }
        attemptError = err
        onError?.(err)
      },
    })

    if (needsMergedRetry) {
      attemptError = null
      const mergedFormatted = formatMessagesWithMergedFallback(systemPrompt, chatMsgs)
      const retryBody = buildRequestBody(provider, model, mergedFormatted)
      await doStream({
        endpoint, headers, body: retryBody, provider, timeoutMs,
        onToken,
        onDone,
        onError: (err) => {
          attemptError = err
          onError?.(err)
        },
      })
    }

    return { ok: !attemptError, error: attemptError }
  } catch (err) {
    onError?.(err)
    return { ok: false, error: err }
  }
}

function streamViaIPC({ endpoint, headers, body, provider, onToken, onDone, onError, timeoutMs = 600000 }) {
  const requestId = Math.random().toString(36).slice(2) + Date.now()

  return new Promise((resolve) => {
    let settled = false
    let cleanupFns = []

    const removeListeners = () => {
      if (cleanupFns.length) {
        cleanupFns.forEach((fn) => fn?.())
        cleanupFns = []
      } else {
        window.electronAPI.removeStreamListeners()
      }
    }

    const timeout = setTimeout(() => {
      settle(() => onError?.(new Error('Agent timed out while waiting for provider response.')))
    }, timeoutMs)

    function cleanup() {
      clearTimeout(timeout)
      removeListeners()
    }

    function settle(callback) {
      if (settled) return
      settled = true
      cleanup()
      callback?.()
      resolve()
    }

    const handleToken = ({ requestId: rid, token }) => {
      if (rid === requestId && !settled) onToken(token)
    }
    const handleDone = ({ requestId: rid }) => {
      if (rid === requestId) settle(onDone)
    }
    const handleError = ({ requestId: rid, error }) => {
      if (rid === requestId) settle(() => onError?.(new Error(error)))
    }

    cleanupFns = [
      window.electronAPI.onStreamToken(handleToken),
      window.electronAPI.onStreamDone(handleDone),
      window.electronAPI.onStreamError(handleError),
    ].filter(Boolean)

    window.electronAPI.startChatStream({
      requestId, endpoint, headers, body, provider,
      baseUrl: '', apiKey: '', model: body.model, messages: body.messages,
    })
  })
}

async function streamViaFetch({ endpoint, headers, body, provider, onToken, onDone, onError, timeoutMs = 600000 }) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      const errText = await res.text()
      let msg = `API error ${res.status}`
      try {
        const p = JSON.parse(errText)
        msg = p.error?.message || p.detail || p.message || `${msg}: ${errText.slice(0, 300)}`
      } catch {
        msg += `: ${errText.slice(0, 300)}`
      }
      onError?.(new Error(msg))
      return
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        if (isStreamDone(provider, null, trimmed)) { onDone?.(); return }
        if (!trimmed.startsWith('data:') && provider !== 'anthropic') continue
        const dataStr = trimmed.startsWith('data:')
          ? trimmed.slice(trimmed.startsWith('data: ') ? 6 : 5).trim()
          : trimmed
        if (dataStr === '[DONE]') { onDone?.(); return }
        try {
          const parsed = JSON.parse(dataStr)
          if (isStreamDone(provider, parsed, trimmed)) { onDone?.(); return }
          const token = parseStreamToken(provider, parsed)
          if (token) onToken(token)
        } catch {}
      }
    }
    onDone?.()
  } catch (err) {
    onError?.(new Error(err.name === 'AbortError' ? 'Agent timed out while waiting for provider response.' : err.message))
  } finally {
    clearTimeout(timeout)
  }
}

export function buildMessages(systemPrompt, chatMessages) {
  const msgs = []
  if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt })
  for (const m of chatMessages) {
    msgs.push({ role: m.role, content: m.content })
  }
  return msgs
}
