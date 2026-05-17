import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import Sidebar from './Sidebar'
import Header from './Header'
import ChatArea from '../chat/ChatArea'
import ChatInput from '../chat/ChatInput'
import WelcomeScreen from '../chat/WelcomeScreen'
import AgentModal from '../agents/AgentModal'
import MarketplaceModal from '../agents/MarketplaceModal'
import SettingsPanel from '../settings/SettingsPanel'
import FileExplorer from '../workspace/FileExplorer'
import TerminalPanel from '../workspace/TerminalPanel'
import ScreenshotUploader from '../workspace/ScreenshotUploader'
import WorkflowEditor from '../workflow/WorkflowEditor'
import useWorkflowStore from '../../stores/workflowStore'

export default function Layout() {
  const {
    sidebarOpen, showAgentModal, showSettings, messages, workspacePath,
    activity, showWorkflowEditor, setShowWorkflowEditor,
    showMarketplace, setShowMarketplace,
    showScreenshotUploader, setShowScreenshotUploader,
  } = useApp()
  const [rightPanel, setRightPanel] = useState('explorer')

  // Workflow editor opens as full page
  if (showWorkflowEditor) {
    return <WorkflowEditor onClose={() => setShowWorkflowEditor(false)} />
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fafafa]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Titlebar */}
        <Header />

        {showSettings ? (
          <SettingsPanel />
        ) : (
          <div className="flex flex-1 min-h-0 overflow-hidden titlebar-no-drag">
            {/* Center: Chat */}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex-1 overflow-y-auto" id="chat-scroll-area">
                {messages.length === 0 ? <WelcomeScreen /> : <ChatArea />}
              </div>
              {/* Terminal Panel */}
              <TerminalPanel />
              {/* Chat Input */}
              <div className="titlebar-no-drag" style={{ position: 'relative', zIndex: 10 }}>
                <ChatInput />
              </div>
            </div>

            {/* Right Panel: Explorer + Activity */}
            {workspacePath && (
              <div className="w-[240px] flex-shrink-0 border-l border-zinc-200/80 bg-white flex flex-col">
                {/* Panel tabs */}
                <div className="flex border-b border-zinc-100">
                  <button
                    onClick={() => setRightPanel('explorer')}
                    className={`flex-1 text-[10px] font-medium py-2 transition-colors ${rightPanel === 'explorer' ? 'text-obsidian-600 border-b-2 border-obsidian-500' : 'text-zinc-400 hover:text-zinc-600'}`}
                  >Files</button>
                  <button
                    onClick={() => setRightPanel('activity')}
                    className={`flex-1 text-[10px] font-medium py-2 transition-colors ${rightPanel === 'activity' ? 'text-obsidian-600 border-b-2 border-obsidian-500' : 'text-zinc-400 hover:text-zinc-600'}`}
                  >Activity</button>
                </div>

                {rightPanel === 'explorer' ? (
                  <FileExplorer />
                ) : (
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {activity.length === 0 && <p className="text-[10px] text-zinc-400 text-center pt-4">No activity yet</p>}
                    {activity.map((a) => (
                      <div key={a.id} className="flex items-start gap-1.5 px-2 py-1.5 rounded-md bg-zinc-50 text-[10px]">
                        <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          a.type === 'agent' ? 'bg-obsidian-400' :
                          a.type === 'file' ? 'bg-green-400' :
                          a.type === 'terminal' ? 'bg-amber-400' :
                          a.type === 'workspace' ? 'bg-blue-400' : 'bg-zinc-400'
                        }`} />
                        <span className="text-zinc-600 leading-tight">{a.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAgentModal && <AgentModal />}
      {showMarketplace && <MarketplaceModal onClose={() => setShowMarketplace(false)} />}
      {showScreenshotUploader && <ScreenshotUploader onClose={() => setShowScreenshotUploader(false)} />}
    </div>
  )
}
