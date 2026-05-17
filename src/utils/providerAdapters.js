/**
 * Provider Adapter Layer
 * Detects provider from baseUrl and formats messages/request bodies accordingly.
 * Each provider has different requirements for system prompts, auth headers, and body shapes.
 */

// ── Provider Detection ──
export function detectProvider(baseUrl) {
  if (!baseUrl) return 'unknown'
  const url = baseUrl.toLowerCase()
  if (url.includes('anthropic')) return 'anthropic'
  if (url.includes('openrouter')) return 'openrouter'
  if (url.includes('groq.com')) return 'groq'
  if (url.includes('nvidia.com') || url.includes('nim')) return 'nvidia'
  if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('ollama')) return 'ollama'
  if (url.includes('openai.com')) return 'openai'
  if (url.includes('together.xyz') || url.includes('together.ai')) return 'together'
  if (url.includes('fireworks.ai')) return 'fireworks'
  if (url.includes('deepseek')) return 'deepseek'
  if (url.includes('mistral')) return 'mistral'
  return 'openai-compatible' // default: assume OpenAI-compatible
}

// ── Message Formatting ──

/**
 * Format messages for the detected provider.
 * Returns { messages, systemParam, extraBody } where:
 *   - messages: the formatted messages array
 *   - systemParam: top-level system parameter (for Anthropic)
 *   - extraBody: any extra body params needed
 */
export function formatMessagesForProvider(provider, systemPrompt, chatMessages) {
  switch (provider) {
    case 'anthropic':
      return formatAnthropic(systemPrompt, chatMessages)
    case 'openai':
    case 'openrouter':
    case 'groq':
    case 'deepseek':
    case 'mistral':
    case 'together':
    case 'fireworks':
      return formatOpenAI(systemPrompt, chatMessages)
    case 'nvidia':
      return formatNvidia(systemPrompt, chatMessages)
    case 'ollama':
      return formatOllama(systemPrompt, chatMessages)
    case 'openai-compatible':
    default:
      // Try OpenAI format first; fallback logic is handled at the call site
      return formatOpenAI(systemPrompt, chatMessages)
  }
}

// OpenAI-compatible: system role is supported
function formatOpenAI(systemPrompt, chatMessages) {
  const messages = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  for (const m of chatMessages) {
    messages.push({ role: m.role, content: m.content })
  }
  return { messages, systemParam: null, extraBody: {} }
}

// Anthropic: system goes as top-level param, NOT in messages
function formatAnthropic(systemPrompt, chatMessages) {
  const messages = []
  for (const m of chatMessages) {
    // Anthropic requires alternating user/assistant. Skip any system messages.
    if (m.role === 'system') continue
    messages.push({ role: m.role, content: m.content })
  }
  // Anthropic requires the first message to be user
  if (messages.length === 0 || messages[0].role !== 'user') {
    messages.unshift({ role: 'user', content: '(continue)' })
  }
  return {
    messages,
    systemParam: systemPrompt || null,
    extraBody: { max_tokens: 8192 },
  }
}

// NVIDIA NIM: some models don't support system role
function formatNvidia(systemPrompt, chatMessages) {
  return formatMergedSystem(systemPrompt, chatMessages)
}

// Ollama: older versions may not support system role via /v1 endpoint
function formatOllama(systemPrompt, chatMessages) {
  // Modern Ollama supports system role, but merge as fallback
  const messages = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  for (const m of chatMessages) {
    messages.push({ role: m.role, content: m.content })
  }
  return { messages, systemParam: null, extraBody: {} }
}

// Fallback: merge system prompt into the first user message
function formatMergedSystem(systemPrompt, chatMessages) {
  const messages = []
  let systemMerged = false
  for (const m of chatMessages) {
    if (m.role === 'system') continue
    if (!systemMerged && m.role === 'user' && systemPrompt) {
      messages.push({
        role: 'user',
        content: `SYSTEM INSTRUCTIONS:\n${systemPrompt}\n\nUSER REQUEST:\n${m.content}`,
      })
      systemMerged = true
    } else {
      messages.push({ role: m.role, content: m.content })
    }
  }
  // If no user message was found to merge into
  if (!systemMerged && systemPrompt) {
    messages.unshift({
      role: 'user',
      content: `SYSTEM INSTRUCTIONS:\n${systemPrompt}\n\nPlease follow the instructions above.`,
    })
  }
  return { messages, systemParam: null, extraBody: {} }
}

// ── Build Request Body ──
export function buildRequestBody(provider, model, formattedMessages, stream = true) {
  const { messages, systemParam, extraBody } = formattedMessages

  const body = { model, messages, stream, ...extraBody }

  // Anthropic uses top-level "system" parameter
  if (provider === 'anthropic' && systemParam) {
    body.system = systemParam
  }

  return body
}

// ── Build Headers ──
export function buildRequestHeaders(provider, apiKey) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  }

  switch (provider) {
    case 'anthropic':
      if (apiKey) headers['x-api-key'] = apiKey
      headers['anthropic-version'] = '2023-06-01'
      delete headers['Accept'] // Anthropic uses regular response
      break
    case 'openrouter':
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
      headers['HTTP-Referer'] = 'https://obsidian.ai'
      headers['X-Title'] = 'Obsidian AI'
      break
    default:
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
      break
  }

  return headers
}

// ── Build Endpoint ──
export function buildEndpoint(provider, baseUrl) {
  const base = baseUrl.replace(/\/+$/, '')

  switch (provider) {
    case 'anthropic':
      return base + '/messages'
    default:
      return base + '/chat/completions'
  }
}

// ── Parse SSE Token ──
// Different providers return tokens in different response shapes
export function parseStreamToken(provider, parsed) {
  switch (provider) {
    case 'anthropic':
      // Anthropic SSE events: content_block_delta
      if (parsed.type === 'content_block_delta') {
        return parsed.delta?.text || null
      }
      if (parsed.type === 'message_delta') return null
      if (parsed.type === 'message_stop') return null
      return null
    default:
      // OpenAI-compatible
      return parsed.choices?.[0]?.delta?.content || null
  }
}

// ── Check if event signals completion ──
export function isStreamDone(provider, parsed, rawLine) {
  if (rawLine?.trim() === 'data: [DONE]') return true
  switch (provider) {
    case 'anthropic':
      return parsed?.type === 'message_stop'
    default:
      return false
  }
}

// ── Retry with merged format ──
export function formatMessagesWithMergedFallback(systemPrompt, chatMessages) {
  return formatMergedSystem(systemPrompt, chatMessages)
}
