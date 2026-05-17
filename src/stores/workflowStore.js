import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

const useWorkflowStore = create(
  persist(
    (set, get) => ({
      // Current editor state
      workflowId: null,
      workflowName: 'New Workflow',
      nodes: [],
      edges: [],
      selectedNodeId: null,
      executionStates: {}, // nodeId -> 'idle' | 'running' | 'completed' | 'error'

      // Persisted workflows
      savedWorkflows: [],
      activeWorkflowId: null,

      // Setters
      setNodes: (nodes) => set({ nodes: typeof nodes === 'function' ? nodes(get().nodes) : nodes }),
      setEdges: (edges) => set({ edges: typeof edges === 'function' ? edges(get().edges) : edges }),
      setWorkflowName: (name) => set({ workflowName: name }),
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      setNodeExecutionState: (id, state) => set((s) => {
        if (!id) return { executionStates: {} } // reset all
        return { executionStates: { ...s.executionStates, [id]: state } }
      }),

      addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),

      removeNode: (id) => set((s) => ({
        nodes: s.nodes.filter((n) => n.id !== id),
        edges: s.edges.filter((e) => e.source !== id && e.target !== id),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      })),

      updateNodeData: (id, updates) => set((s) => ({
        nodes: s.nodes.map((n) => {
          if (n.id !== id) return n
          return { ...n, data: { ...n.data, ...(updates.data || {}) } }
        }),
      })),

      // Save current workflow to persisted list + activate it
      saveWorkflow: () => {
        const { workflowId, workflowName, nodes, edges, savedWorkflows } = get()
        const id = workflowId || uuidv4()
        const workflow = {
          id,
          name: workflowName,
          nodes: nodes.map((n) => ({ ...n, selected: false, dragging: false })),
          edges: edges.map((e) => ({ ...e, selected: false })),
          updatedAt: new Date().toISOString(),
          active: true,
        }
        const idx = savedWorkflows.findIndex((w) => w.id === id)
        let next = idx >= 0 ? savedWorkflows.map((w, i) => (i === idx ? workflow : { ...w, active: false })) : [...savedWorkflows.map((w) => ({ ...w, active: false })), workflow]
        set({ workflowId: id, savedWorkflows: next, activeWorkflowId: id })
        return workflow
      },

      loadWorkflow: (id) => {
        const wf = get().savedWorkflows.find((w) => w.id === id)
        if (!wf) return
        set({ workflowId: wf.id, workflowName: wf.name, nodes: wf.nodes, edges: wf.edges, selectedNodeId: null })
      },

      deleteWorkflow: (id) => set((s) => ({
        savedWorkflows: s.savedWorkflows.filter((w) => w.id !== id),
        activeWorkflowId: s.activeWorkflowId === id ? null : s.activeWorkflowId,
      })),

      activateWorkflow: (id) => set((s) => ({
        savedWorkflows: s.savedWorkflows.map((w) => ({ ...w, active: w.id === id })),
        activeWorkflowId: id,
      })),

      deactivateWorkflow: () => set((s) => ({
        savedWorkflows: s.savedWorkflows.map((w) => ({ ...w, active: false })),
        activeWorkflowId: null,
      })),

      getActiveWorkflow: () => {
        const { savedWorkflows, activeWorkflowId } = get()
        return savedWorkflows.find((w) => w.id === activeWorkflowId) || null
      },

      resetEditor: () => set({ workflowId: null, workflowName: 'New Workflow', nodes: [], edges: [], selectedNodeId: null }),
    }),
    {
      name: 'obsidian-workflows',
      version: 1,
      partialize: (state) => ({
        savedWorkflows: state.savedWorkflows,
        activeWorkflowId: state.activeWorkflowId,
      }),
    }
  )
)

export default useWorkflowStore
