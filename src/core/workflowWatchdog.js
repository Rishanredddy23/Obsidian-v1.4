import useWorkflowStore from '../stores/workflowStore'

export class WorkflowWatchdog {
  constructor(timeoutMs = 120000) {
    this.timeoutMs = timeoutMs
    this.intervalId = null
    this.lastProgress = {}
  }

  start() {
    if (this.intervalId) return
    
    this.intervalId = setInterval(() => {
      this.checkDeadlocks()
    }, 10000) // check every 10 seconds
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  checkDeadlocks() {
    const states = useWorkflowStore.getState().executionStates
    const now = Date.now()

    for (const [nodeId, state] of Object.entries(states)) {
      if (state === 'running') {
        if (!this.lastProgress[nodeId]) {
          this.lastProgress[nodeId] = now
        } else {
          const elapsed = now - this.lastProgress[nodeId]
          if (elapsed > this.timeoutMs) {
            console.warn(`[Watchdog] Node ${nodeId} has been running for >${this.timeoutMs}ms. Possible deadlock.`)
            // Force timeout state
            useWorkflowStore.getState().setNodeExecutionState(nodeId, 'timeout')
            this.lastProgress[nodeId] = null
          }
        }
      } else {
        // clear progress if not running
        if (this.lastProgress[nodeId]) {
          delete this.lastProgress[nodeId]
        }
      }
    }
  }
}
