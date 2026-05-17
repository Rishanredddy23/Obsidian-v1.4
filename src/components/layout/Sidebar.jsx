import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import useWorkflowStore from '../../stores/workflowStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, MessageSquare, Bot, Trash2, Pencil, Check, X, FolderOpen, Terminal, Workflow, Zap } from 'lucide-react'

function groupByDate(conversations) {
  const groups = { Today: [], Yesterday: [], 'Previous 7 Days': [], Older: [] }
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const week = new Date(today); week.setDate(week.getDate() - 7)

  for (const c of conversations) {
    const d = new Date(c.updatedAt || c.createdAt)
    if (d >= today) groups.Today.push(c)
    else if (d >= yesterday) groups.Yesterday.push(c)
    else if (d >= week) groups['Previous 7 Days'].push(c)
    else groups.Older.push(c)
  }
  return Object.entries(groups).filter(([, v]) => v.length > 0)
}

function ChatItem({ conv, isActive, onOpen, onDelete, onRename }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(conv.title)
  const handleRename = () => { onRename(conv.id, title); setEditing(false) }

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
        isActive ? 'bg-obsidian-50 text-obsidian-700' : 'text-zinc-600 hover:bg-zinc-100'
      }`}
      onClick={() => !editing && onOpen(conv.id)}
      id={`chat-item-${conv.id}`}
    >
      <MessageSquare size={14} className="flex-shrink-0 opacity-50" />
      {editing ? (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <input value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRename()}
            className="flex-1 bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-xs outline-none focus:border-obsidian-400"
            autoFocus onClick={e => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); handleRename() }} className="text-green-500 hover:text-green-600"><Check size={12} /></button>
          <button onClick={(e) => { e.stopPropagation(); setEditing(false); setTitle(conv.title) }} className="text-zinc-400 hover:text-zinc-600"><X size={12} /></button>
        </div>
      ) : (
        <>
          <span className="truncate flex-1">{conv.title || 'Untitled'}</span>
          <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
            <button onClick={e => { e.stopPropagation(); setEditing(true) }}
              className="p-1 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600 transition-colors"><Pencil size={11} /></button>
            <button onClick={e => { e.stopPropagation(); onDelete(conv.id) }}
              className="p-1 rounded hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={11} /></button>
          </div>
        </>
      )}
    </div>
  )
}

export default function Sidebar() {
  const {
    conversations, currentConvId, sidebarOpen, searchQuery, setSearchQuery,
    createNewChat, openChat, deleteChat, renameChat, setShowAgentModal, agents,
    openFolderDialog, workspacePath, terminalVisible, setTerminalVisible,
    setShowWorkflowEditor,
  } = useApp()

  const activeWorkflowId = useWorkflowStore((s) => s.activeWorkflowId)
  const activeWf = useWorkflowStore((s) => s.savedWorkflows.find(w => w.id === s.activeWorkflowId))

  const grouped = groupByDate(conversations)
  const enabledCount = agents.filter(a => a.enabled).length
  const wsName = workspacePath ? workspacePath.split(/[\\/]/).pop() : null

  return (
    <AnimatePresence initial={false}>
      {sidebarOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col h-full bg-white border-r border-zinc-200/80 overflow-hidden flex-shrink-0"
          id="sidebar"
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-obsidian-500 to-obsidian-700 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">O</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-900 tracking-tight">Obsidian</h1>
              <p className="text-[10px] text-zinc-400 font-medium">Multi-Agent Intelligence</p>
            </div>
          </div>

          {/* New Chat */}
          <div className="px-3 pt-3 pb-1">
            <button onClick={createNewChat}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 hover:border-obsidian-300 hover:bg-obsidian-50 text-zinc-600 hover:text-obsidian-600 text-sm font-medium transition-all"
              id="new-chat-btn">
              <Plus size={15} /> New Chat
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-100 text-xs text-zinc-700 placeholder:text-zinc-400 outline-none focus:border-obsidian-300 focus:bg-white transition-all"
                id="search-chats" />
            </div>
          </div>

          {/* Active Workflow Indicator */}
          {activeWf && (
            <div className="px-3 pb-1">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <Zap size={13} className="text-emerald-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-emerald-700 truncate">{activeWf.name}</p>
                  <p className="text-[9px] text-emerald-600">Active Workflow</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              </div>
            </div>
          )}

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-3">
            {grouped.length === 0 && (
              <p className="text-xs text-zinc-400 text-center pt-8">No conversations yet</p>
            )}
            {grouped.map(([label, chats]) => (
              <div key={label}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-3 py-1">{label}</p>
                {chats.map(c => (
                  <ChatItem key={c.id} conv={c} isActive={c.id === currentConvId} onOpen={openChat} onDelete={deleteChat} onRename={renameChat} />
                ))}
              </div>
            ))}
          </div>

          {/* Bottom: Workspace + Workflow + Terminal + Agents */}
          <div className="border-t border-zinc-100 p-3 space-y-1">
            <button onClick={openFolderDialog}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-50 text-zinc-600 hover:text-zinc-800 text-sm transition-colors"
              id="open-workspace-btn">
              <FolderOpen size={15} />
              <span>{wsName ? wsName : 'Open Workspace'}</span>
              {wsName && <span className="ml-auto w-2 h-2 rounded-full bg-green-400" />}
            </button>
            <button onClick={() => setShowWorkflowEditor(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-obsidian-50 text-zinc-600 hover:text-obsidian-600 text-sm transition-colors"
              id="workflow-editor-btn">
              <Workflow size={15} />
              <span>Workflow Editor</span>
              {activeWf && <span className="ml-auto text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-medium">Active</span>}
            </button>
            <button onClick={() => setTerminalVisible(!terminalVisible)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${terminalVisible ? 'bg-zinc-100 text-zinc-800' : 'hover:bg-zinc-50 text-zinc-600 hover:text-zinc-800'}`}
              id="toggle-terminal-btn">
              <Terminal size={15} />
              <span>Terminal</span>
            </button>
            <button onClick={() => setShowAgentModal(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-50 text-zinc-600 hover:text-zinc-800 text-sm transition-colors"
              id="open-agents-btn">
              <Bot size={15} />
              <span>Agents</span>
              <span className="ml-auto text-[10px] bg-obsidian-100 text-obsidian-600 px-1.5 py-0.5 rounded-full font-medium">
                {enabledCount} active
              </span>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
