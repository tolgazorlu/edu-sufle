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
            "position": { "x": 250, "y": 25 }
          },
          {
            "id": "2",
            "data": { "label": "Subtopic 1" },
            "position": { "x": 100, "y": 125 }
          }
        ],
        "edges": [
          {
            "id": "e1",
            "source": "1",
            "target": "2",
            "type": "straight"
          }
        ]
      }

      Guidelines:
      - Create 5-10 nodes with meaningful connections
      - Use sequential numbers for node IDs (1, 2, 3, etc.)
      - Create ONE edge connecting EACH node pair that has a relationship
      - First node should be centered with other nodes positioned around it
      - Position nodes in a visually appealing layout (x range: 0-800, y range: 0-600)
      - ALL nodes must be connected to at least one other node
      - CRITICAL: The central topic (node 1) must connect to EVERY main subtopic
      - EVERY node (except node 1) must have at least one incoming connection
      - Use "straight" for edge type (not "smoothstep")
      - Use sequential numbers for edge IDs (e1, e2, e3, etc.)
    `;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

    console.log("Sending request to Gemini API for topic:", topic);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: mindmapGeneratorPrompt }] }],
      config: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    if (!response || !response.candidates || response.candidates.length === 0) {
      console.error("Empty response from Gemini API");
      return NextResponse.json(
        { error: "Failed to get response from AI" },
        { status: 500 }
      );
    }

    console.log("Received response from Gemini API");
    
    // Get text response and attempt to parse JSON
    const responseText = response.text || "";
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
      
      // If API didn't generate enough edges, create default connections from node 1 to all others
      if (mindmapData.edges.length < mindmapData.nodes.length - 1) {
        console.log("Not enough edges detected, adding default connections");
        
        // Clear existing edges
        mindmapData.edges = [];
        
        // Connect node 1 to all other nodes
        for (let i = 2; i <= mindmapData.nodes.length; i++) {
          mindmapData.edges.push({
            id: `e${i-1}`,
            source: "1",
            target: i.toString(),
            type: "straight"
          });
        }
      }
      
      // Ensure all edges have proper structure and type
      mindmapData.edges = mindmapData.edges.map((edge: any, index: number) => {
        return {
          id: `e${index + 1}`,
          source: edge.source,
          target: edge.target,
          type: "straight"  // Use straight type instead of smoothstep
        };
      });
      
      console.log(`Generated mindmap with ${mindmapData.nodes.length} nodes and ${mindmapData.edges.length} edges`);
      console.log("Edges:", JSON.stringify(mindmapData.edges));
      
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
            position: { x: 250, y: 25 }
          },
          {
            id: '2',
            data: { label: 'Concept 1' },
            position: { x: 100, y: 125 }
          },
          {
            id: '3',
            data: { label: 'Concept 2' },
            position: { x: 400, y: 125 }
          }
        ],
        edges: [
          { id: 'e1', source: '1', target: '2', type: 'straight' },
          { id: 'e2', source: '1', target: '3', type: 'straight' }
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