import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { getGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { report } = await req.json();

    const systemPrompt = `
      You are an Adversarial Trend Synthesizer.
      Based on the current threat intelligence or report provided, forecast the evolution of these tactics for 2026-2027.
      
      Focus on:
      - Likely AI enhancements (real-time adaptation, emotion mirroring).
      - Multi-modal lures (deepfake video/audio combined with smishing).
      - Infrastructure shifts (decentralized edge nodes, encrypted C2 over new protocols).
      
      Context/Report:
      ${report}
      
      Output a structured "2026-2027 THREAT FORECAST" with technical depth and defensive recommendations.
    `;

    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
    });
    
    return NextResponse.json({ forecast: response.text });
  } catch (error: any) {
    console.error("Forecast error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
