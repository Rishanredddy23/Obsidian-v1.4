export function shouldProvideWorkspaceAccess(nodeData, workspacePath, isElectron) {
  return !!(isElectron && workspacePath && nodeData?.workspaceAccess !== false)
}

export function createWorkspaceSummary(workspacePath, fileList = []) {
  return {
    workspacePath,
    fileCount: fileList.length,
    files: fileList.slice(0, 200),
  }
}
