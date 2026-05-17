import React, { memo } from 'react'
import { Handle, Position } from 'reactflow'
import useWorkflowStore from '../../stores/workflowStore'

/* ─── Shared Styles ─── */
const handleBase = {
  width: 12, height: 12, background: '#fff',
  borderRadius: '50%', transition: 'all 0.2s ease',
}

const getExecutionClass = (id) => {
  const state = useWorkflowStore((s) => s.executionStates[id])
  if (state === 'running') return 'executing'
  if (state === 'completed') return 'completed'
  if (state === 'error') return 'error'
  if (state === 'timeout') return 'timeout'
  return ''
}

/* ─── Input Node ─── */
export const InputNode = memo(({ id, data, selected }) => {
  const execClass = getExecutionClass(id)
  return (
    <div className={`obsidian-node ${selected ? 'selected' : ''} ${execClass}`}>
      <div className="node-header" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
        <span className="node-icon">{data.icon}</span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-body">
        <span className="node-badge">Receives Prompt</span>
      </div>
      <Handle type="source" position={Position.Right} id="out"
        style={{ ...handleBase, border: '2.5px solid #10b981' }} />
    </div>
  )
})
InputNode.displayName = 'InputNode'

/* ─── Agent Node ─── */
export const AgentNode = memo(({ id, data, selected }) => {
  const isPromptEng = data.isPromptEng || data.agentId === 'marketplace-prompt'
  const isMixer = data.isMixer || data.agentId === 'mixer'
  const isCustom = data.agentId === 'custom-agent'
  const execClass = getExecutionClass(id)

  let gradient = 'linear-gradient(135deg, #6366f1, #4f46e5)'
  if (isCustom) gradient = 'linear-gradient(135deg, #52525b, #3f3f46)'
  else if (isMixer) gradient = 'linear-gradient(135deg, #d946ef, #9333ea)'
  else if (data.category === 'backend') gradient = 'linear-gradient(135deg, #2563eb, #0891b2)'
  else if (data.category === 'frontend') gradient = 'linear-gradient(135deg, #6366f1, #7c3aed)'

  return (
    <div className={`obsidian-node ${selected ? 'selected' : ''} ${execClass}`}>
      <div className="node-header" style={{ background: gradient }}>
        <span className="node-icon">{data.icon}</span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-body">
        <span className="node-badge">{data.category || 'Agent'}</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {data.workspaceAccess && <span className="ws-badge">🟢 WS</span>}
          {data.apiKey && <span className="ws-badge">🔑</span>}
        </div>
      </div>

      {/* ── Target (Left) Handles ── */}
      {isMixer ? (
        <>
          <Handle type="target" position={Position.Left} id="fe-in"
            style={{ ...handleBase, top: '35%', border: '2.5px solid #8b5cf6' }} />
          <div className="handle-label-left" style={{ top: '35%' }}>FE</div>
          <Handle type="target" position={Position.Left} id="be-in"
            style={{ ...handleBase, top: '70%', border: '2.5px solid #3b82f6' }} />
          <div className="handle-label-left" style={{ top: '70%' }}>BE</div>
        </>
      ) : (
        <Handle type="target" position={Position.Left} id="in"
          style={{ ...handleBase, border: '2.5px solid #a1a1aa' }} />
      )}

      {/* ── Source (Right) Handles ── */}
      {isPromptEng ? (
        <>
          <Handle type="source" position={Position.Right} id="fe"
            style={{ ...handleBase, top: '35%', border: '2.5px solid #8b5cf6' }} />
          <div className="handle-label-right" style={{ top: '35%' }}>FE</div>
          <Handle type="source" position={Position.Right} id="be"
            style={{ ...handleBase, top: '70%', border: '2.5px solid #3b82f6' }} />
          <div className="handle-label-right" style={{ top: '70%' }}>BE</div>
        </>
      ) : (
        <Handle type="source" position={Position.Right} id="out"
          style={{ ...handleBase, border: '2.5px solid #6366f1' }} />
      )}
    </div>
  )
})
AgentNode.displayName = 'AgentNode'

/* ─── Output Node ─── */
export const OutputNode = memo(({ id, data, selected }) => {
  const execClass = getExecutionClass(id)
  return (
    <div className={`obsidian-node ${selected ? 'selected' : ''} ${execClass}`}>
      <div className="node-header" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
        <span className="node-icon">{data.icon}</span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-body">
        <span className="node-badge">Returns Result</span>
      </div>
      <Handle type="target" position={Position.Left} id="in"
        style={{ ...handleBase, border: '2.5px solid #f59e0b' }} />
    </div>
  )
})
OutputNode.displayName = 'OutputNode'
