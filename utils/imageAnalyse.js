import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("⚠️ GEMINI_API_KEY not set in .env. The application cannot start without it.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function analyzeImageWithGemini(imagePath) {
  try {
    const prompt = `
        Analyze this image and determine if it shows damage to public property.

        If public property damage (pothole, street light, road damage, drainage, traffic signals, pipelines, public tap, garbage, etc.), return:
        { "category": "...", "importance": "...", "cost_estimate": "...", "confidence": 0.xx, "is_public_property": true }

        Otherwise return:
        { "category": "Others", "importance": null, "cost_estimate": "0", "confidence": 0.xx, "is_public_property": false }
    `;

    const imageBuffer = fs.readFileSync(imagePath);

    const result = await geminiModel.generateContent([
      prompt,
      { inlineData: { mimeType: "image/jpeg", data: imageBuffer.toString("base64") } },
    ]);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```|(\{[\s\S]*\})/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);

    return {
      category: "Others",
      importance: null,
      cost_estimate: "0",
      confidence: 0.7,
      is_public_property: false,
    };
  } catch (err) {
    console.error("Gemini error:", err);
    return {
      category: "Others",
      importance: null,
      cost_estimate: "0",
      confidence: 0.7,
      is_public_property: false,
    };
  }
}