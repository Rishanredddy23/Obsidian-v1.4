const isElectron = typeof window !== 'undefined' && !!window.electronAPI

export const storage = {
  async saveChat(chat) {
    if (isElectron) return window.electronAPI.saveChat(chat)
    const chats = JSON.parse(localStorage.getItem('obsidian-chats') || '{}')
    chats[chat.id] = chat
    localStorage.setItem('obsidian-chats', JSON.stringify(chats))
    return true
  },

  async loadChats() {
    if (isElectron) return window.electronAPI.loadChats()
    const chats = JSON.parse(localStorage.getItem('obsidian-chats') || '{}')
    return Object.values(chats).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  },

  async loadChat(id) {
    if (isElectron) return window.electronAPI.loadChat(id)
    const chats = JSON.parse(localStorage.getItem('obsidian-chats') || '{}')
    return chats[id] || null
  },

  async deleteChat(id) {
    if (isElectron) return window.electronAPI.deleteChat(id)
    const chats = JSON.parse(localStorage.getItem('obsidian-chats') || '{}')
    delete chats[id]
    localStorage.setItem('obsidian-chats', JSON.stringify(chats))
    return true
  },

  async saveConfig(config) {
    if (isElectron) return window.electronAPI.saveConfig(config)
    localStorage.setItem('obsidian-config', JSON.stringify(config))
    return true
  },

  async loadConfig() {
    if (isElectron) return window.electronAPI.loadConfig()
    const c = localStorage.getItem('obsidian-config')
    return c ? JSON.parse(c) : null
  },
}
