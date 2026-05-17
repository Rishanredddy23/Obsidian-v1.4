const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Chat persistence
  saveChat: (chat) => ipcRenderer.invoke('save-chat', chat),
  loadChats: () => ipcRenderer.invoke('load-chats'),
  loadChat: (id) => ipcRenderer.invoke('load-chat', id),
  deleteChat: (id) => ipcRenderer.invoke('delete-chat', id),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),

  // Streaming chat
  startChatStream: (p) => ipcRenderer.invoke('start-chat-stream', p),
  onStreamToken: (cb) => {
    const listener = (_e, d) => cb(d)
    ipcRenderer.on('chat-stream-token', listener)
    return () => ipcRenderer.removeListener('chat-stream-token', listener)
  },
  onStreamDone: (cb) => {
    const listener = (_e, d) => cb(d)
    ipcRenderer.on('chat-stream-done', listener)
    return () => ipcRenderer.removeListener('chat-stream-done', listener)
  },
  onStreamError: (cb) => {
    const listener = (_e, d) => cb(d)
    ipcRenderer.on('chat-stream-error', listener)
    return () => ipcRenderer.removeListener('chat-stream-error', listener)
  },
  removeStreamListeners: () => {
    ipcRenderer.removeAllListeners('chat-stream-token')
    ipcRenderer.removeAllListeners('chat-stream-done')
    ipcRenderer.removeAllListeners('chat-stream-error')
  },

  // Workspace / filesystem
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  scanDirectory: (p, d) => ipcRenderer.invoke('scan-directory', p, d),
  listAllFiles: (p, d) => ipcRenderer.invoke('list-all-files', p, d),
  readFile: (p) => ipcRenderer.invoke('read-file', p),
  readFiles: (ps) => ipcRenderer.invoke('read-files', ps),
  writeFile: (p, c) => ipcRenderer.invoke('write-file', p, c),
  deleteFileFn: (p) => ipcRenderer.invoke('delete-file-fs', p),
  renameFile: (o, n) => ipcRenderer.invoke('rename-file', o, n),
  createDirectory: (p) => ipcRenderer.invoke('create-directory', p),
  pathExists: (p) => ipcRenderer.invoke('path-exists', p),
  openInIDE: (ide, ws) => ipcRenderer.invoke('open-in-ide', ide, ws),
  showConfirm: (t, d) => ipcRenderer.invoke('show-confirm', t, d),

  // Terminal
  runTerminalCommand: (p) => ipcRenderer.invoke('run-terminal-command', p),
  killTerminalCommand: (id) => ipcRenderer.invoke('kill-terminal-command', id),
  terminalStdin: (id, input) => ipcRenderer.invoke('terminal-stdin', id, input),
  onTerminalOutput: (cb) => ipcRenderer.on('terminal-output', (_e, d) => cb(d)),
  onTerminalExit: (cb) => ipcRenderer.on('terminal-exit', (_e, d) => cb(d)),
  removeTerminalListeners: () => {
    ipcRenderer.removeAllListeners('terminal-output')
    ipcRenderer.removeAllListeners('terminal-exit')
  },

  // Window
  winMinimize: () => ipcRenderer.send('win-minimize'),
  winMaximize: () => ipcRenderer.send('win-maximize'),
  winClose: () => ipcRenderer.send('win-close'),
})
