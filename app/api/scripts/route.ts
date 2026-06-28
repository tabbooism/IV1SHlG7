import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { getGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { prompt, persona, parameters } = await req.json();

    const systemPrompt = `
      You are an advanced TTS Script Architect. 
      Generate a response script for a training persona: ${persona}.
      Apply these specific emotional vocal cues in your response using SSML-like annotations or descriptive tags:
      Pitch Shift: ${parameters?.pitch || 0}
      Speed: ${parameters?.speed || 1.0}
      Tone: ${parameters?.tone || "Neutral"}
      
      Context: ${prompt}
      
      Output the script in a way that helps a TTS engine or a human actor understand the emotional delivery.
    `;

    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
    });
    
    return NextResponse.json({ script: response.text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
