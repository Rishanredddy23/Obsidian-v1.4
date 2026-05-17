import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { motion } from 'framer-motion'
import { Folder, FileText, ChevronRight, ChevronDown, FolderOpen, RefreshCw, FolderPlus } from 'lucide-react'

const EXT_COLORS = {
  '.js': 'text-yellow-500', '.jsx': 'text-yellow-500', '.ts': 'text-blue-500', '.tsx': 'text-blue-500',
  '.py': 'text-green-500', '.html': 'text-orange-500', '.css': 'text-purple-500', '.json': 'text-amber-600',
  '.md': 'text-zinc-500', '.cpp': 'text-blue-600', '.ino': 'text-teal-500',
}

function TreeNode({ node, depth = 0, onFileClick }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const isDir = node.type === 'directory'
  const color = EXT_COLORS[node.ext] || 'text-zinc-400'

  return (
    <div>
      <button
        onClick={() => isDir ? setExpanded(!expanded) : onFileClick(node.path)}
        className={`w-full flex items-center gap-1.5 px-2 py-[3px] text-[11px] hover:bg-zinc-100 rounded transition-colors text-left`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isDir ? (
          <>
            {expanded ? <ChevronDown size={10} className="text-zinc-400 flex-shrink-0" /> : <ChevronRight size={10} className="text-zinc-400 flex-shrink-0" />}
            {expanded ? <FolderOpen size={12} className="text-obsidian-400 flex-shrink-0" /> : <Folder size={12} className="text-obsidian-400 flex-shrink-0" />}
          </>
        ) : (
          <>
            <span className="w-[10px]" />
            <FileText size={12} className={`${color} flex-shrink-0`} />
          </>
        )}
        <span className="truncate text-zinc-700">{node.name}</span>
      </button>
      {isDir && expanded && node.children?.map(child => (
        <TreeNode key={child.path} node={child} depth={depth + 1} onFileClick={onFileClick} />
      ))}
    </div>
  )
}

export default function FileExplorer() {
  const { fileTree, workspacePath, openFolderDialog, refreshWorkspace, viewFile } = useApp()

  if (!workspacePath) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <FolderPlus size={24} className="text-zinc-300 mb-2" />
        <p className="text-[11px] text-zinc-500 mb-3">No workspace open</p>
        <button onClick={openFolderDialog} className="text-[11px] text-obsidian-600 hover:text-obsidian-700 font-medium">
          Open Folder
        </button>
      </div>
    )
  }

  const folderName = workspacePath.split(/[\\/]/).pop()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Explorer</span>
        <button onClick={refreshWorkspace} className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600" title="Refresh">
          <RefreshCw size={11} />
        </button>
      </div>
      <div className="px-1 py-1">
        <p className="text-[10px] font-semibold text-zinc-700 px-2 py-1 truncate" title={workspacePath}>{folderName}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-1 pb-2">
        {fileTree.map(node => (
          <TreeNode key={node.path} node={node} onFileClick={viewFile} />
        ))}
      </div>
    </div>
  )
}
