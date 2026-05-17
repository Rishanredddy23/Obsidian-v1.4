export function resolveWorkspacePath(workspacePath, actionPath) {
  if (!workspacePath) return actionPath
  if (actionPath.includes(':')) return actionPath
  const normalized = actionPath.replace(/^[/\\]+/, '')
  return `${workspacePath}/${normalized}`.replace(/\//g, '\\')
}

export function toWorkspaceRelativePath(workspacePath, actionPath) {
  if (!workspacePath || !actionPath) return actionPath
  const normalizedWorkspace = workspacePath.replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase()
  const normalizedAction = actionPath.replace(/\//g, '\\')
  if (normalizedAction.toLowerCase().startsWith(`${normalizedWorkspace}\\`)) {
    return normalizedAction.slice(workspacePath.replace(/\//g, '\\').replace(/\\+$/, '').length + 1).replace(/\\/g, '/')
  }
  return normalizedAction.replace(/\\/g, '/').replace(/^[/\\]+/, '')
}

export function isSafeWorkspaceRelativePath(actionPath) {
  if (!actionPath || actionPath.includes('\0')) return false
  if (actionPath.includes(':')) return true
  const parts = actionPath.replace(/\\/g, '/').split('/')
  return !parts.includes('..')
}

export function summarizeFileActions(actions = [], workspacePath = '') {
  const files = actions.filter(a => a.type === 'file').map(a => toWorkspaceRelativePath(workspacePath, a.path))
  const commands = actions.filter(a => a.type === 'terminal').map(a => a.command)
  return { files, commands }
}
