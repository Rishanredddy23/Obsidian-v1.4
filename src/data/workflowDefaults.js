import { v4 as uuidv4 } from 'uuid'

export const NODE_TYPES = {
  INPUT: 'inputNode',
  AGENT: 'agentNode',
  OUTPUT: 'outputNode',
}

export function createInputNode(x = 80, y = 300) {
  return {
    id: `input-${uuidv4()}`,
    type: NODE_TYPES.INPUT,
    position: { x, y },
    data: { label: 'User Input', icon: '📥' },
    draggable: true,
  }
}

export function createAgentNode(agent, x = 350, y = 300) {
  const isPromptEng = agent.id === 'marketplace-prompt'
  const isMixer = agent.id === 'mixer'

  return {
    id: `agent-${uuidv4()}`,
    type: NODE_TYPES.AGENT,
    position: { x, y },
    data: {
      label: agent.name,
      icon: agent.icon || '🤖',
      agentId: agent.id,
      agentName: agent.name,
      systemPrompt: agent.systemPrompt || 'You are a helpful assistant.',
      category: agent.category || 'custom',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      workspaceAccess: true,
      readOnly: false,
      isPromptEng,
      isMixer,
    },
    draggable: true,
  }
}

export function createOutputNode(x = 1200, y = 300) {
  return {
    id: `output-${uuidv4()}`,
    type: NODE_TYPES.OUTPUT,
    position: { x, y },
    data: { label: 'Output', icon: '📤' },
    draggable: true,
  }
}

export function createEdge(sourceId, targetId, sourceHandle = null, targetHandle = null) {
  return {
    id: `edge-${uuidv4()}`,
    source: sourceId,
    target: targetId,
    sourceHandle,
    targetHandle,
    animated: true,
    type: 'smoothstep',
    style: { stroke: '#6366f1', strokeWidth: 2 },
  }
}

export function createDefaultWorkflow() {
  const inputNode = createInputNode(80, 300)
  const outputNode = createOutputNode(1200, 300)
  return {
    id: uuidv4(),
    name: 'New Workflow',
    nodes: [inputNode, outputNode],
    edges: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    active: false,
  }
}
