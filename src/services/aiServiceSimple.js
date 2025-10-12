import { Groq } from 'groq-sdk';

// Simple AI service with basic models
let groq;

// Initialize Groq
if (import.meta.env.VITE_GROQ || import.meta.env.VITE_GROQ_API_KEY) {
  try {
    groq = new Groq({
      apiKey: import.meta.env.VITE_GROQ || import.meta.env.VITE_GROQ_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  } catch (error) {
    console.warn('Groq initialization failed:', error);
  }
}

// Simple models configuration
export const getAllModels = () => {
  const models = [];

  // Add Groq models if available
  if (groq) {
    models.push({ id: 'llama-3.3-70b-versatile', name: 'Xanny Pro', provider: 'Groq' }, { id: 'llama-3.1-8b-instant', name: 'Xanny', provider: 'Groq' });
  }

  return models;
};

export const getModelInfo = (modelId) => {
  const allModels = getAllModels();
  return allModels.find((model) => model.id === modelId);
};

// Simple AI Service class
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
          if (!groq) throw new Error('Groq is not available. Please check your VITE_GROQ_API_KEY in the .env file.');
          response = await this.getGroqResponse(message, modelId);
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

    const content = response.choices[0].message.content;

    // Ensure we always return a string
    if (typeof content === 'string') {
      return content;
    } else if (content === null || content === undefined) {
      return 'No response received from the AI model.';
    } else {
      return JSON.stringify(content);
    }
  }
}

const aiService = new AIService();
export default aiService;
