import './App.css';
import { requestToGroqAi } from './utils/groq';
import { useState, useRef, useEffect } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/hljs';

function App() {
  const searchRef = useRef();
  const chatContainerRef = useRef();
  const inputRef = useRef();
  const [data, setData] = useState('');
  const [content, setContent] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Auto scroll to bottom when chat history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      // Smooth scroll to bottom
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [chatHistory, isLoading]);

  // Check if user has scrolled up to show scroll button
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        setShowScrollButton(!isAtBottom && chatHistory.length > 0);
      }
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [chatHistory.length]);

  // Auto focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto focus input after sending message (when not loading)
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const handleSearch = (event) => {
    const keyword = searchRef.current.value;
    if (keyword.trim() === '') return;
    event.preventDefault();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    try {
      setIsLoading(true);
      const userMessage = content;
      const ai = await requestToGroqAi(content);

      // Add to chat history
      const newChat = {
        id: Date.now(),
        user: userMessage,
        ai: ai,
        timestamp: new Date().toLocaleTimeString(),
      };

      setChatHistory((prev) => [...prev, newChat]);
      setContent('');
      setData(ai);

      // Focus input after sending message
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = `Error: ${error.message}`;
      setData(errorMessage);

      // Add error to chat history too
      const errorChat = {
        id: Date.now(),
        user: content,
        ai: errorMessage,
        timestamp: new Date().toLocaleTimeString(),
        isError: true,
      };

      setChatHistory((prev) => [...prev, errorChat]);

      // Focus input after error
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setChatHistory([]);
    setData('');

    // Focus input after clearing history
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent text-center sm:text-left">🤖 XANNY | GROQ AI</h1>
            {chatHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-3 py-1.5 text-sm bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-600/50 transition-colors border border-gray-600/50 w-full sm:w-auto"
              >
                Clear History
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Chat Container */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Chat History */}
        <div className="relative mb-4 sm:mb-6">
          <div
            ref={chatContainerRef}
            className="space-y-3 sm:space-y-4 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-1 sm:pr-2"
          >
            {chatHistory.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">💬</div>
                <h2 className="text-lg sm:text-xl text-gray-300 mb-2">Welcome to XANNY AI!</h2>
                <p className="text-sm sm:text-base text-gray-400">Start a conversation by typing your question below</p>
              </div>
            ) : (
              chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className="space-y-3"
                >
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] sm:max-w-[70%] bg-gradient-to-r from-gray-700 to-gray-600 rounded-2xl rounded-br-md px-3 sm:px-4 py-2 sm:py-3 shadow-lg border border-gray-600/30">
                      <p className="text-white text-sm break-words">{chat.user}</p>
                      <p className="text-gray-300 text-xs mt-1">{chat.timestamp}</p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className={`max-w-[95%] sm:max-w-[85%] rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3 shadow-lg ${chat.isError ? 'bg-red-900/30 border border-red-500/20' : 'bg-gray-800/70 border border-gray-700/50'}`}>
                      <div className="flex items-start gap-2 mb-2">
                        <div className="text-base sm:text-lg">🤖</div>
                        <div className="flex-1 min-w-0">
                          <SyntaxHighlighter
                            language="javascript"
                            style={darcula}
                            wrapLongLines
                            className="text-xs sm:text-sm !m-0"
                            customStyle={{
                              background: 'transparent',
                              padding: 0,
                              margin: 0,
                              overflow: 'auto',
                              fontSize: 'inherit',
                            }}
                          >
                            {chat.ai}
                          </SyntaxHighlighter>
                          <p className={`text-xs mt-1 ${chat.isError ? 'text-red-300' : 'text-gray-400'}`}>{chat.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[95%] sm:max-w-[85%] bg-gray-800/70 border border-gray-700/50 rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="text-base sm:text-lg">🤖</div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                    <span className="text-gray-300 text-xs sm:text-sm ml-2">sedang berfikir keras...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Scroll to Bottom Button */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="scroll-button absolute bottom-4 right-4 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10 border border-gray-600/50"
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

        {/* Input Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-3 sm:p-4 shadow-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              ref={inputRef}
              placeholder="Type your question here..."
              className="flex-1 bg-gray-700/70 border border-gray-600/50 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-sm sm:text-base"
              value={content}
              onKeyDown={handleKeyDown}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !content.trim()}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base w-full sm:w-auto"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Send</span>
                  <span>🚀</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Current Response Display (for backward compatibility) */}
        {data && !isLoading && chatHistory.length === 0 && (
          <div className="mt-4 sm:mt-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-3 sm:p-4 shadow-xl">
            <div className="flex items-start gap-2">
              <div className="text-base sm:text-lg">🤖</div>
              <div className="flex-1 min-w-0">
                <SyntaxHighlighter
                  language="javascript"
                  style={darcula}
                  wrapLongLines
                  className="text-xs sm:text-sm !m-0"
                  customStyle={{
                    background: 'transparent',
                    padding: 0,
                    margin: 0,
                    overflow: 'auto',
                    fontSize: 'inherit',
                  }}
                >
                  {data}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
