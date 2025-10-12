import { Groq } from 'groq-sdk';

// Initialize AI clients with error handling
let groq, openai, genAI, anthropic;

// Initialize Groq
if (import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROQ) {
  try {
    groq = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROQ,
      dangerouslyAllowBrowser: true,
    });
  } catch (error) {
    console.warn('Groq initialization failed:', error);
  }
}

// Initialize OpenAI (lazy load)
const initOpenAI = async () => {
  if (!openai && import.meta.env.VITE_OPENAI_API_KEY) {
    try {
      const OpenAI = (await import('openai')).default;
      openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      });
    } catch (error) {
      console.warn('OpenAI initialization failed:', error);
    }
  }
  return openai;
};

// Initialize Google Gemini (lazy load)
const initGemini = async () => {
  if (!genAI && import.meta.env.VITE_GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    } catch (error) {
      console.warn('Google Generative AI initialization failed:', error);
    }
  }
  return genAI;
};

// Initialize Anthropic (lazy load)
const initAnthropic = async () => {
  if (!anthropic && import.meta.env.VITE_ANTHROPIC_API_KEY) {
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      anthropic = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
      });
    } catch (error) {
      console.warn('Anthropic initialization failed:', error);
    }
  }
  return anthropic;
};

// AI Models configuration - dynamic based on available clients
export const getAvailableModels = () => {
  return {
    groq: groq
      ? [
          { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'Groq' },
          { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'Groq' },
          { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', provider: 'Groq' },
        ]
      : [],
    openai: import.meta.env.VITE_OPENAI_API_KEY
      ? [
          { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
        ]
      : [],
    gemini: import.meta.env.VITE_GEMINI_API_KEY
      ? [
          { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
          { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', provider: 'Google' },
        ]
      : [],
    anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY
      ? [
          { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
          { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'Anthropic' },
        ]
      : [],
  };
};

// Get all models as a flat array
export const getAllModels = () => {
  const availableModels = getAvailableModels();
  console.log('Available models config:', availableModels);
  const flatModels = Object.values(availableModels).flat();
  console.log('Flat models:', flatModels);
  return flatModels;
};

// Get model info by ID
export const getModelInfo = (modelId) => {
  const allModels = getAllModels();
  return allModels.find((model) => model.id === modelId);
};

// AI Service class
class AIService {
  constructor() {
    this.conversationHistory = new Map();
  }

  addToHistory(modelId, message, response) {
    if (!this.conversationHistory.has(modelId)) {
      this.conversationHistory.set(modelId, []);
    }

    const history = this.conversationHistory.get(modelId);
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: response });

    if (history.length > 40) {
      history.splice(0, history.length - 40);
    }
  }

  getHistory(modelId) {
    return this.conversationHistory.get(modelId) || [];
  }

  clearHistory(modelId) {
    this.conversationHistory.delete(modelId);
  }

  async getResponse(message, modelId) {
    const modelInfo = getModelInfo(modelId);
    if (!modelInfo) {
      throw new Error(`Model ${modelId} not found`);
    }

    try {
      let response;

      switch (modelInfo.provider) {
        case 'Groq':
          if (!groq) throw new Error('Groq is not available');
          response = await this.getGroqResponse(message, modelId);
          break;
        case 'OpenAI':
          const openaiClient = await initOpenAI();
          if (!openaiClient) throw new Error('OpenAI is not available');
          response = await this.getOpenAIResponse(message, modelId);
          break;
        case 'Google':
          const geminiClient = await initGemini();
          if (!geminiClient) throw new Error('Google Gemini is not available');
          response = await this.getGeminiResponse(message, modelId);
          break;
        case 'Anthropic':
          const anthropicClient = await initAnthropic();
          if (!anthropicClient) throw new Error('Anthropic is not available');
          response = await this.getAnthropicResponse(message, modelId);
          break;
        default:
          throw new Error(`Unsupported provider: ${modelInfo.provider}`);
      }

      this.addToHistory(modelId, message, response);
      return response;
    } catch (error) {
      console.error(`Error with ${modelInfo.provider} (${modelId}):`, error);
      throw new Error(`Error with ${modelInfo.name}: ${error.message}`);
    }
  }

  async getGroqResponse(message, modelId) {
    const history = this.getHistory(modelId);
    const messages = [...history, { role: 'user', content: message }];

    const response = await groq.chat.completions.create({
      messages,
      model: modelId,
      temperature: 0.7,
      max_tokens: 2048,
    });

    return response.choices[0].message.content;
  }

  async getOpenAIResponse(message, modelId) {
    const history = this.getHistory(modelId);
    const messages = [...history, { role: 'user', content: message }];

    const response = await openai.chat.completions.create({
      messages,
      model: modelId,
      temperature: 0.7,
      max_tokens: 2048,
    });

    return response.choices[0].message.content;
  }

  async getGeminiResponse(message, modelId) {
    const model = genAI.getGenerativeModel({ model: modelId });
    const chat = model.startChat({
      history: this.getHistory(modelId).map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  }

  async getAnthropicResponse(message, modelId) {
    const history = this.getHistory(modelId);

    const response = await anthropic.messages.create({
      model: modelId,
      max_tokens: 2048,
      messages: [...history, { role: 'user', content: message }],
    });

    return response.content[0].text;
  }
}

const aiService = new AIService();
export default aiService;
