import {Groq} from "groq-sdk"


const GROQ_API = import.meta.env.VITE_GROQ


const groq = new Groq({
  apiKey: GROQ_API,
  dangerouslyAllowBrowser: true,
})

export const requestToGroqAi = async(content) => {
    const reply = await groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content,
            },
        ],
        model: "mixtral-8x7b-32768",
    });
    return reply.choices[0].message.content
};