import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Download, Check, Bot } from 'lucide-react'
import { MARKETPLACE_AGENTS, AGENT_CATEGORIES, searchAgents, getAgentsByCategory } from '../../data/agentCatalog'
import { useApp } from '../../contexts/AppContext'
import { v4 as uuidv4 } from 'uuid'

function AgentMarketCard({ agent, isInstalled, onInstall }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-xl p-4 transition-all hover:shadow-md cursor-pointer ${
        isInstalled ? 'border-obsidian-200 bg-obsidian-50/30' : 'border-zinc-200 bg-white hover:border-obsidian-200'
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-50 flex items-center justify-center text-xl flex-shrink-0 shadow-sm border border-zinc-100">
          {agent.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-zinc-800">{agent.name}</h4>
            {isInstalled && (
              <span className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                <Check size={8} /> Installed
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{agent.description}</p>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-zinc-100">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mb-1.5">System Capabilities</p>
                  <p className="text-[11px] text-zinc-600 leading-relaxed bg-zinc-50 rounded-lg p-2.5 border border-zinc-100">
                    {agent.systemPrompt.slice(0, 200)}...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onInstall(agent) }}
          disabled={isInstalled}
          className={`flex-shrink-0 p-2 rounded-lg transition-all ${
            isInstalled
              ? 'bg-green-50 text-green-500 cursor-default'
              : 'bg-obsidian-50 text-obsidian-600 hover:bg-obsidian-100 hover:text-obsidian-700'
          }`}
          title={isInstalled ? 'Already installed' : 'Add to agents'}
        >
          {isInstalled ? <Check size={15} /> : <Download size={15} />}
        </button>
      </div>
    </motion.div>
  )
}

export default function MarketplaceModal({ onClose }) {
  const { agents, addCustomAgent } = useApp()
  const [searchQ, setSearchQ] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)

  const filteredAgents = searchQ
    ? searchAgents(searchQ)
    : selectedCategory
    ? getAgentsByCategory(selectedCategory)
    : MARKETPLACE_AGENTS

  const isInstalled = (marketplaceAgent) => {
    return agents.some(a => a.name === marketplaceAgent.name || a.marketplaceId === marketplaceAgent.id)
  }

  const handleInstall = (marketplaceAgent) => {
    if (isInstalled(marketplaceAgent)) return
    const firstAgent = agents.find(a => a.apiKey)
    addCustomAgent({
      id: uuidv4(),
      marketplaceId: marketplaceAgent.id,
      name: marketplaceAgent.name,
      apiKey: firstAgent?.apiKey || '',
      baseUrl: firstAgent?.baseUrl || 'https://api.openai.com/v1',
      model: firstAgent?.model || 'gpt-4o',
      systemPrompt: marketplaceAgent.systemPrompt,
      enabled: true,
      isMarketplace: true,
      icon: marketplaceAgent.icon,
      category: marketplaceAgent.category,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-3xl max-h-[85vh] flex flex-col mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-obsidian-500 to-obsidian-700 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Agent Marketplace</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Browse and install specialized AI agents</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Search + Categories */}
        <div className="px-6 py-3 border-b border-zinc-100 flex-shrink-0 space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search agents by name, category, or skill..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 border border-zinc-100 text-sm text-zinc-700 placeholder:text-zinc-400 outline-none focus:border-obsidian-300 focus:bg-white transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors font-medium ${
                !selectedCategory ? 'border-obsidian-300 bg-obsidian-50 text-obsidian-600' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
              }`}
            >All Agents</button>
            {AGENT_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors font-medium ${
                  selectedCategory === cat.id ? 'border-obsidian-300 bg-obsidian-50 text-obsidian-600' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                }`}
              >{cat.icon} {cat.label}</button>
            ))}
          </div>
        </div>

        {/* Agent Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredAgents.map(agent => (
                <AgentMarketCard
                  key={agent.id}
                  agent={agent}
                  isInstalled={isInstalled(agent)}
                  onInstall={handleInstall}
                />
              ))}
            </AnimatePresence>
          </div>
          {filteredAgents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-zinc-400">No agents found matching your search.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-100 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-zinc-400">{MARKETPLACE_AGENTS.length} agents available • {agents.length} installed</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-obsidian-600 text-white text-sm rounded-lg hover:bg-obsidian-700 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
