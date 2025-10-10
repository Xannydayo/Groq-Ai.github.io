import './App.css';
import { requestToGroqAi } from './utils/groq';
import { useState } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useRef } from 'react';

function App() {
  const searchRef = useRef();
  const [data, setData] = useState('');
  const [content, setContent] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setChatHistory([]);
    setData('');
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-purple-500/30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">🤖 XANNY | GROQ AI</h1>
            {chatHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-3 py-1.5 text-sm bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
              >
                Clear History
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Chat Container */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Chat History */}
        <div className="mb-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {chatHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-xl text-gray-300 mb-2">Welcome to XANNY AI!</h2>
              <p className="text-gray-400">Start a conversation by typing your question below</p>
            </div>
          ) : (
            chatHistory.map((chat) => (
              <div
                key={chat.id}
                className="space-y-3"
              >
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-[70%] bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl rounded-br-md px-4 py-3 shadow-lg">
                    <p className="text-white text-sm">{chat.user}</p>
                    <p className="text-purple-200 text-xs mt-1">{chat.timestamp}</p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start">
                  <div className={`max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 shadow-lg ${chat.isError ? 'bg-red-900/50 border border-red-500/30' : 'bg-gray-800/50 border border-gray-600/30'}`}>
                    <div className="flex items-start gap-2 mb-2">
                      <div className="text-lg">🤖</div>
                      <div className="flex-1">
                        <SyntaxHighlighter
                          language="javascript"
                          style={darcula}
                          wrapLongLines
                          className="text-sm"
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
              <div className="bg-gray-800/50 border border-gray-600/30 rounded-2xl rounded-bl-md px-4 py-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="text-lg">🤖</div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                  <span className="text-gray-300 text-sm ml-2">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-600/30 rounded-2xl p-4 shadow-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex gap-3"
          >
            <input
              placeholder="Type your question here..."
              className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
              value={content}
              onKeyDown={handleKeyDown}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !content.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Send</span>
                  <span>🚀</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Current Response Display (for backward compatibility) */}
        {data && !isLoading && chatHistory.length === 0 && (
          <div className="mt-6 bg-gray-800/30 backdrop-blur-sm border border-gray-600/30 rounded-2xl p-4 shadow-xl">
            <div className="flex items-start gap-2">
              <div className="text-lg">🤖</div>
              <div className="flex-1">
                <SyntaxHighlighter
                  language="javascript"
                  style={darcula}
                  wrapLongLines
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
