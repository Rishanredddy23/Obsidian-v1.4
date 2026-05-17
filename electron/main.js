const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const https = require('https')
const http = require('http')
const { setupWorkspaceIPC } = require('./workspace')
const { setupTerminalIPC } = require('./terminal')

const isDev = !app.isPackaged
const dataDir = path.join(app.getPath('userData'), 'obsidian-data')
const chatsDir = path.join(dataDir, 'chats')
const configPath = path.join(dataDir, 'config.json')

let mainWindow = null

function ensureDirectories() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(chatsDir)) fs.mkdirSync(chatsDir, { recursive: true })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 900, minHeight: 600,
    frame: false, titleBarStyle: 'hidden', backgroundColor: '#fafafa', show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  })
  mainWindow.once('ready-to-show', () => mainWindow.show())
  if (isDev) mainWindow.loadURL('http://localhost:5173')
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  mainWindow.on('closed', () => { mainWindow = null })
  return mainWindow
}

app.whenReady().then(() => {
  ensureDirectories()
  createWindow()
  setupChatIPC()
  setupStreamIPC()
  setupWorkspaceIPC(() => mainWindow)
  setupTerminalIPC()
  ipcMain.on('win-minimize', e => BrowserWindow.fromWebContents(e.sender)?.minimize())
  ipcMain.on('win-maximize', e => { const w = BrowserWindow.fromWebContents(e.sender); w?.isMaximized() ? w.unmaximize() : w?.maximize() })
  ipcMain.on('win-close', e => BrowserWindow.fromWebContents(e.sender)?.close())
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

// ── Chat Persistence ──
function setupChatIPC() {
  ipcMain.handle('save-chat', async (_e, chat) => {
    fs.writeFileSync(path.join(chatsDir, `${chat.id}.json`), JSON.stringify(chat, null, 2)); return true
  })
  ipcMain.handle('load-chats', async () => {
    return fs.readdirSync(chatsDir).filter(f => f.endsWith('.json')).map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(chatsDir, f), 'utf-8')) } catch { return null }
    }).filter(Boolean).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  })
  ipcMain.handle('load-chat', async (_e, id) => {
    const fp = path.join(chatsDir, `${id}.json`)
    return fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, 'utf-8')) : null
  })
  ipcMain.handle('delete-chat', async (_e, id) => {
    const fp = path.join(chatsDir, `${id}.json`)
    if (fs.existsSync(fp)) fs.unlinkSync(fp); return true
  })
  ipcMain.handle('save-config', async (_e, config) => {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2)); return true
  })
  ipcMain.handle('load-config', async () => {
    return fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf-8')) : null
  })
}

// ── Streaming Chat Completion ──
function setupStreamIPC() {
  ipcMain.handle('start-chat-stream', async (event, params) => {
    const { requestId, baseUrl, apiKey, model, messages, endpoint: reqEndpoint, headers: reqHeaders, body: reqBody, provider } = params
    
    const endpoint = reqEndpoint || (baseUrl.replace(/\/+$/, '') + '/chat/completions')
    let parsedUrl
    try { parsedUrl = new URL(endpoint) } catch {
      event.sender.send('chat-stream-error', { requestId, error: `Invalid URL: ${endpoint}` }); return
    }
    
    const postData = reqBody ? JSON.stringify(reqBody) : JSON.stringify({ model, messages, stream: true })
    const headers = reqHeaders || {
      'Content-Type': 'application/json', 'Accept': 'text/event-stream',
      ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
    }

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers,
    }
    const protocol = parsedUrl.protocol === 'https:' ? https : http
    const req = protocol.request(options, (res) => {
      if (res.statusCode !== 200) {
        let body = ''
        res.on('data', c => body += c.toString())
        res.on('end', () => {
          let msg = `API error ${res.statusCode}`
          try { const p = JSON.parse(body); msg = p.error?.message || p.error?.type || p.detail || msg + ': ' + body.slice(0, 300) } catch { msg += ': ' + body.slice(0, 300) }
          event.sender.send('chat-stream-error', { requestId, error: msg })
        })
        return
      }
      let buffer = ''
      res.on('data', (chunk) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          
          if (trimmed === 'data: [DONE]') { event.sender.send('chat-stream-done', { requestId }); return }
          if (!trimmed.startsWith('data:') && provider !== 'anthropic') continue
          
          const dataStr = trimmed.startsWith('data:') 
            ? trimmed.slice(trimmed.startsWith('data: ') ? 6 : 5).trim()
            : trimmed
            
          if (dataStr === '[DONE]') { event.sender.send('chat-stream-done', { requestId }); return }
          
          try {
            const parsed = JSON.parse(dataStr)
            
            if (provider === 'anthropic' && parsed.type === 'message_stop') {
               event.sender.send('chat-stream-done', { requestId }); return
            }
            
            let token = null
            if (provider === 'anthropic') {
              if (parsed.type === 'content_block_delta') token = parsed.delta?.text || null
            } else {
              token = parsed.choices?.[0]?.delta?.content || null
            }
            
            if (token) event.sender.send('chat-stream-token', { requestId, token })
          } catch {}
        }
      })
      res.on('end', () => event.sender.send('chat-stream-done', { requestId }))
      res.on('error', (err) => event.sender.send('chat-stream-error', { requestId, error: err.message }))
    })
    req.on('error', (err) => event.sender.send('chat-stream-error', { requestId, error: `Connection failed: ${err.message}` }))
    req.setTimeout(600000, () => { req.destroy(); event.sender.send('chat-stream-error', { requestId, error: 'Request timed out (10 mins)' }) })
    req.write(postData)
    req.end()
  })
}
