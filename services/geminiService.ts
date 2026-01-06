
import { GoogleGenAI, Type } from "@google/genai";
import { SignageParams, AcrylicType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function parseNaturalLanguageQuery(query: string): Promise<Partial<SignageParams> | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract signage parameters from this request: "${query}". 
      Return the data in the specified JSON schema. If values are missing, provide sensible defaults based on typical signage requests.
      Acrylic types: WHITE, COLORED_BLACK, CLEAR.
      Default width/height: 2ft if not mentioned.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            widthFt: { type: Type.NUMBER },
            heightFt: { type: Type.NUMBER },
            type: { type: Type.STRING, description: "WHITE, COLORED_BLACK, or CLEAR" },
            thickness: { type: Type.STRING, description: "e.g., 3mm, 6mm" },
            isBuildUp: { type: Type.BOOLEAN },
            hasSticker: { type: Type.BOOLEAN },
            hasCutOuts: { type: Type.BOOLEAN },
            hasLights: { type: Type.BOOLEAN },
            isInstallationFar: { type: Type.BOOLEAN },
            depthIn: { type: Type.NUMBER }
          }
        }
      }
    });

    const data = JSON.parse(response.text);
    return data;
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return null;
  }
}
