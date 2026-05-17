import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft, Save, Check, Search, Plus, Minus, Square, X as XIcon } from 'lucide-react'
import ReactFlow, {
  Background, Controls, MiniMap, addEdge,
  useNodesState, useEdgesState, reconnectEdge,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { MARKETPLACE_AGENTS, AGENT_CATEGORIES, searchAgents, getAgentsByCategory } from '../../data/agentCatalog'
import { createAgentNode, createDefaultWorkflow } from '../../data/workflowDefaults'
import { InputNode, AgentNode, OutputNode } from './CustomNodes'
import NodeSettingsPanel from './NodeSettingsPanel'
import useWorkflowStore from '../../stores/workflowStore'

const nodeTypes = { inputNode: InputNode, agentNode: AgentNode, outputNode: OutputNode }
const isElectron = typeof window !== 'undefined' && !!window.electronAPI

const defaultEdgeOptions = {
  animated: true,
  type: 'smoothstep',
  style: { stroke: '#6366f1', strokeWidth: 2 },
}

const fitViewOptions = { padding: 0.3 }
const deleteKeyCode = ['Backspace', 'Delete']
const selectionKeyCode = ['Shift']
const multiSelectionKeyCode = ['Control', 'Meta']
const snapGrid = [15, 15]
const connectionLineStyle = { stroke: '#6366f1', strokeWidth: 2 }

/* ─── Sidebar: Agent Picker ─── */
function WFSidebar({ onAddAgent, installedIds }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState(null)
  const agents = q ? searchAgents(q) : cat ? getAgentsByCategory(cat) : MARKETPLACE_AGENTS

  const customAgent = {
    id: 'custom-agent', name: 'Custom Agent', icon: '⚙️',
    description: 'Create your own agent with custom prompts.',
    category: 'custom', systemPrompt: 'You are a helpful assistant.',
  }

  return (
    <div className="w-[260px] flex-shrink-0 border-r border-zinc-200 bg-white flex flex-col h-full z-10">
      <div className="px-4 py-3 border-b border-zinc-100">
        <h3 className="text-sm font-semibold text-zinc-800">Agent Nodes</h3>
        <p className="text-[10px] text-zinc-400 mt-0.5">Click to add to canvas</p>
      </div>
      <div className="px-3 py-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agents..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-100 text-xs outline-none focus:border-obsidian-300 transition-all" />
        </div>
      </div>
      <div className="px-3 py-1 flex flex-wrap gap-1">
        <button onClick={() => setCat(null)} className={`text-[10px] px-2 py-0.5 rounded-full border ${!cat ? 'border-obsidian-300 bg-obsidian-50 text-obsidian-600' : 'border-zinc-200 text-zinc-500'}`}>All</button>
        {AGENT_CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`text-[10px] px-2 py-0.5 rounded-full border ${cat === c.id ? 'border-obsidian-300 bg-obsidian-50 text-obsidian-600' : 'border-zinc-200 text-zinc-500'}`}>{c.icon} {c.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {/* Custom Agent */}
        <button onClick={() => onAddAgent(customAgent)}
          className="w-full text-left p-2 rounded-lg border border-zinc-400 bg-zinc-50 hover:bg-zinc-100 transition-all group">
          <div className="flex items-center gap-2">
            <span className="text-base">{customAgent.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-zinc-800 truncate">{customAgent.name}</span>
              <p className="text-[10px] text-zinc-500 truncate">{customAgent.description}</p>
            </div>
            <Plus size={14} className="text-zinc-600" />
          </div>
        </button>
        <div className="h-px bg-zinc-100 my-2" />
        {agents.map((a) => (
          <button key={a.id} onClick={() => onAddAgent(a)}
            className={`w-full text-left p-2 rounded-lg border transition-all hover:shadow-sm group ${installedIds.includes(a.id) ? 'border-obsidian-200 bg-obsidian-50/50' : 'border-zinc-100 hover:border-obsidian-200'}`}>
            <div className="flex items-center gap-2">
              <span className="text-base">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-zinc-800 truncate">{a.name}</span>
                  {installedIds.includes(a.id) && <span className="text-[8px] bg-obsidian-100 text-obsidian-600 px-1 rounded">Added</span>}
                </div>
                <p className="text-[10px] text-zinc-500 truncate">{a.description}</p>
              </div>
              <Plus size={12} className="text-zinc-400 group-hover:text-obsidian-500" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── Main Workflow Editor ─── */
export default function WorkflowEditor({ onClose }) {
  const storeNodes = useWorkflowStore((s) => s.nodes)
  const storeEdges = useWorkflowStore((s) => s.edges)
  const storeWorkflowName = useWorkflowStore((s) => s.workflowName)
  const savedWorkflows = useWorkflowStore((s) => s.savedWorkflows)
  const activeWorkflowId = useWorkflowStore((s) => s.activeWorkflowId)
  const setStoreNodes = useWorkflowStore((s) => s.setNodes)
  const setStoreEdges = useWorkflowStore((s) => s.setEdges)
  const setStoreWorkflowName = useWorkflowStore((s) => s.setWorkflowName)
  const loadWorkflow = useWorkflowStore((s) => s.loadWorkflow)
  const saveWorkflow = useWorkflowStore((s) => s.saveWorkflow)
  const executionStates = useWorkflowStore((s) => s.executionStates)
  const edgeReconnectSuccessful = useRef(true)
  const hasInitialized = useRef(false)

  // Local React Flow state synced with store
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [saved, setSaved] = useState(false)
  const [rfInstance, setRfInstance] = useState(null)
  const [wfName, setWfName] = useState('New Workflow')

  // Initialize: load from store or create default
  useEffect(() => {
    const activeWorkflow = savedWorkflows.find((w) => w.id === activeWorkflowId)

    if (storeNodes.length > 0) {
      setNodes(storeNodes)
      setEdges(storeEdges)
      setWfName(storeWorkflowName)
    } else if (activeWorkflow) {
      setNodes(activeWorkflow.nodes)
      setEdges(activeWorkflow.edges)
      setWfName(activeWorkflow.name)
      loadWorkflow(activeWorkflow.id)
    } else {
      const def = createDefaultWorkflow()
      setNodes(def.nodes)
      setEdges(def.edges)
      setWfName(def.name)
      setStoreNodes(def.nodes)
      setStoreEdges(def.edges)
      setStoreWorkflowName(def.name)
    }
    hasInitialized.current = true
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync local changes back to store
  useEffect(() => {
    if (hasInitialized.current) setStoreNodes(nodes)
  }, [nodes, setStoreNodes])
  useEffect(() => {
    if (hasInitialized.current) setStoreEdges(edges)
  }, [edges, setStoreEdges])
  useEffect(() => {
    if (hasInitialized.current) setStoreWorkflowName(wfName)
  }, [wfName, setStoreWorkflowName])

  const animatedEdges = useMemo(() => {
    return edges.map((e) => {
      const state = executionStates[e.source]
      let className = ''
      if (state === 'running') className = 'edge-executing'
      else if (state === 'completed') className = 'edge-completed'
      else if (state === 'error') className = 'edge-error'
      return className === (e.className || '') ? e : { ...e, className }
    })
  }, [edges, executionStates])

  // Connect edges
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds))
  }, [setEdges])

  // Edge reconnection
  const onReconnectStart = useCallback(() => { edgeReconnectSuccessful.current = false }, [])
  const onReconnect = useCallback((oldEdge, newConnection) => {
    edgeReconnectSuccessful.current = true
    setEdges((els) => reconnectEdge(oldEdge, newConnection, els))
  }, [setEdges])
  const onReconnectEnd = useCallback((_, edge) => {
    if (!edgeReconnectSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id))
    }
    edgeReconnectSuccessful.current = true
  }, [setEdges])

  const onNodeClick = useCallback((_, node) => setSelectedNode(node.id), [])
  const onPaneClick = useCallback(() => setSelectedNode(null), [])

  // Add agent node
  const addAgent = useCallback((agent) => {
    let x = 400, y = 300
    if (rfInstance) {
      const vp = rfInstance.getViewport()
      const center = rfInstance.project({ x: window.innerWidth / 2 - 130, y: window.innerHeight / 2 })
      x = center.x + (Math.random() * 60 - 30)
      y = center.y + (Math.random() * 60 - 30)
    }
    const newNode = createAgentNode(agent, x, y)
    setNodes((nds) => [...nds, newNode])
  }, [rfInstance, setNodes])

  // Update node data
  const updateNodeData = useCallback((id, updates) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, ...(updates.data || {}) } } : n))
  }, [setNodes])

  // Delete node
  const deleteNode = useCallback((id) => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
    setSelectedNode(null)
  }, [setNodes, setEdges])

  // Save workflow
  const handleSave = useCallback(() => {
    saveWorkflow()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }, [saveWorkflow])

  const installed = nodes.filter((n) => n.type === 'agentNode').map((n) => n.data?.agentId)
  const selNodeObj = nodes.find((n) => n.id === selectedNode)

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#fafafa]">
      {/* ── Titlebar ── */}
      <div className="titlebar-drag flex items-center justify-between h-12 px-4 border-b border-zinc-200/80 bg-white/80 backdrop-blur-sm flex-shrink-0 z-50">
        {/* Left: back + logo */}
        <div className="flex items-center gap-3 titlebar-no-drag">
          <button onClick={onClose} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 font-medium px-2 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="w-px h-5 bg-zinc-200" />
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-obsidian-500 to-obsidian-700 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">O</span>
          </div>
          <span className="text-xs font-semibold text-zinc-700">Obsidian</span>
        </div>

        {/* Center: workflow name */}
        <div className="titlebar-no-drag">
          <input value={wfName} onChange={(e) => setWfName(e.target.value)}
            className="text-sm font-semibold text-zinc-800 bg-transparent outline-none border-b border-transparent focus:border-obsidian-300 px-2 py-0.5 text-center max-w-[300px]" />
        </div>

        {/* Right: save + window controls */}
        <div className="flex items-center gap-2 titlebar-no-drag">
          <button onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg shadow-sm transition-all ${saved
              ? 'bg-emerald-500 text-white' : 'bg-obsidian-600 text-white hover:bg-obsidian-700'}`}>
            {saved ? <><Check size={14} /> Saved &amp; Activated</> : <><Save size={14} /> Save Workflow</>}
          </button>
          {isElectron && (
            <div className="flex items-center ml-2 gap-0.5">
              <button onClick={() => window.electronAPI.winMinimize()} className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"><Minus size={14} /></button>
              <button onClick={() => window.electronAPI.winMaximize()} className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"><Square size={12} /></button>
              <button onClick={() => window.electronAPI.winClose()} className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"><XIcon size={14} /></button>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <WFSidebar onAddAgent={addAgent} installedIds={installed} />
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={animatedEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnectStart={onReconnectStart}
            onReconnect={onReconnect}
            onReconnectEnd={onReconnectEnd}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            onInit={setRfInstance}
            fitView
            fitViewOptions={fitViewOptions}
            deleteKeyCode={deleteKeyCode}
            selectionKeyCode={selectionKeyCode}
            multiSelectionKeyCode={multiSelectionKeyCode}
            snapToGrid
            snapGrid={snapGrid}
            connectionLineStyle={connectionLineStyle}
            connectionLineType="smoothstep"
          >
            <Background color="#e4e4e7" gap={20} size={1} />
            <Controls className="bg-white border-zinc-200 shadow-sm" />
            <MiniMap className="bg-white border-zinc-200 shadow-sm rounded-lg" maskColor="rgba(244,244,245,0.7)" />
          </ReactFlow>

          {/* Node Settings Panel */}
          <AnimatePresence>
            {selNodeObj && (
              <NodeSettingsPanel
                key={selNodeObj.id}
                node={selNodeObj}
                onUpdate={updateNodeData}
                onDelete={deleteNode}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
