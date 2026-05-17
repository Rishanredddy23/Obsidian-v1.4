const MAX_STATUS_LENGTH = 1200

export function createExecutionEvent(type, node, message, metadata = {}) {
  return {
    type,
    node,
    message,
    metadata,
    timestamp: new Date().toISOString(),
  }
}

export function clampStatusText(text, maxLength = MAX_STATUS_LENGTH) {
  const value = String(text || '').replace(/\s+\n/g, '\n').trim()
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength).trim()}\n\nOutput truncated. Generated source was written to workspace files.`
}

export function summarizeActionResults(results = []) {
  const files = results.filter(r => r.type === 'file')
  const terminals = results.filter(r => r.type === 'terminal')
  const createdFiles = files.filter(r => r.success).map(r => r.path)
  const failedFiles = files.filter(r => !r.success)

  const lines = []
  if (createdFiles.length) {
    lines.push(`Created/updated ${createdFiles.length} file${createdFiles.length === 1 ? '' : 's'}:`)
    for (const file of createdFiles.slice(0, 20)) lines.push(`- ${file}`)
    if (createdFiles.length > 20) lines.push(`- ...and ${createdFiles.length - 20} more`)
  }
  if (failedFiles.length) {
    lines.push(`Failed to write ${failedFiles.length} file${failedFiles.length === 1 ? '' : 's'}:`)
    for (const file of failedFiles.slice(0, 10)) lines.push(`- ${file.path}: ${file.error || 'Unknown error'}`)
  }
  for (const terminal of terminals.slice(0, 5)) {
    lines.push(`Command "${terminal.command}" exited with ${terminal.exitCode}`)
  }
  return lines.join('\n')
}

export function createNodeStatus(nodeName, message, metadata = {}) {
  return clampStatusText(`${nodeName}: ${message}${metadata.filesCreated ? `\nFiles created: ${metadata.filesCreated}` : ''}`)
}
