import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { topic } = await request.json();
    
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: "A valid topic is required" },
        { status: 400 }
      );
    }
    
    // More structured prompt to ensure proper JSON formatting
    const mindmapGeneratorPrompt = `
      Generate a mindmap flowchart for the topic: "${topic}"

      Create a structured representation with nodes and edges that shows related concepts and their connections.
      
      The response MUST BE VALID JSON without any additional text or explanation and follow this exact structure:
      {
        "nodes": [
          {
            "id": "1",
            "data": { "label": "Main Topic" },
            "position": { "x": 250, "y": 25 },
            "type": "input"
          },
          {
            "id": "2",
            "data": { "label": "Subtopic 1" },
            "position": { "x": 100, "y": 125 },
            "type": "default"
          }
        ],
        "edges": [
          {
            "id": "e1-2",
            "source": "1",
            "target": "2",
            "label": "relates to",
            "type": "step"
          }
        ]
      }

      Guidelines:
      - Create 5-10 nodes with meaningful connections
      - Use sequential numbers for node IDs (1, 2, 3, etc.)
      - Use e{source}-{target} format for edge IDs (e1-2, e1-3, etc.)
      - Position nodes in a visually appealing layout (x range: 0-500, y range: 0-400)
      - First node (id: "1") should be the main topic with type "input"
      - All other nodes should have type "default"
      - Keep labels concise and descriptive
      - Edges should describe the relationship between connected nodes
    `;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

    console.log("Sending request to Gemini API for topic:", topic);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: mindmapGeneratorPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    if (!response || !response.response) {
      console.error("Empty response from Gemini API");
      return NextResponse.json(
        { error: "Failed to get response from AI" },
        { status: 500 }
      );
    }

    console.log("Received response from Gemini API");
    
    // Get text response and attempt to parse JSON
    const responseText = response.response.text();
    console.log("Raw response:", responseText.substring(0, 200) + "...");
    
    // Try to extract JSON object if it's wrapped in other text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : responseText;
    
    try {
      const mindmapData = JSON.parse(jsonContent);
      
      // Validate that the response has the expected structure
      if (!mindmapData.nodes || !Array.isArray(mindmapData.nodes) || 
          !mindmapData.edges || !Array.isArray(mindmapData.edges)) {
        console.error("Invalid mindmap data structure", mindmapData);
        return NextResponse.json(
          { error: "AI response had invalid structure" },
          { status: 500 }
        );
      }
      
      console.log(`Generated mindmap with ${mindmapData.nodes.length} nodes and ${mindmapData.edges.length} edges`);
      return NextResponse.json({ result: mindmapData });
      
    } catch (e) {
      console.error("Error parsing JSON from Gemini response:", e);
      console.error("Problematic content:", jsonContent);
      
      // Return fallback data in case of parsing error
      const fallbackData = {
        nodes: [
          {
            id: '1',
            data: { label: topic },
            position: { x: 250, y: 25 },
            type: 'input',
          },
          {
            id: '2',
            data: { label: 'AI could not generate a complete mindmap' },
            position: { x: 250, y: 125 },
            type: 'default',
          },
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2', label: 'error', type: 'step' },
        ],
      };
      
      return NextResponse.json({ 
        result: fallbackData,
        error: "Could not parse AI response, showing fallback data"
      });
    }
  } catch (error) {
    console.error("Error generating mindmap:", error);
    return NextResponse.json(
      { error: "Failed to generate mindmap" },
      { status: 500 }
    );
  }
} 