import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: "Say hello to MediScan AI in one short sentence.",
});

console.log(response.text);