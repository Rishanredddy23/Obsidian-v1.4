import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Lock, Trash2, Shield, ShieldOff } from 'lucide-react'

const PRESETS = [
  { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o' },
  { label: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-20241022' },
  { label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o' },
  { label: 'NVIDIA NIM', baseUrl: 'https://integrate.api.nvidia.com/v1', model: 'meta/llama-3.1-70b-instruct' },
  { label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.1-70b-versatile' },
  { label: 'Ollama', baseUrl: 'http://localhost:11434/v1', model: 'llama3' },
  { label: 'Custom', baseUrl: '', model: '' },
]

export default function NodeSettingsPanel({ node, onUpdate, onDelete, onClose }) {
  const isBuiltIn = !!node.data?.agentId?.startsWith('marketplace-') || node.data?.agentId === 'mixer'
  const isCustom = node.data?.agentId === 'custom-agent'
  const isInputNode = node.type === 'inputNode'
  const isOutputNode = node.type === 'outputNode'
  const promptEditable = isCustom || !isBuiltIn

  const [apiKey, setApiKey] = useState(node.data?.apiKey || '')
  const [baseUrl, setBaseUrl] = useState(node.data?.baseUrl || 'https://api.openai.com/v1')
  const [model, setModel] = useState(node.data?.model || 'gpt-4o')
  const [systemPrompt, setSystemPrompt] = useState(node.data?.systemPrompt || '')
  const [workspaceAccess, setWorkspaceAccess] = useState(node.data?.workspaceAccess !== false)
  const [label, setLabel] = useState(node.data?.label || '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setApiKey(node.data?.apiKey || '')
    setBaseUrl(node.data?.baseUrl || 'https://api.openai.com/v1')
    setModel(node.data?.model || 'gpt-4o')
    setSystemPrompt(node.data?.systemPrompt || '')
    setWorkspaceAccess(node.data?.workspaceAccess !== false)
    setLabel(node.data?.label || '')
    setSaved(false)
  }, [node.id])

  const applyPreset = (p) => { setBaseUrl(p.baseUrl); setModel(p.model) }

  const handleSave = () => {
    onUpdate(node.id, {
      data: {
        ...node.data,
        label,
        apiKey,
        baseUrl,
        model,
        systemPrompt: promptEditable ? systemPrompt : node.data.systemPrompt,
        workspaceAccess,
      },
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  // Simple info panel for Input/Output nodes
  if (isInputNode || isOutputNode) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
        className="absolute right-4 top-20 w-[320px] bg-white rounded-2xl shadow-2xl border border-zinc-200 z-30 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">{node.data?.icon}</span>
            <h3 className="text-sm font-semibold text-zinc-800">{node.data?.label}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400"><X size={16} /></button>
        </div>
        <div className="p-5">
          <p className="text-xs text-zinc-500 leading-relaxed">
            {isInputNode
              ? 'Receives the user prompt and passes it to connected agents.'
              : 'Collects all agent outputs and returns the final result to chat.'}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="absolute right-4 top-20 w-[360px] bg-white rounded-2xl shadow-2xl border border-zinc-200 z-30 overflow-hidden max-h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0">{node.data?.icon}</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)}
            className="text-sm font-semibold text-zinc-800 bg-transparent outline-none border-b border-transparent focus:border-obsidian-300 w-full" />
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 ml-2 flex-shrink-0"><X size={16} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Provider Tabs */}
        <div>
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Provider</label>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => applyPreset(p)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${baseUrl === p.baseUrl ? 'border-obsidian-300 bg-obsidian-50 text-obsidian-600' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div>
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">API Key</label>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..."
            className="w-full mt-1 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-obsidian-300 focus:bg-white transition-all" />
        </div>

        {/* Base URL + Model */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Base URL</label>
            <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1"
              className="w-full mt-1 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-obsidian-300 focus:bg-white transition-all" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Model</label>
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-4o"
              className="w-full mt-1 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-obsidian-300 focus:bg-white transition-all" />
          </div>
        </div>

        {/* System Prompt */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">System Prompt</label>
            {!promptEditable && <Lock size={10} className="text-zinc-400" title="Locked — built-in agent" />}
          </div>
          <textarea
            value={promptEditable ? systemPrompt : node.data.systemPrompt}
            onChange={(e) => promptEditable && setSystemPrompt(e.target.value)}
            readOnly={!promptEditable}
            rows={4}
            className={`w-full px-3 py-2 text-xs border rounded-lg outline-none transition-all resize-none leading-relaxed ${!promptEditable
              ? 'bg-zinc-100 border-zinc-200 text-zinc-500 cursor-not-allowed'
              : 'bg-zinc-50 border-zinc-200 focus:border-obsidian-300 focus:bg-white text-zinc-700'}`}
          />
          {!promptEditable && (
            <p className="text-[9px] text-zinc-400 mt-1 flex items-center gap-1"><Lock size={8} /> Built-in prompt — read only 🔒</p>
          )}
        </div>

        {/* Workspace Access Toggle */}
        <div className="border border-zinc-200 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {workspaceAccess ? <Shield size={14} className="text-green-500" /> : <ShieldOff size={14} className="text-zinc-400" />}
              <div>
                <p className="text-xs font-medium text-zinc-700">Workspace Access</p>
                <p className="text-[9px] text-zinc-400">{workspaceAccess ? '🟢 Agent can modify files' : '⚪ Read only mode'}</p>
              </div>
            </div>
            <button onClick={() => setWorkspaceAccess(!workspaceAccess)}
              className={`relative w-10 h-5 rounded-full transition-colors ${workspaceAccess ? 'bg-green-500' : 'bg-zinc-200'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${workspaceAccess ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
          {workspaceAccess && (
            <p className="text-[9px] text-amber-600 mt-2 bg-amber-50 rounded-md px-2 py-1">
              ⚠️ Agent can create, edit, and delete files inside workspace.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between flex-shrink-0">
        <button onClick={() => { onDelete(node.id); onClose() }}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium transition-colors">
          <Trash2 size={12} /> Delete
        </button>
        <button onClick={handleSave}
          className={`px-4 py-1.5 text-xs rounded-lg font-medium transition-all ${saved
            ? 'bg-emerald-500 text-white'
            : 'bg-obsidian-600 text-white hover:bg-obsidian-700'}`}>
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>
    </motion.div>
  )
}
