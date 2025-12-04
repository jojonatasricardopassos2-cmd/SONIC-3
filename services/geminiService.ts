import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getBossTaunt = async (context: string): Promise<string> => {
  if (!process.env.API_KEY) return "Prepare to be crushed, rodent!";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a villainous mad scientist piloting a giant robot (similar to Dr. Robotnik/Eggman). 
      You are fighting a blue hedgehog. 
      Context of current battle: ${context}.
      Generate a SINGLE short, arrogant taunt sentence (max 10 words). DO NOT include quotes.`,
    });

    return response.text.trim() || "Muahaha! You cannot defeat me!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "System Malfunction! I will still destroy you!";
  }
};