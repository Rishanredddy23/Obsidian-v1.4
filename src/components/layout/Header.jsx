import React from 'react'
import { useApp } from '../../contexts/AppContext'
import useWorkflowStore from '../../stores/workflowStore'
import { Minus, Square, X, Settings, PanelLeftClose, PanelLeftOpen, Zap, ZapOff } from 'lucide-react'

const isElectron = typeof window !== 'undefined' && !!window.electronAPI

export default function Header() {
  const {
    currentConversation, sidebarOpen, setSidebarOpen,
    setShowSettings, showSettings,
    workspacePath, openInIDE, selectedIDE,
  } = useApp()

  const activeWorkflowId = useWorkflowStore((s) => s.activeWorkflowId)
  const activeWf = useWorkflowStore((s) => s.savedWorkflows.find((w) => w.id === s.activeWorkflowId))
  const deactivateWorkflow = useWorkflowStore((s) => s.deactivateWorkflow)

  return (
    <header className="titlebar-drag flex items-center justify-between h-12 px-4 border-b border-zinc-200/80 bg-white/80 backdrop-blur-sm flex-shrink-0 z-20">
      {/* Left: logo + toggle + title */}
      <div className="flex items-center gap-2.5 titlebar-no-drag min-w-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-obsidian-500 to-obsidian-700 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[10px] font-bold">O</span>
        </div>
        <span className="text-xs font-semibold text-zinc-700 flex-shrink-0 hidden sm:inline">Obsidian</span>
        <div className="w-px h-5 bg-zinc-200 flex-shrink-0" />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors flex-shrink-0"
          title="Toggle sidebar"
          id="toggle-sidebar-btn"
        >
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
      </div>

      {/* Center: conversation/workflow name */}
      <div className="flex items-center gap-2 titlebar-no-drag">
        <h2 className="text-sm font-medium text-zinc-700 truncate max-w-[300px]">
          {showSettings ? 'Settings' : currentConversation?.title || 'New conversation'}
        </h2>
        {activeWf && !showSettings && (
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
            <Zap size={10} className="text-emerald-600" />
            <span className="text-[10px] font-medium text-emerald-700 truncate max-w-[120px]">{activeWf.name}</span>
            <button onClick={deactivateWorkflow} className="text-emerald-500 hover:text-red-500 transition-colors" title="Deactivate workflow">
              <X size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Right: IDE + settings + window controls */}
      <div className="flex items-center gap-1 titlebar-no-drag">
        {workspacePath && (
          <button
            onClick={openInIDE}
            className="flex items-center gap-1.5 px-2 py-1 mr-1 rounded-lg bg-obsidian-50 hover:bg-obsidian-100 text-obsidian-600 transition-colors"
            title={`Open in ${selectedIDE?.label || 'IDE'}`}
          >
            <span className="text-[10px] font-medium whitespace-nowrap">Open in {selectedIDE?.label || 'IDE'}</span>
          </button>
        )}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-obsidian-50 text-obsidian-600' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700'}`}
          title="Settings" id="settings-btn"
        >
          <Settings size={17} />
        </button>

        {isElectron && (
          <div className="flex items-center ml-2 gap-0.5">
            <button onClick={() => window.electronAPI.winMinimize()} className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors" id="win-minimize">
              <Minus size={14} />
            </button>
            <button onClick={() => window.electronAPI.winMaximize()} className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors" id="win-maximize">
              <Square size={12} />
            </button>
            <button onClick={() => window.electronAPI.winClose()} className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors" id="win-close">
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
