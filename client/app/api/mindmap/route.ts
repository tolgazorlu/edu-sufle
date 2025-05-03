import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Helper function to safely stringify objects for logging
function safeStringify(obj: any, maxLength = 500): string {
  try {
    const str = JSON.stringify(obj, null, 2);
    if (str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength / 2) + 
           "\n...[content truncated]...\n" + 
           str.substring(str.length - maxLength / 2);
  } catch (e) {
    return `[Could not stringify object: ${e}]`;
  }
}

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
            "data": { 
              "label": "Main Topic",
              "description": "A comprehensive and detailed explanation of the main topic covering key points, importance, and fundamental concepts. This should be 3-5 sentences that thoroughly explain the topic and its significance in the learning path.",
              "resources": [
                {
                  "title": "Resource Title 1",
                  "description": "Short description of the educational resource (1-2 sentences)",
                  "url": "https://example.com/resource1"
                },
                {
                  "title": "Resource Title 2",
                  "description": "Short description of the educational resource (1-2 sentences)",
                  "url": "https://example.com/resource2"
                }
              ]
            },
            "position": { "x": 250, "y": 25 }
          },
          {
            "id": "2",
            "data": { 
              "label": "Subtopic 1",
              "description": "Detailed explanation of this subtopic, its relationship to the main topic, and why it's important to understand. This description should provide clear context about the concept and how it fits into the broader learning path.",
              "resources": [
                {
                  "title": "Resource Title 3",
                  "description": "Short description of the educational resource (1-2 sentences)",
                  "url": "https://example.com/resource3"
                }
              ]
            },
            "position": { "x": 100, "y": 125 }
          }
        ],
        "edges": [
          {
            "id": "e1",
            "source": "1",
            "target": "2",
            "type": "smoothstep",
            "animated": true
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
      - Use "smoothstep" for edge type
      - Use "animated": true for edge animation
      - Use sequential numbers for edge IDs (e1, e2, e3, etc.)
      - EACH node MUST have a detailed "description" field (3-5 sentences) that explains the concept thoroughly
      - For EACH node, provide 2-4 REAL, EXISTING resources with valid URLs
      - Resources should be high-quality educational materials like:
          - Official documentation and guides
          - Tutorial articles and blog posts from respected sources
          - Video tutorials and courses from platforms like YouTube, Coursera, Udemy
          - GitHub repositories with example code or projects
          - Books, papers, or research articles when relevant
      - URLs must be real, accessible, and directly relevant to the node's topic
      - Each resource should have a descriptive title and a brief informative description
      - Resources should be diverse in format (mix of articles, videos, documentation, etc.)
      - For programming topics, include resources with practical examples and code samples
      
      CRITICAL JSON FORMATTING REQUIREMENTS:
      - Ensure ALL object properties have double quotes around the keys
      - Place a comma after EVERY object or array element EXCEPT the last one
      - DO NOT place commas after the last element in arrays or objects
      - Make sure all strings are properly enclosed in double quotes
      - Properly escape any double quotes inside string values with a backslash \\
      - Ensure all brackets and braces are properly closed and matched
      - Double-check that each resource object in arrays has a comma after it (except the last one)
      - Do not use trailing commas
      - Format the entire JSON as a single complete object
    `;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

    console.log("Sending request to Gemini API for topic:", topic);
    
    // Call Gemini API with error handling
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: mindmapGeneratorPrompt }] }],
      });
    } catch (apiError) {
      console.error("Error calling Gemini API:", apiError);
      return NextResponse.json(
        { error: "Failed to communicate with the AI model. Please try again later." },
        { status: 500 }
      );
    }

    // Validate response exists and has expected structure
    if (!response || !response.candidates || response.candidates.length === 0) {
      console.error("Empty response from Gemini API");
      return NextResponse.json(
        { error: "Failed to get response from AI" },
        { status: 500 }
      );
    }

    // Process the response text
    const responseText = response.text || "";
    console.log("Raw response:", responseText.substring(0, 200) + "...");
    
    // Early rejection of obvious error messages or non-JSON responses
    if (
      responseText.trim().startsWith("An error") || 
      responseText.trim().startsWith("I apologize") ||
      !responseText.includes("{")
    ) {
      console.error("Response appears to be an error message instead of JSON:", responseText);
      return NextResponse.json(
        { error: "The AI model returned an error response" },
        { status: 500 }
      );
    }
    
    // Extract JSON content from response
    let jsonContent = "";
    
    // Check if response contains a code block with JSON
    const codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      console.log("Found JSON in code block");
      jsonContent = codeBlockMatch[1];
    } else {
      // Try to find a complete JSON object
      const jsonMatch = responseText.match(/(\{[\s\S]*\})/);
      if (jsonMatch && jsonMatch[1]) {
        console.log("Found JSON object in response");
        jsonContent = jsonMatch[1];
      } else {
        // No JSON object found, reject the response
        console.error("No JSON object found in response");
        return NextResponse.json(
          { error: "The AI model did not return properly formatted data" },
          { status: 500 }
        );
      }
    }
    
    // Try to parse and fix JSON
    let mindmapData;
    try {
      // First attempt: parse as-is
      try {
        mindmapData = JSON.parse(jsonContent);
        console.log("Successfully parsed JSON");
      } catch (parseError) {
        console.warn("Initial JSON parsing failed:", parseError);
        
        // Fix 1: Balance braces and brackets
        let fixedJson = jsonContent;
        
        // Count and fix unbalanced brackets
        const openBraces = (jsonContent.match(/\{/g) || []).length;
        const closeBraces = (jsonContent.match(/\}/g) || []).length;
        const openBrackets = (jsonContent.match(/\[/g) || []).length;
        const closeBrackets = (jsonContent.match(/\]/g) || []).length;
        
        if (openBraces > closeBraces) {
          fixedJson += "}".repeat(openBraces - closeBraces);
        }
        
        if (openBrackets > closeBrackets) {
          fixedJson += "]".repeat(openBrackets - closeBrackets);
        }
        
        // Fix 2: Remove trailing commas
        fixedJson = fixedJson
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']');
        
        // Fix 3: Fix common JSON syntax issues
        fixedJson = fixedJson
          .replace(/([^\\])"([^"]*)"/g, '$1\\"$2\\"') // Escape unescaped quotes in strings
          .replace(/([^\\])'([^']*)'/g, '$1"$2"') // Convert single quotes to double quotes
          .replace(/:\s*undefined\s*([,\}])/g, ':null$1'); // Replace undefined with null
        
        // Try to parse the fixed JSON
        try {
          mindmapData = JSON.parse(fixedJson);
          console.log("Successfully parsed fixed JSON");
        } catch (fixError) {
          // If still can't parse, throw to fallback handler
          throw new Error("Could not parse JSON after fixes");
        }
      }
      
      // Validate the parsed data has expected structure
      if (
        !mindmapData || 
        !mindmapData.nodes || 
        !Array.isArray(mindmapData.nodes) || 
        !mindmapData.edges || 
        !Array.isArray(mindmapData.edges)
      ) {
        throw new Error("Invalid mindmap data structure");
      }
      
      // Ensure we have enough edges by creating default connections
      if (mindmapData.edges.length < mindmapData.nodes.length - 1) {
        console.log("Not enough edges detected, adding default connections");
        
        // Reset edges array and create connections from node 1 to all others
        mindmapData.edges = [];
        for (let i = 2; i <= mindmapData.nodes.length; i++) {
          mindmapData.edges.push({
            id: `e${i-1}`,
            source: "1",
            target: i.toString(),
            type: "smoothstep",
            animated: true
          });
        }
      }
      
      // Standardize edge format
      mindmapData.edges = mindmapData.edges.map((edge: any, index: number) => {
        return {
          id: `e${index + 1}`,
          source: edge.source,
          target: edge.target,
          type: "smoothstep",
          animated: true
        };
      });
      
      console.log(`Generated mindmap with ${mindmapData.nodes.length} nodes and ${mindmapData.edges.length} edges`);
      return NextResponse.json({ result: mindmapData });
      
    } catch (e) {
      console.error("Failed to process mindmap data:", e);
      
      // Provide fallback data for a better user experience
      const fallbackData = {
        nodes: [
          {
            id: '1',
            data: { 
              label: topic || 'Main Topic',
              description: 'This is a fallback mindmap. The AI was unable to generate a proper response for your topic. Try a different topic or try again later.',
              resources: [
                {
                  title: 'Wikipedia',
                  description: 'Wikipedia may have information about this topic.',
                  url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topic || 'Main_Topic')}`
                }
              ]
            },
            position: { x: 400, y: 300 }
          },
          {
            id: '2',
            data: { 
              label: 'Try another topic',
              description: 'If this topic is not working, try a more specific or common topic like "JavaScript", "Machine Learning", or "Digital Marketing".',
              resources: []
            },
            position: { x: 600, y: 400 }
          }
        ],
        edges: [
          { id: 'e1', source: '1', target: '2', type: 'smoothstep', animated: true }
        ]
      };
      
      return NextResponse.json({
        result: fallbackData,
        error: "Could not create mindmap for this topic. Try another topic."
      });
    }
  } catch (error) {
    console.error("General error in mindmap generation:", error);
    return NextResponse.json(
      { error: "Failed to process your request. Please try again later." },
      { status: 500 }
    );
  }
} 