import { GoogleGenAI, Part } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { getGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const previousState = formData.get("previousState") as string;
    
    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const buffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(buffer).toString("base64");

    const prompt = `
      Analyze the emotional state of the speaker in the provided audio.
      Based on the emotion, suggest optimal TTS generation parameters to either:
      1. Mirror the emotion (empathy/rapport building)
      2. Influence the emotion (calming, authoritative, or urgent)
      
      Previous State Context: ${previousState || "None"}
      
      Return a JSON object with:
      - emotion: (string) Detected emotion
      - confidence: (number 0-1)
      - analysis: (string) Brief reasoning
      - tts_parameters: {
          pitch: (number -1 to 1),
          speed: (number 0.5 to 2.0),
          tone: (string description),
          emphasis: (string description)
        }
    `;

    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: prompt },
        {
          inlineData: {
            data: base64Audio,
            mimeType: audioFile.type,
          },
        },
      ],
    });

    const text = response.text || "";
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse analysis" };

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Sentiment Analysis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
