import React from 'react'
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('React Error Boundary Caught:', error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  clearLocalAndReset = () => {
    localStorage.removeItem('obsidian-workflows')
    localStorage.removeItem('obsidian-chat-store')
    localStorage.removeItem('obsidian-config')
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen w-screen bg-[#fafafa] p-6 titlebar-drag">
          <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-2xl w-full shadow-2xl titlebar-no-drag">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900">Application Error</h1>
                <p className="text-sm text-zinc-500">Obsidian encountered an unexpected runtime crash.</p>
              </div>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mb-6 max-h-60 overflow-auto font-mono text-xs text-red-600 whitespace-pre-wrap">
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={this.reset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-obsidian-600 hover:bg-obsidian-700 text-white font-medium rounded-lg transition-colors"
              >
                <RefreshCw size={16} /> Reload Application
              </button>
              <button 
                onClick={this.clearLocalAndReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-medium rounded-lg transition-colors"
              >
                <RotateCcw size={16} /> Hard Reset (Clear Data)
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
