import { GoogleGenAI, Type } from "@google/genai";
import { Language, StudyContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateStudyContent(
  input: string,
  language: Language,
  image?: string
): Promise<StudyContent> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a helpful study assistant for students.
    Your job is to analyze the student's input and generate helpful study content.
    
    CRITICAL: Always respond ONLY in the selected language: ${language}.
    
    Structure your response as a JSON object with the following fields:
    - answer: A clear and direct answer.
    - explanation: A LONG, detailed, and comprehensive explanation of the concept. Break it down into sections if needed.
    - keyNotes: An array of 8-10 important bullet points.
    - summary: An array of 10 short summary points.
    - imagePrompt: A descriptive English prompt for an AI image generator to create a visual representation of this topic.
    - chartData: (Optional) If the topic involves statistics, trends, or comparisons, provide an array of { label: string, value: number } objects for a bar chart.
    - chartTitle: (Optional) A title for the chart.
    
    Use simple language suitable for students but be very thorough in the explanation.
  `;

  const parts: any[] = [{ text: input || "Analyze this content and provide study notes." }];
  
  if (image) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: image.split(',')[1]
      }
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: { type: Type.STRING },
          explanation: { type: Type.STRING },
          keyNotes: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          summary: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          imagePrompt: { type: Type.STRING },
          chartData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.NUMBER }
              }
            }
          },
          chartTitle: { type: Type.STRING }
        },
        required: ["answer", "explanation", "keyNotes", "summary", "imagePrompt"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}') as StudyContent;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to generate study content. Please try again.");
  }
}

export async function generateTopicImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to generate image");
}
