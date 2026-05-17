import { adaptCommandForOS } from './terminalAdapter'

export class TerminalManager {
  constructor(runCommandFn, addActivityFn) {
    this.runCommand = runCommandFn
    this.addActivity = addActivityFn
  }

  async executeWithTimeout(command, timeoutMs = 60000) {
    const adaptedCommand = adaptCommandForOS(command)
    this.addActivity('terminal', `Executing: ${adaptedCommand}`)

    let timeoutId
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Command execution timed out')), timeoutMs)
    })

    try {
      const result = await Promise.race([
        this.runCommand(adaptedCommand),
        timeoutPromise
      ])
      clearTimeout(timeoutId)
      return result
    } catch (err) {
      clearTimeout(timeoutId)
      return { exitCode: 1, output: `[Error] ${err.message}` }
    }
  }

  async executeWithRetry(command, maxRetries = 2, timeoutMs = 60000) {
    let attempt = 0
    let lastResult = null

    while (attempt <= maxRetries) {
      if (attempt > 0) {
        this.addActivity('terminal', `Retrying command (${attempt}/${maxRetries}): ${command}`)
        // Exponential backoff: wait 2s, then 5s
        const backoffMs = attempt === 1 ? 2000 : 5000
        await new Promise(r => setTimeout(r, backoffMs))
      }

      const result = await this.executeWithTimeout(command, timeoutMs)
      
      if (result.exitCode === 0) {
        // Success
        return result
      }

      lastResult = result

      // Auto-fix for npm install
      if (command.includes('npm install') && result.output?.includes('ERESOLVE')) {
        this.addActivity('terminal', `Detected npm conflict. Retrying with --legacy-peer-deps...`)
        command = `${command} --legacy-peer-deps`
      } else if (command.includes('npm install') && result.output?.includes('npm ERR!')) {
        this.addActivity('terminal', `npm install failed. Retrying...`)
      } else {
        // Not a known auto-fixable issue, just retry
      }

      attempt++
    }

    this.addActivity('terminal', `Command failed after ${maxRetries} retries: ${command}`)
    return lastResult
  }
}
