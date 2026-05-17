import React from 'react'
import { useApp } from '../../contexts/AppContext'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, GripVertical } from 'lucide-react'

const PRESETS = [
  { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o' },
  { label: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-20241022' },
  { label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o' },
  { label: 'NVIDIA NIM', baseUrl: 'https://integrate.api.nvidia.com/v1', model: 'meta/llama-3.1-70b-instruct' },
  { label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.1-70b-versatile' },
  { label: 'Ollama', baseUrl: 'http://localhost:11434/v1', model: 'llama3' },
  { label: 'Custom', baseUrl: '', model: '' },
]

function AgentCard({ agent, onUpdate, onRemove, index }) {
  const applyPreset = (preset) => {
    onUpdate(agent.id, { baseUrl: preset.baseUrl, model: preset.model })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="border border-zinc-200 rounded-xl p-4 bg-white hover:border-zinc-300 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-obsidian-100 text-obsidian-600 flex items-center justify-center text-[10px] font-bold">
            {index + 1}
          </div>
          <input
            value={agent.name}
            onChange={e => onUpdate(agent.id, { name: e.target.value })}
            className="text-sm font-medium text-zinc-800 bg-transparent outline-none border-b border-transparent focus:border-obsidian-300 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Enable toggle */}
          <button
            onClick={() => onUpdate(agent.id, { enabled: !agent.enabled })}
            className={`relative w-9 h-5 rounded-full transition-colors ${agent.enabled ? 'bg-obsidian-500' : 'bg-zinc-200'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${agent.enabled ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
          <button onClick={() => onRemove(agent.id)} className="p-1 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Provider presets */}
      <div className="flex flex-wrap gap-1 mb-3">
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              agent.baseUrl === p.baseUrl
                ? 'border-obsidian-300 bg-obsidian-50 text-obsidian-600'
                : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="space-y-2.5">
        <div>
          <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">API Key</label>
          <input
            type="password"
            value={agent.apiKey}
            onChange={e => onUpdate(agent.id, { apiKey: e.target.value })}
            placeholder="sk-..."
            className="w-full mt-0.5 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-obsidian-300 focus:bg-white transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Base URL</label>
            <input
              value={agent.baseUrl}
              onChange={e => onUpdate(agent.id, { baseUrl: e.target.value })}
              placeholder="https://api.openai.com"
              className="w-full mt-0.5 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-obsidian-300 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Model</label>
            <input
              value={agent.model}
              onChange={e => onUpdate(agent.id, { model: e.target.value })}
              placeholder="gpt-4o"
              className="w-full mt-0.5 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-obsidian-300 focus:bg-white transition-all"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">System Prompt</label>
          <textarea
            value={agent.systemPrompt}
            onChange={e => onUpdate(agent.id, { systemPrompt: e.target.value })}
            placeholder="You are a helpful assistant..."
            rows={2}
            className="w-full mt-0.5 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-obsidian-300 focus:bg-white transition-all resize-none"
          />
        </div>
      </div>
    </motion.div>
  )
}

export default function AgentModal() {
  const { agents, addAgent, updateAgent, removeAgent, setShowAgentModal } = useApp()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={() => setShowAgentModal(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-2xl max-h-[80vh] flex flex-col mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">AI Agents</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Configure your multi-agent workflow</p>
          </div>
          <button
            onClick={() => setShowAgentModal(false)}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Agent List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {agents.map((agent, i) => (
              <AgentCard key={agent.id} agent={agent} index={i} onUpdate={updateAgent} onRemove={removeAgent} />
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between">
          <button
            onClick={addAgent}
            className="flex items-center gap-1.5 text-sm text-obsidian-600 hover:text-obsidian-700 font-medium transition-colors"
            id="add-agent-btn"
          >
            <Plus size={15} />
            Add Agent
          </button>
          <button
            onClick={() => setShowAgentModal(false)}
            className="px-4 py-1.5 bg-obsidian-600 text-white text-sm rounded-lg hover:bg-obsidian-700 transition-colors font-medium"
            id="save-agents-btn"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
