const { ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')

const IGNORED = [
  'node_modules', '.git', '__pycache__', '.next', 'dist', 'build',
  '.venv', 'venv', '.cache', '.parcel-cache', 'coverage', '.nyc_output',
  '.DS_Store', 'Thumbs.db', '.idea', '.vs',
]
const MAX_FILE_SIZE = 1024 * 1024 // 1MB

function setupWorkspaceIPC(getMainWindow) {
  // Open folder picker
  ipcMain.handle('open-folder-dialog', async () => {
    const win = getMainWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })

  // Recursive directory scan
  ipcMain.handle('scan-directory', async (_e, dirPath, maxDepth = 6) => {
    function scan(dir, depth = 0) {
      if (depth > maxDepth) return []
      const entries = []
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true })
        for (const item of items) {
          if (IGNORED.includes(item.name) || (item.name.startsWith('.') && item.name !== '.env')) continue
          const fullPath = path.join(dir, item.name)
          if (item.isDirectory()) {
            entries.push({ name: item.name, path: fullPath, type: 'directory', children: scan(fullPath, depth + 1) })
          } else {
            try {
              const stats = fs.statSync(fullPath)
              entries.push({ name: item.name, path: fullPath, type: 'file', size: stats.size, ext: path.extname(item.name) })
            } catch {}
          }
        }
      } catch {}
      return entries.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
    }
    return scan(dirPath)
  })

  // Flat file list for context building
  ipcMain.handle('list-all-files', async (_e, dirPath, maxDepth = 6) => {
    const files = []
    function walk(dir, depth = 0) {
      if (depth > maxDepth) return
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true })
        for (const item of items) {
          if (IGNORED.includes(item.name) || (item.name.startsWith('.') && item.name !== '.env')) continue
          const fullPath = path.join(dir, item.name)
          if (item.isDirectory()) { walk(fullPath, depth + 1) }
          else { files.push(path.relative(dirPath, fullPath).replace(/\\/g, '/')) }
        }
      } catch {}
    }
    walk(dirPath)
    return files
  })

  // Read file
  ipcMain.handle('read-file', async (_e, filePath) => {
    try {
      const stats = fs.statSync(filePath)
      if (stats.size > MAX_FILE_SIZE) return { error: 'File too large (>1MB)', size: stats.size }
      const content = fs.readFileSync(filePath, 'utf-8')
      return { content, size: stats.size }
    } catch (err) {
      return { error: err.message }
    }
  })

  // Read multiple files
  ipcMain.handle('read-files', async (_e, filePaths) => {
    const results = {}
    for (const fp of filePaths) {
      try {
        const stats = fs.statSync(fp)
        if (stats.size <= MAX_FILE_SIZE) {
          results[fp] = fs.readFileSync(fp, 'utf-8')
        }
      } catch {}
    }
    return results
  })

  // Write file (creates parent dirs)
  ipcMain.handle('write-file', async (_e, filePath, content) => {
    try {
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(filePath, content, 'utf-8')
      return { success: true }
    } catch (err) {
      return { error: err.message }
    }
  })

  // Delete file
  ipcMain.handle('delete-file-fs', async (_e, filePath) => {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      return { success: true }
    } catch (err) {
      return { error: err.message }
    }
  })

  // Rename / move file
  ipcMain.handle('rename-file', async (_e, oldPath, newPath) => {
    try {
      const dir = path.dirname(newPath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.renameSync(oldPath, newPath)
      return { success: true }
    } catch (err) {
      return { error: err.message }
    }
  })

  // Create directory
  ipcMain.handle('create-directory', async (_e, dirPath) => {
    try {
      fs.mkdirSync(dirPath, { recursive: true })
      return { success: true }
    } catch (err) {
      return { error: err.message }
    }
  })

  // Check if path exists
  ipcMain.handle('path-exists', async (_e, p) => {
    return fs.existsSync(p)
  })

  // Open in IDE
  ipcMain.handle('open-in-ide', async (_e, ideCommand, workspacePath) => {
    try {
      const { exec } = require('child_process')
      exec(`"${ideCommand}" "${workspacePath}"`, (err) => {
        if (err) console.error('IDE launch error:', err.message)
      })
      return { success: true }
    } catch (err) {
      return { error: err.message }
    }
  })

  // Confirm dialog for permissions
  ipcMain.handle('show-confirm', async (_e, title, detail) => {
    const win = getMainWindow()
    if (!win) return false
    const result = await dialog.showMessageBox(win, {
      type: 'question',
      buttons: ['Allow', 'Deny'],
      defaultId: 0,
      title: 'Obsidian — Permission Request',
      message: title,
      detail: detail || '',
    })
    return result.response === 0
  })
}

module.exports = { setupWorkspaceIPC }
