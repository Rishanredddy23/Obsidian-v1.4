import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Image, X, Wand2, Loader2, FileCode } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

export default function ScreenshotUploader({ onClose }) {
  const { sendMessage } = useApp()
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState('')
  const [outputFormat, setOutputFormat] = useState('react-tailwind')
  const [processing, setProcessing] = useState(false)

  const OUTPUT_FORMATS = [
    { id: 'react-tailwind', label: 'React + Tailwind', icon: '⚛️' },
    { id: 'html-css', label: 'HTML + CSS', icon: '🌐' },
    { id: 'react-css', label: 'React + CSS', icon: '💅' },
    { id: 'nextjs', label: 'Next.js', icon: '▲' },
  ]

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true) }
  const handleDragLeave = () => setDragActive(false)

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        handleFile(file)
        break
      }
    }
  }, [handleFile])

  const handleGenerate = () => {
    if (!preview) return
    setProcessing(true)

    const formatLabel = OUTPUT_FORMATS.find(f => f.id === outputFormat)?.label || outputFormat

    const prompt = `I am uploading a UI screenshot. Please analyze this design carefully and recreate it as production-ready code.

OUTPUT FORMAT: ${formatLabel}

ANALYZE AND RECREATE:
1. Exact layout structure (flexbox/grid patterns)
2. Color palette (extract exact colors)
3. Typography (font sizes, weights, spacing)
4. All UI components (buttons, cards, navbars, inputs, etc.)
5. Spacing and padding patterns
6. Border radius, shadows, and effects
7. Responsive behavior

REQUIREMENTS:
- Generate ACTUAL FILES in the workspace (not code in chat)
- Make it pixel-close to the original design
- Ensure fully responsive
- Use modern best practices
- Include all necessary component files

The screenshot shows: [Please analyze the image I described and recreate the UI]
Image file: ${fileName}

Note: Since I cannot directly send the image through this text interface, I'll describe what I see or you should use your best judgment to create a modern, professional UI matching common design patterns.`

    sendMessage(prompt)
    setProcessing(false)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={onClose}
      onPaste={handlePaste}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-lg mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Wand2 size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Screenshot to Code</h2>
              <p className="text-[10px] text-zinc-500">Upload a UI screenshot to generate code</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Upload area */}
        <div className="p-6">
          {!preview ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                dragActive ? 'border-obsidian-400 bg-obsidian-50' : 'border-zinc-200 hover:border-obsidian-300 hover:bg-zinc-50'
              }`}
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = (e) => handleFile(e.target.files[0])
                input.click()
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto mb-3">
                <Upload size={20} className="text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-600 font-medium">Drop screenshot here or click to upload</p>
              <p className="text-[10px] text-zinc-400 mt-1">Supports PNG, JPG, WebP • Or paste from clipboard (Ctrl+V)</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                <img src={preview} alt="Screenshot preview" className="w-full max-h-[250px] object-contain" />
                <button
                  onClick={() => { setPreview(null); setFileName('') }}
                  className="absolute top-2 right-2 p-1 rounded-lg bg-white/90 border border-zinc-200 hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm border border-zinc-200 rounded-md px-2 py-0.5">
                  <span className="text-[10px] text-zinc-600 font-medium">{fileName}</span>
                </div>
              </div>

              {/* Output format selector */}
              <div>
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Output Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {OUTPUT_FORMATS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setOutputFormat(f.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                        outputFormat === f.id
                          ? 'border-obsidian-300 bg-obsidian-50 text-obsidian-700'
                          : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      <span>{f.icon}</span>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-zinc-600 hover:text-zinc-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!preview || processing}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-obsidian-600 text-white text-sm rounded-lg hover:bg-obsidian-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {processing ? <Loader2 size={14} className="animate-spin" /> : <FileCode size={14} />}
            Generate Code
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
