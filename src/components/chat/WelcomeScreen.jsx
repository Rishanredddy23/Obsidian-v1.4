import React from 'react'
import { useApp } from '../../contexts/AppContext'
import { motion } from 'framer-motion'
import { Sparkles, GitBranch, Layers, Zap } from 'lucide-react'

const SUGGESTIONS = [
  { icon: Sparkles, text: 'Explain how multi-agent systems work', color: 'text-amber-500' },
  { icon: GitBranch, text: 'Compare sequential vs parallel workflows', color: 'text-emerald-500' },
  { icon: Layers, text: 'Help me design a system architecture', color: 'text-blue-500' },
  { icon: Zap, text: 'Write a Python script with error handling', color: 'text-violet-500' },
]

export default function WelcomeScreen() {
  const { sendMessage } = useApp()

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center max-w-lg"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-obsidian-400 via-obsidian-500 to-obsidian-700 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-obsidian-200"
        >
          <span className="text-white text-2xl font-bold">O</span>
        </motion.div>

        <h1 className="text-2xl font-semibold text-zinc-900 mb-2">
          Welcome to Obsidian
        </h1>
        <p className="text-sm text-zinc-500 mb-10 leading-relaxed">
          Multi-Agent Intelligence Platform — orchestrate multiple AI agents,<br />
          configure workflows, and build powerful conversations.
        </p>

        {/* Suggestion cards */}
        <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
          {SUGGESTIONS.map((s, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
              onClick={() => sendMessage(s.text)}
              className="flex items-start gap-2.5 p-3.5 rounded-xl border border-zinc-200 bg-white hover:border-obsidian-200 hover:bg-obsidian-50/50 text-left transition-all group"
            >
              <s.icon size={15} className={`${s.color} mt-0.5 flex-shrink-0`} />
              <span className="text-xs text-zinc-600 group-hover:text-zinc-800 leading-relaxed">{s.text}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
