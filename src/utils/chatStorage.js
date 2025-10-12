// Chat storage utility for localStorage
const CHAT_STORAGE_KEY = 'xanny_ai_chats';
const CURRENT_CHAT_KEY = 'xanny_ai_current_chat';

export const chatStorage = {
  // Get all saved chats
  getAllChats() {
    try {
      const chats = localStorage.getItem(CHAT_STORAGE_KEY);
      return chats ? JSON.parse(chats) : [];
    } catch (error) {
      console.error('Error loading chats:', error);
      return [];
    }
  },

  // Save all chats
  saveAllChats(chats) {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chats));
    } catch (error) {
      console.error('Error saving chats:', error);
    }
  },

  // Get a specific chat by ID
  getChat(chatId) {
    const chats = this.getAllChats();
    return chats.find((chat) => chat.id === chatId);
  },

  // Save or update a chat
  saveChat(chat) {
    const chats = this.getAllChats();
    const existingIndex = chats.findIndex((c) => c.id === chat.id);

    if (existingIndex >= 0) {
      chats[existingIndex] = chat;
    } else {
      chats.push(chat);
    }

    this.saveAllChats(chats);
  },

  // Delete a chat
  deleteChat(chatId) {
    const chats = this.getAllChats();
    const filteredChats = chats.filter((chat) => chat.id !== chatId);
    this.saveAllChats(filteredChats);
  },

  // Create a new chat
  createNewChat(title, modelId) {
    const newChat = {
      id: Date.now().toString(),
      title: title || 'New Chat',
      modelId: modelId || 'llama-3.3-70b-versatile',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.saveChat(newChat);
    return newChat;
  },

  // Add message to a chat
  addMessage(chatId, userMessage, aiResponse, modelId) {
    const chat = this.getChat(chatId);
    if (!chat) return null;

    const message = {
      id: Date.now(),
      user: userMessage,
      ai: aiResponse,
      timestamp: new Date().toLocaleTimeString(),
      modelId: modelId,
    };

    chat.messages.push(message);
    chat.updatedAt = new Date().toISOString();

    // Update title if it's the first message
    if (chat.messages.length === 1) {
      chat.title = userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage;
    }

    this.saveChat(chat);
    return chat;
  },

  // Update chat title
  updateChatTitle(chatId, newTitle) {
    const chat = this.getChat(chatId);
    if (!chat) return false;

    chat.title = newTitle;
    chat.updatedAt = new Date().toISOString();
    this.saveChat(chat);
    return true;
  },

  // Get current active chat ID
  getCurrentChatId() {
    return localStorage.getItem(CURRENT_CHAT_KEY);
  },

  // Set current active chat ID
  setCurrentChatId(chatId) {
    localStorage.setItem(CURRENT_CHAT_KEY, chatId);
  },

  // Clear all chats
  clearAllChats() {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    localStorage.removeItem(CURRENT_CHAT_KEY);
  },

  // Get chats sorted by update time (newest first)
  getSortedChats() {
    const chats = this.getAllChats();
    return chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  // Export chats (for backup)
  exportChats() {
    const chats = this.getAllChats();
    const dataStr = JSON.stringify(chats, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `xanny-ai-chats-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Import chats (from backup)
  importChats(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const chats = JSON.parse(e.target.result);
          this.saveAllChats(chats);
          resolve(chats);
        } catch (error) {
          reject(new Error('Invalid file format'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  },
};
