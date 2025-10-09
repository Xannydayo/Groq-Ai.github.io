import { Groq } from 'groq-sdk';

const GROQ_API = import.meta.env.VITE_GROQ;

const groq = new Groq({
  apiKey: GROQ_API,
  dangerouslyAllowBrowser: true,
});

export const requestToGroqAi = async (content) => {
  try {
    const reply = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content,
        },
      ],
      model: 'llama-3.3-70b-versatile',
    });
    return reply.choices[0].message.content;
  } catch (error) {
    console.error('Groq API Error:', error);
    // Fallback to alternative model if the primary one fails
    try {
      const reply = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content,
          },
        ],
        model: 'llama-3.1-8b-instant',
      });
      return reply.choices[0].message.content;
    } catch (fallbackError) {
      console.error('Fallback model also failed:', fallbackError);
      throw new Error('All Groq models are currently unavailable. Please try again later.');
    }
  }
};
