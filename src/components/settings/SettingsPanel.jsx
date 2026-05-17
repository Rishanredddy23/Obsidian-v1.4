import React from 'react'
import { useApp } from '../../contexts/AppContext'
import { motion } from 'framer-motion'
import { Download, Database, Palette, Cpu, Keyboard, Info } from 'lucide-react'
import { storage } from '../../utils/storage'

export default function SettingsPanel() {
  const { 
    agents, workflowMode, allConversations, 
    selectedIDE, setSelectedIDE, approvalMode, setApprovalMode 
  } = useApp()

  const IDE_OPTIONS = [
    { label: 'VS Code', command: 'code' },
    { label: 'Cursor', command: 'cursor' },
    { label: 'Windsurf', command: 'windsurf' },
    { label: 'Arduino IDE', command: 'arduino-ide' }
  ]

  const exportConversations = async () => {
    try {
      const allChats = []
      for (const conv of allConversations) {
        const chat = await storage.loadChat(conv.id)
        if (chat) allChats.push(chat)
      }
      const blob = new Blob([JSON.stringify(allChats, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `obsidian-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-xl font-semibold text-zinc-900 mb-1">Settings</h1>
          <p className="text-sm text-zinc-500 mb-8">Manage your Obsidian preferences</p>

          <div className="space-y-6">
            {/* Appearance */}
            <SettingsSection icon={Palette} title="Appearance" description="Customize the look and feel">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-700 font-medium">Theme</p>
                  <p className="text-xs text-zinc-500">Choose your preferred theme</p>
                </div>
                <div className="flex bg-zinc-100 rounded-lg p-0.5">
                  <button className="px-3 py-1 rounded-md text-xs font-medium bg-white text-zinc-900 shadow-sm">Light</button>
                  <button className="px-3 py-1 rounded-md text-xs font-medium text-zinc-500 hover:text-zinc-700">Dark</button>
                </div>
              </div>
            </SettingsSection>

            {/* API Management */}
            <SettingsSection icon={Cpu} title="API Management" description="Overview of configured agents">
              <div className="space-y-2">
                {agents.map((a, i) => (
                  <div key={a.id} className="flex items-center justify-between px-3 py-2 bg-zinc-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-obsidian-100 text-obsidian-600 flex items-center justify-center text-[9px] font-bold">{i + 1}</span>
                      <span className="text-sm text-zinc-700">{a.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 bg-zinc-200/60 px-2 py-0.5 rounded">{a.model}</span>
                      <span className={`w-2 h-2 rounded-full ${a.enabled ? 'bg-green-400' : 'bg-zinc-300'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </SettingsSection>

            {/* Workspace & IDE */}
            <SettingsSection icon={Keyboard} title="Workspace & IDE" description="Configure your development environment">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-700 font-medium">Default IDE</p>
                    <p className="text-[10px] text-zinc-500">Select IDE to open projects</p>
                  </div>
                  <select
                    value={selectedIDE?.label || 'VS Code'}
                    onChange={(e) => {
                      const opt = IDE_OPTIONS.find(o => o.label === e.target.value)
                      if (opt && setSelectedIDE) setSelectedIDE(opt)
                    }}
                    className="bg-white border border-zinc-200 rounded text-xs px-2 py-1 outline-none focus:border-obsidian-400"
                  >
                    {IDE_OPTIONS.map(opt => (
                      <option key={opt.label} value={opt.label}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                  <div>
                    <p className="text-sm text-zinc-700 font-medium">Agent Permissions</p>
                    <p className="text-[10px] text-zinc-500">File and terminal execution</p>
                  </div>
                  <select
                    value={approvalMode || 'ask'}
                    onChange={(e) => setApprovalMode && setApprovalMode(e.target.value)}
                    className="bg-white border border-zinc-200 rounded text-xs px-2 py-1 outline-none focus:border-obsidian-400"
                  >
                    <option value="ask">Ask for Approval</option>
                    <option value="auto">Auto-Approve Safe</option>
                    <option value="autonomous">Fully Autonomous</option>
                  </select>
                </div>
              </div>
            </SettingsSection>

            {/* Chat Memory */}
            <SettingsSection icon={Database} title="Chat Memory" description="Manage conversation storage">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-700 font-medium">Stored Conversations</p>
                  <p className="text-xs text-zinc-500">{allConversations.length} conversation{allConversations.length !== 1 ? 's' : ''} saved locally</p>
                </div>
                <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">Active</span>
              </div>
            </SettingsSection>

            {/* Export */}
            <SettingsSection icon={Download} title="Export" description="Export your data">
              <button
                onClick={exportConversations}
                className="flex items-center gap-2 px-4 py-2 bg-obsidian-600 text-white text-sm rounded-lg hover:bg-obsidian-700 transition-colors font-medium"
                id="export-btn"
              >
                <Download size={14} />
                Export All Conversations
              </button>
            </SettingsSection>

            {/* Keyboard Shortcuts */}
            <SettingsSection icon={Keyboard} title="Keyboard Shortcuts" description="Quick reference">
              <div className="space-y-1.5">
                {[
                  ['Enter', 'Send message'],
                  ['Shift + Enter', 'New line'],
                  ['Ctrl + N', 'New conversation'],
                ].map(([keys, desc]) => (
                  <div key={keys} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-600">{desc}</span>
                    <kbd className="text-[10px] bg-zinc-100 border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded font-mono">{keys}</kbd>
                  </div>
                ))}
              </div>
            </SettingsSection>

            {/* About */}
            <SettingsSection icon={Info} title="About" description="Application information">
              <div className="text-sm text-zinc-600 space-y-1">
                <p><span className="font-medium text-zinc-800">Obsidian</span> v1.0.0</p>
                <p className="text-xs text-zinc-500">Multi-Agent Intelligence Platform</p>
                <p className="text-xs text-zinc-400 mt-2">Built with Electron • React • TailwindCSS</p>
              </div>
            </SettingsSection>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function SettingsSection({ icon: Icon, title, description, children }) {
  return (
    <div className="border border-zinc-200 rounded-xl p-5 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className="text-obsidian-500" />
        <div>
          <h3 className="text-sm font-semibold text-zinc-800">{title}</h3>
          <p className="text-[10px] text-zinc-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}
