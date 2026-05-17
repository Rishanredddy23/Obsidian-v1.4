import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useApp } from '../../contexts/AppContext'
import { motion } from 'framer-motion'
import { Send, Paperclip, Bot, Workflow, Camera, Store } from 'lucide-react'

export default function ChatInput() {
  const { sendMessage, isStreaming, agents, setShowAgentModal, setShowWorkflowEditor, setShowScreenshotUploader, setShowMarketplace } = useApp()
  const [input, setInput] = useState('')
  const textareaRef = useRef(null)
  const enabledAgents = agents.filter(a => a.enabled)

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [])

  useEffect(() => { autoResize() }, [input, autoResize])

  // Auto-focus on mount and after streaming finishes
  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isStreaming])

  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    sendMessage(input)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    // Future: handle file drops
  }

  // Click handler to force focus when the container is clicked
  const handleContainerClick = () => {
    if (textareaRef.current && !isStreaming) {
      textareaRef.current.focus()
    }
  }

  return (
    <div
      className="flex-shrink-0 border-t border-zinc-100 bg-white"
      style={{ WebkitAppRegion: 'no-drag', position: 'relative', zIndex: 50 }}
    >
      <div className="max-w-3xl mx-auto px-4 py-3">
        {/* Active agents + action buttons */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
            {enabledAgents.map(a => (
              <button
                key={a.id}
                onClick={() => setShowAgentModal(true)}
                className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-100 hover:bg-obsidian-50 hover:text-obsidian-600 px-2 py-0.5 rounded-full transition-colors"
              >
                <Bot size={10} />
                {a.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setShowScreenshotUploader(true)}
              className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-violet-600 bg-zinc-50 hover:bg-violet-50 px-2.5 py-1 rounded-lg border border-zinc-200 hover:border-violet-200 transition-all"
              title="Screenshot to Code"
              id="screenshot-btn"
            >
              <Camera size={11} />
              <span className="hidden sm:inline">Screenshot</span>
            </button>
            <button
              onClick={() => setShowMarketplace(true)}
              className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-emerald-600 bg-zinc-50 hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-zinc-200 hover:border-emerald-200 transition-all"
              title="Agent Marketplace"
              id="marketplace-btn"
            >
              <Store size={11} />
              <span className="hidden sm:inline">Marketplace</span>
            </button>
            <button
              onClick={() => setShowWorkflowEditor(true)}
              className="flex items-center gap-1 text-[10px] font-medium text-white bg-obsidian-600 hover:bg-obsidian-700 px-2.5 py-1 rounded-lg shadow-sm transition-all"
              title="Create Workflow"
              id="create-workflow-btn"
            >
              <Workflow size={11} />
              Create Workflow
            </button>
          </div>
        </div>

        {/* Input area */}
        <div
          className="flex items-end gap-2 bg-white border border-zinc-200 rounded-2xl px-4 py-2.5 shadow-sm focus-within:border-obsidian-300 focus-within:shadow-[0_0_0_1px_rgba(99,102,241,0.1)] transition-all cursor-text"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={handleContainerClick}
        >
          <button
            className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors mb-0.5"
            title="Attach file"
            id="attach-file-btn"
          >
            <Paperclip size={16} />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Obsidian..."
            rows={1}
            className="flex-1 auto-resize text-sm text-zinc-800 placeholder:text-zinc-400 outline-none bg-transparent leading-relaxed"
            style={{ WebkitAppRegion: 'no-drag', pointerEvents: 'auto' }}
            id="chat-input"
            autoFocus
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className={`p-2 rounded-xl transition-all mb-0.5 ${
              input.trim() && !isStreaming
                ? 'bg-obsidian-600 text-white hover:bg-obsidian-700 shadow-sm'
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
            }`}
            id="send-btn"
          >
            <Send size={15} />
          </motion.button>
        </div>

        <p className="text-[10px] text-zinc-400 text-center mt-2">
          Obsidian can make mistakes. Review important information.
        </p>
      </div>
    </div>
  )
}
