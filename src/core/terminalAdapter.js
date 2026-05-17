export const adaptCommandForOS = (command) => {
  const isWindows = navigator.userAgent.toLowerCase().includes('windows')
  
  if (isWindows) {
    if (command.startsWith('ls')) {
      return command.replace(/^ls(\s+-la?)?/, 'dir')
    }
    if (command.startsWith('rm -rf') || command.startsWith('rm -r')) {
      return command.replace(/^rm\s+-rf?/, 'rmdir /s /q')
    }
    if (command.startsWith('rm ')) {
      return command.replace(/^rm\s+/, 'del ')
    }
    if (command.startsWith('pwd')) {
      return 'cd'
    }
    if (command.startsWith('cp ')) {
      return command.replace(/^cp\s+/, 'copy ')
    }
    if (command.startsWith('mv ')) {
      return command.replace(/^mv\s+/, 'move ')
    }
    if (command.includes('npm install') || command.includes('npm i')) {
      // Windows sometimes needs npm.cmd instead of just npm in some environments
      // but usually 'npm' works in powershell. Just in case, we leave it, 
      // but add --no-fund --no-audit to speed it up.
      return command
    }
  }

  return command
}
