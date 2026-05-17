import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { storage } from '../utils/storage'
import { streamChatResponse, buildMessages } from '../utils/api'
import { parseAgentActions, buildWorkspaceContext, getActionFormatInstructions } from '../utils/responseParser'
import useWorkflowStore from '../stores/workflowStore'
import { clampStatusText, summarizeActionResults } from '../services/executionEngine'
import { isSafeWorkspaceRelativePath, resolveWorkspacePath, summarizeFileActions, toWorkspaceRelativePath } from '../services/fileWriter'
import { shouldProvideWorkspaceAccess } from '../services/workspaceManager'
import { getWorkflowRoute } from '../services/workflowRunner'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)
const isElectron = typeof window !== 'undefined' && !!window.electronAPI

const DEFAULT_AGENT = {
  id: 'agent-1', name: 'Agent 1', apiKey: '', baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o', systemPrompt: 'You are a helpful assistant.', enabled: true,
}
const IDE_OPTIONS = [
  { label: 'VS Code', command: 'code' }, { label: 'Cursor', command: 'cursor' },
  { label: 'Windsurf', command: 'windsurf' }, { label: 'Arduino IDE', command: 'arduino-ide' },
  { label: 'Custom', command: '' },
]
export { IDE_OPTIONS }

export function AppProvider({ children }) {
  const [conversations, setConversations] = useState([])
  const [currentConvId, setCurrentConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [agents, setAgents] = useState([DEFAULT_AGENT])
  const [workflowMode, setWorkflowMode] = useState('sequential')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false)
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [showScreenshotUploader, setShowScreenshotUploader] = useState(false)
  const [workspacePath, setWorkspacePath] = useState(null)
  const [fileTree, setFileTree] = useState([])
  const [fileList, setFileList] = useState([])
  const [openFile, setOpenFile] = useState(null)
  const [openFileContent, setOpenFileContent] = useState('')
  const [terminalLogs, setTerminalLogs] = useState([])
  const [terminalVisible, setTerminalVisible] = useState(false)
  const [activity, setActivity] = useState([])
  const [approvalMode, setApprovalMode] = useState('auto')
  const [selectedIDE, setSelectedIDE] = useState(IDE_OPTIONS[0])
  const [customIDEPath, setCustomIDEPath] = useState('')

  // Load
  useEffect(() => {
    ;(async () => {
      const chats = await storage.loadChats()
      setConversations(chats.map(c => ({ id: c.id, title: c.title, updatedAt: c.updatedAt, createdAt: c.createdAt })))
      const config = await storage.loadConfig()
      if (config?.agents) setAgents(config.agents)
      if (config?.workflowMode) setWorkflowMode(config.workflowMode)
      if (config?.workspacePath) openWorkspace(config.workspacePath)
      if (config?.approvalMode) setApprovalMode(config.approvalMode)
      if (config?.selectedIDE) { const f = IDE_OPTIONS.find(i => i.label === config.selectedIDE.label); setSelectedIDE(f || config.selectedIDE) }
      if (config?.customIDEPath) setCustomIDEPath(config.customIDEPath)
    })()
  }, [])

  useEffect(() => {
    storage.saveConfig({ agents, workflowMode, workspacePath, approvalMode, selectedIDE, customIDEPath })
  }, [agents, workflowMode, workspacePath, approvalMode, selectedIDE, customIDEPath])

  const currentConversation = conversations.find(c => c.id === currentConvId)

  // ── Workspace ──
  const openWorkspace = useCallback(async (dirPath) => {
    if (!isElectron || !dirPath) return
    setWorkspacePath(dirPath)
    const tree = await window.electronAPI.scanDirectory(dirPath)
    setFileTree(tree)
    const list = await window.electronAPI.listAllFiles(dirPath)
    setFileList(list)
    addActivity('workspace', `Opened workspace: ${dirPath}`)
  }, [])

  const openFolderDialog = useCallback(async () => {
    if (!isElectron) return
    const dir = await window.electronAPI.openFolderDialog()
    if (dir) await openWorkspace(dir)
  }, [openWorkspace])

  const refreshWorkspace = useCallback(async () => {
    if (!workspacePath || !isElectron) return
    const tree = await window.electronAPI.scanDirectory(workspacePath)
    setFileTree(tree)
    const list = await window.electronAPI.listAllFiles(workspacePath)
    setFileList(list)
  }, [workspacePath])

  const viewFile = useCallback(async (filePath) => {
    if (!isElectron) return
    const result = await window.electronAPI.readFile(filePath)
    if (result.content !== undefined) { setOpenFile(filePath); setOpenFileContent(result.content) }
  }, [])

  const openInIDE = useCallback(async () => {
    if (!isElectron || !workspacePath) return
    const cmd = selectedIDE.label === 'Custom' ? customIDEPath : selectedIDE.command
    await window.electronAPI.openInIDE(cmd, workspacePath)
    addActivity('ide', `Opened in ${selectedIDE.label}`)
  }, [workspacePath, selectedIDE, customIDEPath])

  const addActivity = useCallback((type, message) => {
    setActivity(prev => [{ id: uuidv4(), type, message, time: new Date().toISOString() }, ...prev].slice(0, 100))
  }, [])

  // ── Terminal ──
  const runCommand = useCallback(async (command, cwd) => {
    if (!isElectron) return { exitCode: 1, output: 'Not in Electron' }
    const commandId = uuidv4()
    let output = ''
    setTerminalVisible(true)
    addActivity('terminal', `$ ${command}`)
    setTerminalLogs(prev => [...prev, { id: commandId, command, output: '', running: true, exitCode: null }])
    return new Promise((resolve) => {
      window.electronAPI.removeTerminalListeners()
      window.electronAPI.onTerminalOutput(({ commandId: cid, data }) => {
        if (cid !== commandId) return
        output += data
        setTerminalLogs(prev => prev.map(l => l.id === cid ? { ...l, output: (l.output + data).slice(-6000) } : l))
      })
      window.electronAPI.onTerminalExit(({ commandId: cid, code }) => {
        if (cid !== commandId) return
        window.electronAPI.removeTerminalListeners()
        setTerminalLogs(prev => prev.map(l => l.id === cid ? { ...l, running: false, exitCode: code } : l))
        resolve({ exitCode: code, output })
      })
      window.electronAPI.runTerminalCommand({ commandId, command, cwd: cwd || workspacePath || undefined })
    })
  }, [workspacePath, addActivity])

  // ── Execute Actions ──
  const executeActions = useCallback(async (actions, agentName) => {
    const results = []
    
    // Lazy import or construct TerminalManager
    const { TerminalManager } = await import('../core/terminalManager')
    const terminalManager = new TerminalManager(runCommand, addActivity)

    for (const action of actions) {
      if (action.type === 'file') {
        if (!isSafeWorkspaceRelativePath(action.path)) {
          results.push({ type: 'file', path: action.path, success: false, error: 'Unsafe path' })
          continue
        }
        const fullPath = resolveWorkspacePath(workspacePath, action.path)
        let approved = approvalMode === 'autonomous' || approvalMode === 'auto'
        if (!approved && approvalMode === 'ask' && isElectron) {
          approved = await window.electronAPI.showConfirm(`${agentName} wants to create/modify a file`, `Path: ${action.path}`)
        }
        if (approved && isElectron) {
          const res = await window.electronAPI.writeFile(fullPath, action.content)
          addActivity('file', `${res.success ? 'Created' : 'Failed'}: ${action.path}`)
          results.push({ type: 'file', path: toWorkspaceRelativePath(workspacePath, action.path), success: !!res.success, error: res.error })
        }
      } else if (action.type === 'terminal') {
        let approved = approvalMode === 'autonomous' || approvalMode === 'auto'
        if (!approved && approvalMode === 'ask' && isElectron) {
          approved = await window.electronAPI.showConfirm(`${agentName} wants to run a command`, `Command: ${action.command}`)
        }
        if (approved) {
          // Use the TerminalManager for safe execution, timeout, retries, and OS adapter
          const res = await terminalManager.executeWithRetry(action.command, 2, 60000)
          
          // Truncate huge output for safety
          const safeOutput = res.output?.length > 3000 ? res.output.substring(res.output.length - 3000) : res.output;
          results.push({ type: 'terminal', command: action.command, exitCode: res.exitCode, output: safeOutput })
        }
      }
    }
    if (actions.some(a => a.type === 'file')) await refreshWorkspace()
    return results
  }, [workspacePath, approvalMode, runCommand, addActivity, refreshWorkspace])

  // ── Build system prompt ──
  const buildAgentSystemPrompt = useCallback(async (agentOrNodeData) => {
    let prompt = agentOrNodeData.systemPrompt || 'You are a helpful assistant.'
    prompt += `\n\n=== CRITICAL EXECUTION CONTRACT ===\nDo not place full source code in the visible chat summary. Generate or modify files only with the ===FILE: path=== blocks. Keep visible text to short progress/status lines. Large code belongs inside file blocks only.\n=== END CONTRACT ===\n`
    prompt += getActionFormatInstructions()
    if (shouldProvideWorkspaceAccess(agentOrNodeData, workspacePath, isElectron)) {
      const keyFiles = {}
      const configFiles = ['package.json', 'requirements.txt', 'Cargo.toml', 'go.mod', 'pyproject.toml', 'tsconfig.json', 'README.md']
      for (const cf of configFiles) {
        const fp = `${workspacePath}/${cf}`.replace(/\//g, '\\')
        try {
          const exists = await window.electronAPI.pathExists(fp)
          if (exists) { const r = await window.electronAPI.readFile(fp); if (r.content) keyFiles[cf] = r.content }
        } catch {}
      }
      prompt += buildWorkspaceContext(workspacePath, fileList, keyFiles)
    }
    return prompt
  }, [workspacePath, fileList])

  // ── Chat CRUD ──
  const createNewChat = useCallback(() => { setCurrentConvId(null); setMessages([]); setShowSettings(false) }, [])
  const openChat = useCallback(async (id) => {
    const chat = await storage.loadChat(id)
    if (chat) { setCurrentConvId(chat.id); setMessages(chat.messages || []); setShowSettings(false) }
  }, [])
  const deleteChat = useCallback(async (id) => {
    await storage.deleteChat(id)
    setConversations(prev => prev.filter(c => c.id !== id))
    if (currentConvId === id) { setCurrentConvId(null); setMessages([]) }
  }, [currentConvId])
  const renameChat = useCallback(async (id, title) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c))
    const chat = await storage.loadChat(id)
    if (chat) { chat.title = title; await storage.saveChat(chat) }
  }, [])

  const saveCurrentChat = useCallback(async (msgs, title) => {
    const now = new Date().toISOString()
    let convId = currentConvId
    if (!convId) {
      convId = uuidv4(); setCurrentConvId(convId)
      setConversations(prev => [{ id: convId, title: title || 'New conversation', updatedAt: now, createdAt: now }, ...prev])
    } else {
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, updatedAt: now } : c))
    }
    await storage.saveChat({
      id: convId, title: title || conversations.find(c => c.id === convId)?.title || 'New conversation',
      messages: msgs, createdAt: conversations.find(c => c.id === convId)?.createdAt || now, updatedAt: now,
    })
    return convId
  }, [currentConvId, conversations])

  const generateTitle = (t) => { const s = t.slice(0, 60).replace(/\n/g, ' ').trim(); return s.length >= 60 ? s + '...' : s || 'New conversation' }

  // ── Stream a single agent node ──
  const streamAgentNode = useCallback(async (nodeData, contextMessages, allMsgs, setAllMsgs) => {
    const agentName = nodeData.label || nodeData.agentName || nodeData.name || 'Agent'
    const assistantMsg = {
      id: uuidv4(), role: 'assistant', content: `${agentName} is running...`, agentId: nodeData.agentId || nodeData.id,
      agentName, timestamp: new Date().toISOString(),
    }
    let updatedMsgs = [...allMsgs, assistantMsg]
    let rawContent = ''
    let receivedToken = false
    let streamError = null
    let lastStatusUpdate = 0
    setAllMsgs(updatedMsgs)
    setMessages([...updatedMsgs])
    addActivity('agent', `${agentName} started`)

    const sysPrompt = await buildAgentSystemPrompt(nodeData)
    const apiMessages = buildMessages(sysPrompt, contextMessages)

    for (let attempt = 1; attempt <= 2; attempt++) {
      streamError = null
      rawContent = ''
      receivedToken = false
      if (attempt > 1) {
        updatedMsgs = updatedMsgs.map(m => m.id === assistantMsg.id ? { ...m, content: `${agentName} retrying provider request...` } : m)
        setAllMsgs(updatedMsgs)
        setMessages([...updatedMsgs])
        await new Promise(r => setTimeout(r, 1200))
      }

      await streamChatResponse({
        baseUrl: nodeData.baseUrl, apiKey: nodeData.apiKey, model: nodeData.model, messages: apiMessages, timeoutMs: 600000,
        onToken: (token) => {
          receivedToken = true
          rawContent += token
          const now = Date.now()
          if (now - lastStatusUpdate > 1200) {
            lastStatusUpdate = now
            updatedMsgs = updatedMsgs.map(m => m.id === assistantMsg.id ? { ...m, content: `${agentName} is generating workspace changes...` } : m)
            setAllMsgs(updatedMsgs)
            setMessages([...updatedMsgs])
          }
        },
        onDone: () => addActivity('agent', `${agentName} completed`),
        onError: (err) => {
          streamError = err
          addActivity('agent', `${agentName} error: ${err.message}`)
        },
      })

      if (!streamError || receivedToken) break
    }

    if (streamError && !receivedToken) {
      updatedMsgs = updatedMsgs.map(m => m.id === assistantMsg.id ? { ...m, content: `${agentName} failed after retry. Continuing workflow with metadata only.\nReason: ${streamError.message}` } : m)
      setAllMsgs(updatedMsgs)
      setMessages([...updatedMsgs])
    }

    if (!receivedToken && !streamError) {
      rawContent = 'Completed, but the provider returned an empty response.'
      updatedMsgs = updatedMsgs.map(m => m.id === assistantMsg.id ? { ...m, content: rawContent } : m)
      setAllMsgs(updatedMsgs)
      setMessages([...updatedMsgs])
    }

    const finalContent = streamError && !receivedToken ? `Error: ${streamError.message}` : rawContent
    const actions = parseAgentActions(finalContent)
    let actionResults = []
    if (actions.length > 0) {
      const { files, commands } = summarizeFileActions(actions, workspacePath)
      const pendingSummary = [
        files.length ? `Writing ${files.length} file${files.length === 1 ? '' : 's'}...` : null,
        commands.length ? `Preparing ${commands.length} command${commands.length === 1 ? '' : 's'}...` : null,
      ].filter(Boolean).join('\n')
      updatedMsgs = updatedMsgs.map(m => m.id === assistantMsg.id ? { ...m, content: clampStatusText(`${agentName} completed generation.\n${pendingSummary}`) } : m)
      setAllMsgs(updatedMsgs)
      setMessages([...updatedMsgs])
      addActivity('agent', `${agentName} executing ${actions.length} action(s)...`)
      actionResults = await executeActions(actions, agentName)
      const resultSummary = summarizeActionResults(actionResults)
      updatedMsgs = updatedMsgs.map(m => m.id === assistantMsg.id ? { ...m, content: clampStatusText(resultSummary || `${agentName} completed without file changes.`) } : m)
      setAllMsgs(updatedMsgs)
      setMessages([...updatedMsgs])
    } else if (!streamError) {
      const safeSummary = rawContent
        ? clampStatusText(rawContent.replace(/```[\s\S]*?```/g, '[code omitted from chat; use file blocks to write source]'))
        : `${agentName} completed without file changes.`
      updatedMsgs = updatedMsgs.map(m => m.id === assistantMsg.id ? { ...m, content: safeSummary } : m)
      setAllMsgs(updatedMsgs)
      setMessages([...updatedMsgs])
    }
    return { updatedMsgs, content: actions.length > 0 ? summarizeActionResults(actionResults) : clampStatusText(finalContent), rawContent: finalContent, actionResults }
  }, [buildAgentSystemPrompt, addActivity, executeActions])

  // ── Workflow Pipeline Execution ──
  const executeWorkflowPipeline = useCallback(async (userContent, activeWorkflow) => {
    const { nodes, edges } = activeWorkflow
    const route = getWorkflowRoute(activeWorkflow)
    
    // Start Watchdog
    let watchdog = null;
    try {
      const { WorkflowWatchdog } = await import('../core/workflowWatchdog')
      watchdog = new WorkflowWatchdog(120000)
      watchdog.start()
    } catch(e) {}

    if (route.error) {
      const title = generateTitle(userContent.trim())
      const errorMsgs = [
        { id: uuidv4(), role: 'user', content: userContent.trim(), timestamp: new Date().toISOString() },
        { id: uuidv4(), role: 'assistant', content: `Error: ${route.error}`, agentName: 'Workflow Engine', timestamp: new Date().toISOString() },
      ]
      setMessages(errorMsgs)
      await saveCurrentChat(errorMsgs, title)
      addActivity('agent', route.error)
      return errorMsgs
    }
    const { inputNode, outputNode, runnableNodeIds } = route

    useWorkflowStore.getState().setNodeExecutionState(null, 'idle')

    const userMsg = { id: uuidv4(), role: 'user', content: userContent.trim(), timestamp: new Date().toISOString() }
    let allMsgs = [userMsg]
    setMessages([...allMsgs])
    const title = generateTitle(userContent.trim())

    const nodeOutputs = {}
    nodeOutputs[inputNode.id] = userContent.trim()
    useWorkflowStore.getState().setNodeExecutionState(inputNode.id, 'completed')

    // Build adjacency list for incoming dependencies
    const dependencies = {} // nodeId -> set of incoming edge sources
    const incomingEdges = {} // nodeId -> list of edges
    for (const n of nodes) { dependencies[n.id] = new Set(); incomingEdges[n.id] = [] }
    for (const e of edges) {
      if (!runnableNodeIds.has(e.source) || !runnableNodeIds.has(e.target)) continue
      if (dependencies[e.target]) {
        dependencies[e.target].add(e.source)
        incomingEdges[e.target].push(e)
      }
    }

    const nodePromises = {}
    nodePromises[inputNode.id] = Promise.resolve()

    // Helper to execute a node once dependencies are ready
    const executeNode = async (nodeId) => {
      if (nodePromises[nodeId]) return nodePromises[nodeId]

      const node = nodes.find(n => n.id === nodeId)
      if (!node) return Promise.resolve()
      if (!runnableNodeIds.has(nodeId)) return Promise.resolve()

      // Wait for all incoming dependencies (e.g. Mixer waits for FE and BE)
      const deps = Array.from(dependencies[nodeId])
      
      // Memoize the promise
      nodePromises[nodeId] = (async () => {
        try {
          for (const depId of deps) {
            await executeNode(depId)
          }
        } catch (err) {
          // If a dependency fails, we can't run.
          useWorkflowStore.getState().setNodeExecutionState(nodeId, 'error')
          throw new Error('Dependency failed')
        }

        if (node.type === 'outputNode') {
          const finalInputs = incomingEdges[nodeId].map(e => nodeOutputs[e.source]).filter(Boolean)
          if (finalInputs.length > 0) {
            nodeOutputs[nodeId] = finalInputs.join('\n\n---\n\n')
          }
          useWorkflowStore.getState().setNodeExecutionState(nodeId, 'completed')
          return
        }

        useWorkflowStore.getState().setNodeExecutionState(nodeId, 'running')
        const nodeData = node.data

        if (!nodeData.apiKey && node.type === 'agentNode') {
          addActivity('agent', `⚠️ ${nodeData.label} skipped — no API key`)
          useWorkflowStore.getState().setNodeExecutionState(nodeId, 'error')
          const inputs = incomingEdges[nodeId].map(e => nodeOutputs[e.source]).filter(Boolean)
          nodeOutputs[nodeId] = inputs.join('\n\n---\n\n')
          return // do not throw, so downstream can continue
        }

        const isMixer = nodeData.isMixer || nodeData.agentId === 'mixer'
        let inputContext = ''
        const inEdges = incomingEdges[nodeId]

        if (isMixer && inEdges.length >= 2) {
          const feEdge = inEdges.find(e => e.targetHandle === 'fe-in')
          const beEdge = inEdges.find(e => e.targetHandle === 'be-in')
          const feContent = feEdge ? nodeOutputs[feEdge.source] : ''
          const beContent = beEdge ? nodeOutputs[beEdge.source] : ''
          inputContext = `=== FRONTEND OUTPUT ===\n${feContent}\n\n=== BACKEND OUTPUT ===\n${beContent}`
        } else {
          inputContext = inEdges.map(e => nodeOutputs[e.source]).filter(Boolean).join('\n\n---\n\n')
        }

        if (!inputContext) inputContext = userContent.trim()
        addActivity('agent', `${nodeData.label} processing...`)

        const contextMsgs = [
          { role: 'user', content: inputContext },
          ...allMsgs.filter(m => m.role === 'assistant' && m.content),
        ]

        try {
          const setAllMsgs = (msgs) => { allMsgs = msgs }
          const result = await streamAgentNode(nodeData, contextMsgs, allMsgs, setAllMsgs)
          allMsgs = result.updatedMsgs
          nodeOutputs[nodeId] = result.content
          useWorkflowStore.getState().setNodeExecutionState(nodeId, 'completed')
        } catch (err) {
          useWorkflowStore.getState().setNodeExecutionState(nodeId, 'error')
          nodeOutputs[nodeId] = `Node ${nodeData.label || nodeData.name} failed: ${err.message}`
          const errorMsg = {
            id: uuidv4(), role: 'assistant',
            content: `Error: ${nodeData.label || nodeData.name} failed but workflow continued.\nReason: ${err.message}`,
            agentName: nodeData.label || nodeData.name || 'Agent',
            timestamp: new Date().toISOString(),
          }
          allMsgs = [...allMsgs, errorMsg]
          setMessages([...allMsgs])
        }
      })()

      return nodePromises[nodeId]
    }

    try {
      await executeNode(outputNode.id)
    } finally {
      if (watchdog) {
        watchdog.stop()
      }
      addActivity('agent', `Workflow completed`)
      await saveCurrentChat(allMsgs, title)
    }

    return allMsgs
  }, [addActivity, streamAgentNode, saveCurrentChat, getWorkflowRoute])

  // ── Send Message ──
  const sendMessage = useCallback(async (content) => {
    if (isStreaming || !content.trim()) return

    // Check for active workflow
    const activeWorkflow = useWorkflowStore.getState().getActiveWorkflow()

    if (activeWorkflow) {
      const route = getWorkflowRoute(activeWorkflow)
      const runnableNodeIds = route.runnableNodeIds || new Set()
      const agentNodes = activeWorkflow.nodes.filter(n => n.type === 'agentNode' && runnableNodeIds.has(n.id) && n.data?.apiKey)
      if (agentNodes.length === 0) {
        const userMsg = { id: uuidv4(), role: 'user', content: content.trim(), timestamp: new Date().toISOString() }
        const assistantMsg = {
          id: uuidv4(), role: 'assistant',
          content: `Error: ${route.error || 'No connected agent nodes on the active workflow path have API keys configured.'}`,
          agentName: 'Workflow Engine', timestamp: new Date().toISOString(),
        }
        const nextMsgs = [userMsg, assistantMsg]
        setMessages(nextMsgs)
        await saveCurrentChat(nextMsgs, generateTitle(content.trim()))
        addActivity('agent', route.error || 'No connected agent nodes with API keys configured.')
        return
      }
      setIsStreaming(true)
      try {
        await executeWorkflowPipeline(content, activeWorkflow)
      } catch (err) {
        console.error('Workflow error:', err)
        addActivity('agent', `Workflow error: ${err.message}`)
      } finally {
        setIsStreaming(false)
      }
      return
    }

    // Fallback: legacy sequential/parallel agent execution
    const enabledAgents = agents.filter(a => a.enabled && a.apiKey)
    if (enabledAgents.length === 0) { setShowAgentModal(true); return }

    const userMsg = { id: uuidv4(), role: 'user', content: content.trim(), timestamp: new Date().toISOString() }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs)
    setIsStreaming(true)
    const title = messages.length === 0 ? generateTitle(content.trim()) : null

    try {
      let allMsgs = [...newMsgs]
      let actionResults = []

      for (let idx = 0; idx < enabledAgents.length; idx++) {
        const agent = enabledAgents[idx]
        const prevAgent = idx > 0 ? enabledAgents[idx - 1] : null

        if (idx === 0) addActivity('agent', `${agent.name} analyzing...`)
        else {
          addActivity('agent', `Passing context to ${agent.name}...`)
          await new Promise(r => setTimeout(r, 100))
        }

        const assistantMsg = {
          id: uuidv4(), role: 'assistant', content: `${agent.name} is running...`, agentId: agent.id,
          agentName: agent.name, timestamp: new Date().toISOString(),
        }
        allMsgs = [...allMsgs, assistantMsg]
        setMessages([...allMsgs])
        let rawAgentContent = ''
        let agentStreamError = null
        let lastStatusUpdate = 0

        let sysPrompt = await buildAgentSystemPrompt(agent)
        if (enabledAgents.length > 1) {
          sysPrompt += `\n\n=== PIPELINE ROLE ===\nYou are Agent ${idx + 1} of ${enabledAgents.length}.`
          sysPrompt += `\nDo NOT wait for user input. Execute immediately.\n=== END ===\n`
        }
        if (actionResults.length > 0) {
          sysPrompt += `\n--- PREVIOUS RESULTS ---\n`
          for (const r of actionResults) {
            if (r.type === 'file') sysPrompt += `File ${r.success ? 'created' : 'failed'}: ${r.path}\n`
            if (r.type === 'terminal') sysPrompt += `Command "${r.command}" exit ${r.exitCode}\n`
          }
        }

        const contextMsgs = allMsgs.filter(m => m.id !== assistantMsg.id && (m.role === 'user' || (m.role === 'assistant' && m.content)))
        const apiMessages = buildMessages(sysPrompt, contextMsgs)

        await streamChatResponse({
          baseUrl: agent.baseUrl, apiKey: agent.apiKey, model: agent.model, messages: apiMessages,
          onToken: (token) => {
            rawAgentContent += token
            const now = Date.now()
            if (now - lastStatusUpdate > 1200) {
              lastStatusUpdate = now
              allMsgs = allMsgs.map(m => m.id === assistantMsg.id ? { ...m, content: `${agent.name} is generating workspace changes...` } : m)
              setMessages([...allMsgs])
            }
          },
          onDone: () => addActivity('agent', `${agent.name} completed`),
          onError: (err) => {
            agentStreamError = err
            allMsgs = allMsgs.map(m => m.id === assistantMsg.id ? { ...m, content: `Error: ${err.message}` } : m)
            setMessages([...allMsgs])
          },
        })

        const agentContent = agentStreamError ? `Error: ${agentStreamError.message}` : rawAgentContent
        const actions = parseAgentActions(agentContent)
        if (actions.length > 0) {
          const { files, commands } = summarizeFileActions(actions, workspacePath)
          const pendingSummary = [
            files.length ? `Writing ${files.length} file${files.length === 1 ? '' : 's'}...` : null,
            commands.length ? `Preparing ${commands.length} command${commands.length === 1 ? '' : 's'}...` : null,
          ].filter(Boolean).join('\n')
          allMsgs = allMsgs.map(m => m.id === assistantMsg.id ? { ...m, content: clampStatusText(`${agent.name} completed generation.\n${pendingSummary}`) } : m)
          setMessages([...allMsgs])
          addActivity('agent', `${agent.name} executing ${actions.length} action(s)...`)
          const results = await executeActions(actions, agent.name)
          actionResults = [...actionResults, ...results]
          allMsgs = allMsgs.map(m => m.id === assistantMsg.id ? { ...m, content: clampStatusText(summarizeActionResults(results) || `${agent.name} completed without file changes.`) } : m)
          setMessages([...allMsgs])
        } else if (!agentStreamError) {
          const safeSummary = rawAgentContent
            ? clampStatusText(rawAgentContent.replace(/```[\s\S]*?```/g, '[code omitted from chat; use file blocks to write source]'))
            : `${agent.name} completed without file changes.`
          allMsgs = allMsgs.map(m => m.id === assistantMsg.id ? { ...m, content: safeSummary } : m)
          setMessages([...allMsgs])
        }
      }

      if (enabledAgents.length > 1) addActivity('agent', `All ${enabledAgents.length} agents completed ✓`)
      await saveCurrentChat(allMsgs, title)
    } catch (err) {
      console.error('Pipeline error:', err)
      addActivity('agent', `Pipeline error: ${err.message}`)
    } finally {
      setIsStreaming(false)
    }
  }, [messages, agents, isStreaming, saveCurrentChat, buildAgentSystemPrompt, executeActions, addActivity, executeWorkflowPipeline, getWorkflowRoute])

  // Agent CRUD
  const addAgent = useCallback(() => {
    const num = agents.length + 1
    setAgents(prev => [...prev, { ...DEFAULT_AGENT, id: uuidv4(), name: `Agent ${num}`, apiKey: '', systemPrompt: 'You are a helpful assistant.' }])
  }, [agents.length])
  const addCustomAgent = useCallback((agentData) => { setAgents(prev => [...prev, agentData]) }, [])
  const updateAgent = useCallback((id, u) => setAgents(prev => prev.map(a => a.id === id ? { ...a, ...u } : a)), [])
  const removeAgent = useCallback((id) => setAgents(prev => prev.filter(a => a.id !== id)), [])

  useEffect(() => { window.__obsidianAddCustomAgent = addCustomAgent }, [addCustomAgent])

  const filteredConversations = searchQuery
    ? conversations.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations

  const value = {
    conversations: filteredConversations, allConversations: conversations, currentConvId, currentConversation,
    messages, agents, workflowMode, sidebarOpen, showAgentModal, showSettings, isStreaming, searchQuery,
    workspacePath, fileTree, fileList, openFile, openFileContent, terminalLogs, terminalVisible, activity,
    approvalMode, selectedIDE, customIDEPath,
    showWorkflowEditor, showMarketplace, showScreenshotUploader,
    setWorkflowMode, setSidebarOpen, setShowAgentModal, setShowSettings, setSearchQuery,
    setApprovalMode, setSelectedIDE, setCustomIDEPath, setTerminalVisible,
    setShowWorkflowEditor, setShowMarketplace, setShowScreenshotUploader,
    createNewChat, openChat, deleteChat, renameChat, sendMessage,
    addAgent, addCustomAgent, updateAgent, removeAgent,
    openFolderDialog, openWorkspace, refreshWorkspace, viewFile, openInIDE, runCommand, addActivity,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
