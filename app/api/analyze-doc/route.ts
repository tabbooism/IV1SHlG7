import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { getGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { content, fileName } = await req.json();

    const systemPrompt = `
      You are an OSINT and Adversarial Research AI.
      Analyze the following document content for a red team training simulation.
      Document Name: ${fileName}
      
      Tasks:
      1. Identify potential information leaks or sensitive data points.
      2. Suggest how an adversary (like an APT) might use this information in a vishing or smishing campaign.
      3. Create a profile of the likely target based on the document.
      4. Map findings to MITRE ATT&CK techniques.
      
      Document Content:
      ${content.substring(0, 20000)}
      
      Format your output with clear headers and bullet points. 
      Start with a banner: "[SIMULATION_INTEL_REPORT]"
    `;

    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
    });
    
    return NextResponse.json({ analysis: response.text });
  } catch (error: any) {
    console.error("Doc analysis error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
