import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, User, RotateCcw } from 'lucide-react'
import { getDisplayText } from '../../utils/responseParser'

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false)
  const code = String(children).replace(/\n$/, '')

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-zinc-200 bg-[#fafafa]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-100 border-b border-zinc-200">
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneLight}
        language={language || 'text'}
        PreTag="div"
        customStyle={{ margin: 0, padding: '1rem', background: '#fafafa', fontSize: '0.8125rem', lineHeight: '1.6' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

export default function MessageBubble({ message, isLast, isStreaming }) {
  const isUser = message.role === 'user'
  const [hovering, setHovering] = useState(false)

  return (
    <div
      className={`msg-enter py-4 ${isUser ? '' : ''}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {isUser ? (
          <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0 mt-0.5">
            <User size={14} className="text-zinc-600" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-obsidian-400 to-obsidian-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-[10px] font-bold">O</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name + Agent badge */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-zinc-800">
              {isUser ? 'You' : message.agentName || 'Obsidian'}
            </span>
            {!isUser && message.agentName && (
              <span className="text-[9px] bg-obsidian-50 text-obsidian-500 px-1.5 py-0.5 rounded font-medium">
                Agent
              </span>
            )}
          </div>

          <div className={`prose-chat text-sm text-zinc-700 leading-relaxed ${isStreaming && !message.content ? '' : ''}`}>
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : message.content?.startsWith('Error:') ? (
              <div className="border border-red-200 bg-red-50 rounded-xl p-4 my-2 max-w-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-500 font-bold text-lg">!</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-red-900 mb-1">
                      {message.content.toLowerCase().includes('system role') || message.content.toLowerCase().includes('system') 
                        ? 'Provider Formatting Error' 
                        : 'Agent Execution Error'}
                    </h4>
                    <p className="text-xs text-red-700 mb-3 leading-relaxed">
                      {message.content.toLowerCase().includes('system role') || message.content.toLowerCase().includes('system')
                        ? 'Reason: Selected provider does not support the "system" role. The workflow engine will automatically adapt the prompt format.'
                        : `Reason: ${message.content.replace('Error: ', '')}`}
                    </p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors">
                        Retry
                      </button>
                      <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-700 text-xs font-medium rounded-lg transition-colors">
                        Auto Fix
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={isStreaming && message.content ? 'stream-cursor' : ''}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      if (!inline && match) {
                        return <CodeBlock language={match[1]}>{children}</CodeBlock>
                      }
                      if (!inline) {
                        return <CodeBlock>{children}</CodeBlock>
                      }
                      return <code className={className} {...props}>{children}</code>
                    },
                  }}
                >
                  {getDisplayText(message.content) || ''}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Action buttons (show on hover for assistant messages) */}
          {!isUser && !isStreaming && message.content && !message.content.startsWith('Error:') && hovering && (
            <div className="flex items-center gap-1 mt-2">
              <button
                onClick={() => { navigator.clipboard.writeText(message.content) }}
                className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-600 px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors"
              >
                <Copy size={11} /> Copy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
