import './App.css';
import { useState, useRef, useEffect } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/hljs';
// Using inline SVG icons instead of lucide-react

import aiService from './services/aiServiceSimple';
import { chatStorage } from './utils/chatStorage';
import { getModelInfo } from './services/aiServiceSimple';
import ModelSelector from './components/ModelSelector';
import ChatSidebar from './components/ChatSidebar';

function App() {
  const inputRef = useRef();
  const chatContainerRef = useRef();

  // State management
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama-3.1-8b-instant'); // Default to Xanny
  const [showClearModal, setShowClearModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Chat management
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);

  // Initialize app
  useEffect(() => {
    loadChats();
    const savedCurrentChat = chatStorage.getCurrentChatId();
    if (savedCurrentChat && chatStorage.getChat(savedCurrentChat)) {
      setCurrentChatId(savedCurrentChat);
    } else {
      createNewChat();
    }
  }, []);

  // Load current chat when currentChatId changes
  useEffect(() => {
    if (currentChatId) {
      const chat = chatStorage.getChat(currentChatId);
      setCurrentChat(chat);
      chatStorage.setCurrentChatId(currentChatId);
    }
  }, [currentChatId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [currentChat?.messages, isLoading]);

  // Scroll button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        setShowScrollButton(!isAtBottom && currentChat?.messages?.length > 0);
      }
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentChat?.messages?.length]);

  // Focus input when not loading
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const loadChats = () => {
    const allChats = chatStorage.getSortedChats();
    setChats(allChats);
  };

  const createNewChat = () => {
    // Use the actual model that will be used (considering limits)
    let actualModel = selectedModel;
    if (selectedModel === 'llama-3.3-70b-versatile' && checkXannyProLimit()) {
      actualModel = 'llama-3.1-8b-instant'; // Fallback to Xanny
    }

    const newChat = chatStorage.createNewChat('New Chat', actualModel);
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    return newChat;
  };

  const selectChat = (chatId) => {
    setCurrentChatId(chatId);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const deleteChat = (chatId) => {
    chatStorage.deleteChat(chatId);
    loadChats();

    if (currentChatId === chatId) {
      if (chats.length > 1) {
        const remainingChats = chats.filter((chat) => chat.id !== chatId);
        setCurrentChatId(remainingChats[0].id);
      } else {
        createNewChat();
      }
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || isLoading) return;

    // Check if using Xanny Pro and limit reached
    let actualModel = selectedModel;
    if (selectedModel === 'llama-3.3-70b-versatile' && checkXannyProLimit()) {
      actualModel = 'llama-3.1-8b-instant'; // Fallback to Xanny
      setSelectedModel('llama-3.1-8b-instant');
    }

    try {
      setIsLoading(true);
      const userMessage = content;
      const modelInfo = getModelInfo(actualModel);

      // Create new chat if none exists
      if (!currentChatId) {
        createNewChat();
      }

      const aiResponse = await aiService.getResponse(userMessage, actualModel);

      // Increment Xanny Pro usage if using Pro
      if (actualModel === 'llama-3.3-70b-versatile') {
        incrementXannyProUsage();
      }

      // Add message to current chat with the actual model used
      const updatedChat = chatStorage.addMessage(currentChatId, userMessage, aiResponse, actualModel);

      setCurrentChat(updatedChat);
      loadChats();
      setContent('');

      // Focus input after sending
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Error:', error);

      // Add error message to chat with the actual model used
      const errorChat = chatStorage.addMessage(currentChatId, content, `Error: ${error.message}`, actualModel);

      setCurrentChat(errorChat);
      loadChats();

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCurrentChat = () => {
    setShowClearModal(true);
  };

  const handleConfirmClear = () => {
    if (currentChat && currentChat.messages.length > 0) {
      const clearedChat = { ...currentChat, messages: [] };
      chatStorage.saveChat(clearedChat);
      setCurrentChat(clearedChat);
      loadChats();
    }
    setShowClearModal(false);
  };

  const handleCancelClear = () => {
    setShowClearModal(false);
  };

  // Xanny Pro usage tracking
  const getXannyProUsage = () => {
    const today = new Date().toDateString();
    const usage = localStorage.getItem(`xanny_pro_usage_${today}`);
    return usage ? parseInt(usage) : 0;
  };

  const incrementXannyProUsage = () => {
    const today = new Date().toDateString();
    const currentUsage = getXannyProUsage();
    localStorage.setItem(`xanny_pro_usage_${today}`, (currentUsage + 1).toString());
  };

  const checkXannyProLimit = () => {
    const usage = getXannyProUsage();
    return usage >= 20;
  };

  const handleModelChange = (newModel) => {
    if (newModel === 'llama-3.3-70b-versatile' && checkXannyProLimit()) {
      setShowLimitModal(true);
      return;
    }
    setSelectedModel(newModel);
  };

  const getModelIcon = (modelId) => {
    const model = getModelInfo(modelId);
    if (!model) return '🔮';

    switch (model.provider) {
      case 'Groq':
        if (modelId === 'llama-3.3-70b-versatile') {
          return '👑'; // Crown icon for Xanny Pro
        }
        return '⚡';
      default:
        return '🔮';
    }
  };

  const getModelDisplayName = (modelId) => {
    const model = getModelInfo(modelId);
    if (!model) return 'Unknown Model';

    if (modelId === 'llama-3.3-70b-versatile') {
      return (
        <span className="flex items-center gap-1">
          <span className="text-yellow-400">👑</span>
          <span>Xanny Pro</span>
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold">PRO</span>
        </span>
      );
    }
    return model.name;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-900 flex">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        chats={chats}
        currentChatId={currentChatId}
        onChatSelect={selectChat}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        onRefreshChats={loadChats}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden text-gray-300 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-white/5"
                >
                  {sidebarOpen ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </button>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm sm:text-lg font-bold">X</span>
                  </div>
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent gradient-text leading-tight">XAN AI</h1>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                  disabled={isLoading}
                />

                {currentChat?.messages?.length > 0 && (
                  <button
                    onClick={clearCurrentChat}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30 transition-all duration-200 border border-red-500/30 hover:border-red-400/50 hover:scale-105"
                  >
                    <span className="hidden sm:inline">Clear Chat</span>
                    <span className="sm:hidden">Clear</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Chat Container */}
        <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-4 pb-32">
          {/* Chat Messages */}
          <div className="flex-1 relative">
            <div
              ref={chatContainerRef}
              className="space-y-4 max-h-full overflow-y-auto pr-2"
            >
              {!currentChat || currentChat.messages.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="relative">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                      <span className="text-3xl">🤖</span>
                    </div>
                    <div className="absolute inset-0 w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-30"></div>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-3">Welcome to XAN AI!</h2>
                  <p className="text-gray-400 mb-6 text-lg max-w-md mx-auto">Your intelligent AI assistant is ready to help. Start a conversation by typing your question below!</p>
                  <div className="flex items-center justify-center gap-3 text-sm bg-white/5 rounded-xl px-4 py-2 mx-auto w-fit border border-white/10">
                    <span className="text-lg">{getModelIcon(selectedModel)}</span>
                    <span className="text-gray-300">
                      {selectedModel === 'llama-3.3-70b-versatile' ? (
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-400">👑</span>
                          <span>Xanny Pro</span>
                          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold">PRO</span>
                        </span>
                      ) : (
                        getModelInfo(selectedModel)?.name
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                currentChat.messages.map((message) => (
                  <div
                    key={message.id}
                    className="space-y-3"
                  >
                    {/* User Message */}
                    <div className="flex justify-end slide-in-right">
                      <div className="max-w-[85%] sm:max-w-[75%] bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl rounded-br-md px-4 py-3 shadow-xl border border-white/10 hover:shadow-2xl transition-all duration-300">
                        <p className="text-white text-sm break-words leading-relaxed">{message.user}</p>
                        <p className="text-blue-100 text-xs mt-2 opacity-70">{message.timestamp}</p>
                      </div>
                    </div>

                    {/* AI Response */}
                    <div className="flex justify-start slide-in-left">
                      <div className="max-w-[95%] sm:max-w-[85%] bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-md px-4 py-3 shadow-xl hover:bg-white/10 transition-all duration-300">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg">{getModelIcon(message.modelId)}</div>
                          <div className="flex-1 min-w-0">
                            <SyntaxHighlighter
                              language="javascript"
                              style={darcula}
                              wrapLongLines
                              className="text-sm !m-0 !bg-transparent"
                              customStyle={{
                                background: 'transparent',
                                padding: 0,
                                margin: 0,
                                overflow: 'auto',
                                fontSize: 'inherit',
                                color: '#e2e8f0',
                              }}
                            >
                              {typeof message.ai === 'string' ? message.ai : JSON.stringify(message.ai, null, 2)}
                            </SyntaxHighlighter>
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                              <p className="text-gray-400 text-xs font-medium">
                                {message.modelId === 'llama-3.3-70b-versatile' ? (
                                  <span className="flex items-center gap-1">
                                    <span className="text-yellow-400">👑</span>
                                    <span>Xanny Pro</span>
                                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-1 py-0.5 rounded-full font-bold">PRO</span>
                                  </span>
                                ) : (
                                  getModelInfo(message.modelId)?.name
                                )}
                              </p>
                              <p className="text-gray-500 text-xs">{message.timestamp}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start slide-in-left">
                  <div className="max-w-[95%] sm:max-w-[85%] bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-md px-4 py-3 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg animate-pulse">{getModelIcon(selectedModel)}</div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                      </div>
                      <span className="text-gray-300 text-sm ml-2 font-medium">Biarkan Saia Berfikir....</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Scroll to Bottom Button */}
            {showScrollButton && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-20 right-4 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-10 border border-white/20 backdrop-blur-sm"
                title="Scroll to bottom"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </button>
            )}
          </div>
        </main>

        {/* Input Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-xl border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] z-50">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="flex gap-3"
            >
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  placeholder="Ask XAN AI anything..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-300 backdrop-blur-sm"
                  value={content}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !content.trim()}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-2xl font-medium hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 border border-white/20"
              >
                {isLoading ? (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="hidden sm:inline text-sm">Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="hidden sm:inline text-sm">Send</span>
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Clear Chat Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Clear Chat</h3>
            </div>

            <p className="text-gray-300 mb-6 leading-relaxed">Are you sure you want to clear all messages in this chat? This action cannot be undone.</p>

            <div className="flex gap-3">
              <button
                onClick={handleCancelClear}
                className="flex-1 px-4 py-2.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-xl font-medium transition-all duration-200 border border-gray-600/50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="flex-1 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-medium transition-all duration-200 border border-red-500/30 hover:border-red-400/50"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Xanny Pro Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Xanny Pro Limit Reached</h3>
            </div>

            <div className="mb-4">
              <p className="text-gray-300 mb-3 leading-relaxed">
                You've reached the daily limit of <span className="text-yellow-400 font-semibold">20 responses</span> for Xanny Pro today.
              </p>
              <p className="text-gray-400 text-sm">
                Your usage: <span className="text-yellow-400 font-semibold">{getXannyProUsage()}/20</span> responses
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-3 mb-4">
              <p className="text-gray-300 text-sm">
                <span className="text-yellow-400">👑 Xanny Pro</span> will be available again tomorrow, or you can continue with <span className="text-blue-400">⚡ Xanny</span> for unlimited usage.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLimitModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-xl font-medium transition-all duration-200 border border-gray-600/50"
              >
                Continue with Xanny
              </button>
              <button
                onClick={() => {
                  setShowLimitModal(false);
                  setSelectedModel('llama-3.1-8b-instant');
                }}
                className="flex-1 px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl font-medium transition-all duration-200 border border-blue-500/30 hover:border-blue-400/50"
              >
                Switch to Xanny
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
