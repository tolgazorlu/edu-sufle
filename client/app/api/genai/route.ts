import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { surveyData } = await request.json();
    
    const pathGeneratorPrompt = `
      Based on the following user input:
      ${JSON.stringify(surveyData)}
      
      Create a personalized learning path with the following information:
      1. A meaningful title for the learning path
      2. A detailed description of what this path will help the user achieve
      3. Create 3-5 specific tasks that will help achieve these objectives.
      
      Each task should have:
      - A title
      - A description
      - A priority level (low, medium, high, or critical)
      - A status (not started, in progress, completed)
      - Relevant tags (comma-separated)
      
      Return in JSON format with the following structure:
      {
        "title": "Path title",
        "description": "Path description",
        "tasks": [
          {
            "title": "Task title",
            "description": "Task description",
            "priority": "priority level",
            "status": "status",
            "tags": "tag1, tag2, tag3"
          },
          ...
        ]
      }
    `;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: pathGeneratorPrompt,
    });
    
    return NextResponse.json({ result: response });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
} 