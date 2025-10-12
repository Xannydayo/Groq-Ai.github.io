import { useState } from 'react';
import { chatStorage } from '../utils/chatStorage';
import { getModelInfo } from '../services/aiServiceSimple';

const ChatSidebar = ({ isOpen, onToggle, chats, currentChatId, onChatSelect, onNewChat, onDeleteChat, onRefreshChats }) => {
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [showImportExport, setShowImportExport] = useState(false);

  const handleEditStart = (chat) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const handleEditSave = () => {
    if (editTitle.trim()) {
      chatStorage.updateChatTitle(editingChatId, editTitle.trim());
      onRefreshChats();
    }
    setEditingChatId(null);
    setEditTitle('');
  };

  const handleEditCancel = () => {
    setEditingChatId(null);
    setEditTitle('');
  };

  const handleExport = () => {
    chatStorage.exportChats();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      chatStorage
        .importChats(file)
        .then(() => {
          onRefreshChats();
          alert('Chats imported successfully!');
        })
        .catch((error) => {
          alert('Error importing chats: ' + error.message);
        });
    }
  };

  const getModelIcon = (modelId) => {
    const model = getModelInfo(modelId);
    if (!model) return '🔮';

    switch (model.provider) {
      case 'Groq':
        return '⚡';
      default:
        return '🔮';
    }
  };

  const MenuIcon = () => (
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
  );

  const XIcon = () => (
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
  );

  const PlusIcon = () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );

  const EditIcon = () => (
    <svg
      className="w-3 h-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );

  const TrashIcon = () => (
    <svg
      className="w-3 h-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );

  const CheckIcon = () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );

  const DownloadIcon = () => (
    <svg
      className="w-3 h-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );

  const UploadIcon = () => (
    <svg
      className="w-3 h-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
      />
    </svg>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:relative top-0 left-0 h-full w-80 bg-gray-900/95 backdrop-blur-md border-r border-gray-700/50 z-50 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Chat History
            </h2>
            <button
              onClick={onToggle}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
            >
              <XIcon />
            </button>
          </div>

          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
          >
            <PlusIcon />
            New Chat
          </button>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setShowImportExport(!showImportExport)}
              className="flex-1 flex items-center justify-center gap-1 text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded hover:bg-gray-600/50 transition-colors"
            >
              <DownloadIcon />
              Export
            </button>
            <label className="flex-1 flex items-center justify-center gap-1 text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded hover:bg-gray-600/50 transition-colors cursor-pointer">
              <UploadIcon />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2">
          {chats.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <svg
                className="w-12 h-12 mx-auto mb-3 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-sm">No chats yet</p>
              <p className="text-xs">Start a new conversation!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`
                    group relative p-3 rounded-lg cursor-pointer transition-all
                    ${currentChatId === chat.id ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-gray-800/50 hover:bg-gray-700/50 border border-transparent'}
                  `}
                  onClick={() => onChatSelect(chat.id)}
                >
                  {editingChatId === chat.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave();
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSave();
                        }}
                        className="text-green-400 hover:text-green-300"
                      >
                        <CheckIcon />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCancel();
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XIcon />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-medium text-white truncate flex-1">{chat.title}</h3>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditStart(chat);
                            }}
                            className="text-gray-400 hover:text-white p-1"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this chat?')) {
                                onDeleteChat(chat.id);
                              }
                            }}
                            className="text-gray-400 hover:text-red-400 p-1"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          {getModelIcon(chat.modelId)}
                          {getModelInfo(chat.modelId)?.name || 'Unknown'}
                        </span>
                        <span>{chat.messages.length} messages</span>
                      </div>

                      <div className="text-xs text-gray-500 mt-1">{new Date(chat.updatedAt).toLocaleDateString()}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="text-xs text-gray-500 text-center">
            {chats.length} chat{chats.length !== 1 ? 's' : ''} saved
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatSidebar;
