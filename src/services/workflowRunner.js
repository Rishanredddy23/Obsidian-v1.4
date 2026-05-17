export function getWorkflowRoute(workflow) {
  const nodes = workflow?.nodes || []
  const edges = workflow?.edges || []
  const inputNode = nodes.find(n => n.type === 'inputNode')
  const outputNode = nodes.find(n => n.type === 'outputNode')
  if (!inputNode) return { error: 'No User Input node found in the active workflow.' }
  if (!outputNode) return { error: 'No Output node found in the active workflow.' }

  const outgoing = {}
  const reverse = {}
  for (const n of nodes) { outgoing[n.id] = []; reverse[n.id] = [] }
  for (const e of edges) {
    if (!outgoing[e.source] || !reverse[e.target]) continue
    outgoing[e.source].push(e)
    reverse[e.target].push(e)
  }

  const reachableFromInput = new Set([inputNode.id])
  const queue = [inputNode.id]
  while (queue.length) {
    const id = queue.shift()
    for (const edge of outgoing[id] || []) {
      if (!reachableFromInput.has(edge.target)) {
        reachableFromInput.add(edge.target)
        queue.push(edge.target)
      }
    }
  }
  if (!reachableFromInput.has(outputNode.id)) {
    return { error: 'The active workflow has no connected path from User Input to Output.' }
  }

  const canReachOutput = new Set([outputNode.id])
  const reverseQueue = [outputNode.id]
  while (reverseQueue.length) {
    const id = reverseQueue.shift()
    for (const edge of reverse[id] || []) {
      if (!canReachOutput.has(edge.source)) {
        canReachOutput.add(edge.source)
        reverseQueue.push(edge.source)
      }
    }
  }

  return {
    inputNode,
    outputNode,
    runnableNodeIds: new Set([...reachableFromInput].filter(id => canReachOutput.has(id))),
  }
}
