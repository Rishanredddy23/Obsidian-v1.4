const { ipcMain } = require('electron')
const { spawn } = require('child_process')

const activeProcesses = new Map()

function setupTerminalIPC() {
  // Run command with streaming output
  ipcMain.handle('run-terminal-command', async (event, { commandId, command, cwd }) => {
    return new Promise((resolve) => {
      try {
        const isWin = process.platform === 'win32'
        const shell = isWin ? 'powershell.exe' : '/bin/bash'
        const args = isWin ? ['-NoProfile', '-Command', command] : ['-c', command]

        const proc = spawn(shell, args, {
          cwd: cwd || process.cwd(),
          env: { ...process.env, FORCE_COLOR: '0' },
          stdio: ['pipe', 'pipe', 'pipe'],
        })

        activeProcesses.set(commandId, proc)

        proc.stdout.on('data', (data) => {
          if (!event.sender.isDestroyed()) {
            event.sender.send('terminal-output', { commandId, type: 'stdout', data: data.toString() })
          }
        })

        proc.stderr.on('data', (data) => {
          if (!event.sender.isDestroyed()) {
            event.sender.send('terminal-output', { commandId, type: 'stderr', data: data.toString() })
          }
        })

        proc.on('close', (code) => {
          activeProcesses.delete(commandId)
          if (!event.sender.isDestroyed()) {
            event.sender.send('terminal-exit', { commandId, code: code ?? 0 })
          }
          resolve({ exitCode: code ?? 0 })
        })

        proc.on('error', (err) => {
          activeProcesses.delete(commandId)
          if (!event.sender.isDestroyed()) {
            event.sender.send('terminal-output', { commandId, type: 'error', data: err.message })
            event.sender.send('terminal-exit', { commandId, code: 1 })
          }
          resolve({ exitCode: 1, error: err.message })
        })

        // 5 minute timeout
        setTimeout(() => {
          if (activeProcesses.has(commandId)) {
            proc.kill()
            activeProcesses.delete(commandId)
            if (!event.sender.isDestroyed()) {
              event.sender.send('terminal-output', { commandId, type: 'error', data: 'Timed out after 5 minutes' })
              event.sender.send('terminal-exit', { commandId, code: 124 })
            }
          }
        }, 300000)

        // Resolve immediately to not block - output streams via events
        // Actually we want to wait for completion
      } catch (err) {
        if (!event.sender.isDestroyed()) {
          event.sender.send('terminal-output', { commandId, type: 'error', data: err.message })
          event.sender.send('terminal-exit', { commandId, code: 1 })
        }
        resolve({ exitCode: 1, error: err.message })
      }
    })
  })

  // Kill a running command
  ipcMain.handle('kill-terminal-command', async (_e, commandId) => {
    const proc = activeProcesses.get(commandId)
    if (proc) {
      proc.kill('SIGTERM')
      activeProcesses.delete(commandId)
      return { success: true }
    }
    return { success: false, error: 'Process not found' }
  })

  // Send stdin input
  ipcMain.handle('terminal-stdin', async (_e, commandId, input) => {
    const proc = activeProcesses.get(commandId)
    if (proc && !proc.stdin.destroyed) {
      proc.stdin.write(input)
      return { success: true }
    }
    return { success: false }
  })
}

module.exports = { setupTerminalIPC }
