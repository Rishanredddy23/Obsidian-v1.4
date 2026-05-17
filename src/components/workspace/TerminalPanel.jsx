import React, { useRef, useEffect } from 'react'
import { useApp } from '../../contexts/AppContext'
import { X, Terminal as TermIcon } from 'lucide-react'

export default function TerminalPanel() {
  const { terminalLogs, terminalVisible, setTerminalVisible } = useApp()
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [terminalLogs])

  if (!terminalVisible) return null

  return (
    <div className="border-t border-zinc-200 bg-white flex flex-col" style={{ height: '200px' }}>
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-50 border-b border-zinc-100">
        <div className="flex items-center gap-1.5">
          <TermIcon size={12} className="text-zinc-500" />
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Terminal</span>
        </div>
        <button onClick={() => setTerminalVisible(false)} className="p-0.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600">
          <X size={12} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed bg-[#fafafa]">
        {terminalLogs.length === 0 && (
          <span className="text-zinc-400">No commands executed yet.</span>
        )}
        {terminalLogs.map(log => (
          <div key={log.id} className="mb-3">
            <div className="text-obsidian-600 font-medium mb-0.5">$ {log.command}</div>
            <pre className="text-zinc-600 whitespace-pre-wrap break-all">{log.output}</pre>
            {log.exitCode !== null && !log.running && (
              <div className={`text-[10px] mt-0.5 ${log.exitCode === 0 ? 'text-green-600' : 'text-red-500'}`}>
                Exit code: {log.exitCode}
              </div>
            )}
            {log.running && <span className="text-amber-600 text-[10px]">Running...</span>}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
