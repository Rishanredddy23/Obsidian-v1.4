import React, { useEffect, useRef } from 'react'
import { useApp } from '../../contexts/AppContext'
import MessageBubble from './MessageBubble'

export default function ChatArea() {
  const { messages, isStreaming, activity } = useApp()
  const bottomRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Find the latest agent activity message for status display
  const latestActivity = activity.length > 0 ? activity[0] : null
  const showAgentStatus = isStreaming && latestActivity?.type === 'agent'

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-1">
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isLast={i === messages.length - 1}
            isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
          />
        ))}

        {/* Streaming indicator when waiting for first token or between agents */}
        {isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex items-start gap-3 py-4 msg-enter">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-obsidian-400 to-obsidian-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-[10px] font-bold">O</span>
            </div>
            <div className="flex flex-col gap-1 pt-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dot-1"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dot-2"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dot-3"></span>
              </div>
              {showAgentStatus && (
                <span className="text-[10px] text-zinc-400 font-medium">{latestActivity.message}</span>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
