# XANNY AI - Setup Instructions

## Environment Variables

Create a `.env` file in the root directory with your API keys:

```env
# Groq API Key (Required for Groq models)
# Get your key from: https://console.groq.com/keys
VITE_GROQ_API_KEY=your_groq_api_key_here

# OpenAI API Key (Required for OpenAI models)
# Get your key from: https://platform.openai.com/api-keys
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Google Gemini API Key (Required for Gemini models)
# Get your key from: https://makersuite.google.com/app/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Anthropic API Key (Required for Claude models)
# Get your key from: https://console.anthropic.com/
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create your `.env` file with the API keys above

3. Start the development server:

```bash
npm run dev
```

## Features

- **Multiple AI Models**: Support for Groq, OpenAI, Google Gemini, and Anthropic Claude
- **Chat History**: Persistent chat history stored in localStorage
- **Model Selection**: Easy switching between different AI models
- **Chat Management**: Create, delete, rename, and manage multiple chat sessions
- **Export/Import**: Backup and restore your chat history
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Beautiful gradient design with dark theme

## Supported Models

### Groq

- Llama 3.3 70B Versatile
- Llama 3.1 8B Instant
- Mixtral 8x7B

### OpenAI

- GPT-4
- GPT-3.5 Turbo

### Google Gemini

- Gemini Pro
- Gemini Pro Vision

### Anthropic

- Claude 3 Sonnet
- Claude 3 Haiku

## Usage

1. Select your preferred AI model from the dropdown
2. Start typing your question in the input field
3. Press Enter or click Send to get a response
4. Use the sidebar to manage your chat history
5. Create new chats, rename them, or delete old ones
6. Export your chat history for backup

## Notes

- You only need to add API keys for the providers you want to use
- The app will gracefully handle missing API keys by disabling those models
- Chat history is stored locally in your browser's localStorage
- All conversations are private and never sent to any external servers except the AI providers
