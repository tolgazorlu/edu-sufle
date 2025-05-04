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
    
    // Prompt to generate todo concepts with resources similar to mindmap
    const todoGeneratorPrompt = `
      Generate a learning path todo list for the topic: "${topic}"

      Create a structured list of concepts that someone should learn to master this topic.
      
      The response MUST BE VALID JSON without any additional text or explanation and follow this exact structure:
      {
        "concepts": [
          {
            "id": "1",
            "title": "Main Concept",
            "description": "A comprehensive and detailed explanation of this concept covering key points, importance, and fundamental ideas. This should be 3-5 sentences that thoroughly explain the concept and its significance in the learning path.",
            "completed": false,
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
          {
            "id": "2",
            "title": "Secondary Concept",
            "description": "Detailed explanation of this concept, its relationship to the main topic, and why it's important to understand. This description should provide clear context about the concept and how it fits into the broader learning path.",
            "completed": false,
            "resources": [
              {
                "title": "Resource Title 3",
                "description": "Short description of the educational resource (1-2 sentences)",
                "url": "https://example.com/resource3"
              }
            ]
          }
        ]
      }

      Guidelines:
      - Create 5-8 concepts with logical learning progression
      - Use sequential numbers for concept IDs (1, 2, 3, etc.)
      - Arrange concepts in order of learning progression (fundamental concepts first)
      - EACH concept MUST have a detailed "description" field (3-5 sentences) that explains the concept thoroughly
      - For EACH concept, provide 2-4 REAL, EXISTING resources with valid URLs
      - Resources should be high-quality educational materials like:
          - Official documentation and guides
          - Tutorial articles and blog posts from respected sources
          - Video tutorials and courses from platforms like YouTube, Coursera, Udemy
          - GitHub repositories with example code or projects
          - Books, papers, or research articles when relevant
      - URLs must be real, accessible, and directly relevant to the concept's topic
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

    console.log("Sending request to Gemini API for todo topic:", topic);
    
    // Set a controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout
    
    // Prepare fallback data for timeouts or errors
    const generateFallbackData = () => {
      return {
        concepts: [
          {
            id: '1',
            title: topic || 'Main Concept',
            description: 'This is a simplified todo list. The AI response took too long or encountered an error.',
            completed: false,
            resources: [
              {
                title: 'Wikipedia',
                description: 'Learn more about this topic on Wikipedia',
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topic || 'Main_Topic')}`
              },
              {
                title: 'YouTube Tutorials',
                description: 'Watch videos about this topic',
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic || 'learning')}`
              }
            ]
          },
          {
            id: '2',
            title: 'Try a simpler topic',
            description: 'Try a more specific topic or a shorter query for better results.',
            completed: false,
            resources: []
          }
        ]
      };
    };
    
    try {
      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [{ role: "user", parts: [{ text: todoGeneratorPrompt }] }],
        });
        clearTimeout(timeoutId); // Clear the timeout if successful
      } catch (error: unknown) {
        clearTimeout(timeoutId);
        console.error("Error calling Gemini API:", error);
        
        // Safely cast to Error type for property access
        const apiError = error as { name?: string; message?: string };
        
        // Check if it's a timeout or abort error
        if (apiError.name === 'AbortError' || apiError.message?.includes('timeout')) {
          console.log("Request timed out, providing fallback data");
          return NextResponse.json({
            result: generateFallbackData(),
            error: "The request took too long. Displaying a simplified todo list instead."
          });
        }
        
        return NextResponse.json(
          { error: "Failed to communicate with the AI model. Please try again later." },
          { status: 500 }
        );
      }

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
      let todoData;
      try {
        // First attempt: parse as-is
        try {
          todoData = JSON.parse(jsonContent);
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
            todoData = JSON.parse(fixedJson);
            console.log("Successfully parsed fixed JSON");
          } catch (fixError) {
            // If still can't parse, throw to fallback handler
            throw new Error("Could not parse JSON after fixes");
          }
        }
        
        // Validate the parsed data has expected structure
        if (
          !todoData || 
          !todoData.concepts || 
          !Array.isArray(todoData.concepts)
        ) {
          throw new Error("Invalid todo data structure");
        }
        
        // Ensure all concepts have the required fields
        todoData.concepts = todoData.concepts.map((concept: any, index: number) => {
          return {
            id: concept.id || (index + 1).toString(),
            title: concept.title || `Concept ${index + 1}`,
            description: concept.description || "No description provided",
            completed: concept.completed === undefined ? false : concept.completed,
            resources: Array.isArray(concept.resources) ? concept.resources : []
          };
        });
        
        console.log(`Generated todo list with ${todoData.concepts.length} concepts`);
        return NextResponse.json({ result: todoData });
        
      } catch (e) {
        console.error("Failed to process todo data:", e);
        
        return NextResponse.json({
          result: generateFallbackData(),
          error: "Could not create todo list for this topic. Try another topic."
        });
      }
    } catch (error) {
      console.error("General error in todo generation:", error);
      return NextResponse.json(
        { error: "Failed to process your request. Please try again later." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("General error in todo generation:", error);
    return NextResponse.json(
      { error: "Failed to process your request. Please try again later." },
      { status: 500 }
    );
  }
} 