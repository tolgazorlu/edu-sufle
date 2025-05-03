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
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: mindmapGeneratorPrompt }] }],
      // config: {
      //   temperature: 0.2,
      //   topP: 0.8,
      //   topK: 40,
      //   maxOutputTokens: 2048,
      // },
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
    
    // Try to extract JSON object from the response, handling different formats
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
        console.log("No clear JSON object found, using full response");
        jsonContent = responseText;
      }
    }
    
    // Log if the content might be truncated
    if (jsonContent.trim().endsWith(",") || 
        jsonContent.trim().endsWith("[") || 
        jsonContent.trim().endsWith("{")) {
      console.warn("Warning: JSON content may be truncated");
    }
    
    let mindmapData;
    try {
      // First attempt: try to parse the JSON as is
      try {
        mindmapData = JSON.parse(jsonContent);
        console.log("Successfully parsed JSON");
      } catch (parseError: any) {
        // If parsing fails, attempt to fix common JSON issues
        console.warn("Initial JSON parsing failed:", parseError.message);
        console.log("Attempting to fix malformed JSON...");
        
        // Fix 1: Try to complete truncated JSON by adding missing closing brackets
        let fixedJson = jsonContent;
        
        // Count opening and closing brackets
        const openBraces = (jsonContent.match(/\{/g) || []).length;
        const closeBraces = (jsonContent.match(/\}/g) || []).length;
        const openBrackets = (jsonContent.match(/\[/g) || []).length;
        const closeBrackets = (jsonContent.match(/\]/g) || []).length;
        
        console.log(`Bracket counts - { : ${openBraces}, } : ${closeBraces}, [ : ${openBrackets}, ] : ${closeBrackets}`);
        
        // Add missing closing brackets if needed
        if (openBraces > closeBraces) {
          const missingBraces = openBraces - closeBraces;
          console.log(`Adding ${missingBraces} missing closing braces }`);
          fixedJson = fixedJson + "}".repeat(missingBraces);
        }
        
        if (openBrackets > closeBrackets) {
          const missingBrackets = openBrackets - closeBrackets;
          console.log(`Adding ${missingBrackets} missing closing brackets ]`);
          fixedJson = fixedJson + "]".repeat(missingBrackets);
        }
        
        // Fix 2: Fix trailing commas in arrays and objects
        fixedJson = fixedJson
          .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
          .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
          
        // Fix 3: Try to identify and fix malformed array elements
        // This is a more aggressive fix attempt for position-specific errors
        try {
          JSON.parse(fixedJson);
        } catch (positionError: any) {
          // Extract position from error message if available
          const posMatch = positionError.message.match(/position (\d+)/);
          const lineMatch = positionError.message.match(/line (\d+) column (\d+)/);
          
          // Special handling for the common error at line 178 near position 9004
          if (lineMatch && parseInt(lineMatch[1]) === 178) {
            console.log("Detected specific error pattern at line 178 (common error location)");
            
            // Log error position details if available from the position match
            if (posMatch && posMatch[1]) {
              const errorPos = parseInt(posMatch[1]);
              console.log(`JSON error at position ${errorPos}, attempting targeted fix`);
              console.log(`Character at error position: "${fixedJson.charAt(errorPos)}", char code: ${fixedJson.charCodeAt(errorPos)}`);
              console.log(`Characters before: "${fixedJson.substring(errorPos-10, errorPos)}"`);
              console.log(`Characters after: "${fixedJson.substring(errorPos, errorPos+10)}"`);
            }
            
            // Let's try to find the resources array that's likely causing the issue
            const resourcesRegex = /"resources"\s*:\s*\[([\s\S]*?)\]/g;
            let resourceMatches;
            let lastResourceMatch = null;
            
            // Find the last resources array before the error position
            while ((resourceMatches = resourcesRegex.exec(fixedJson)) !== null) {
              if (resourcesRegex.lastIndex < 9004) {
                lastResourceMatch = resourceMatches;
              } else {
                break;
              }
            }
            
            if (lastResourceMatch) {
              console.log("Found resources array near error position");
              const resourcesContent = lastResourceMatch[1];
              
              // Check if there's a missing comma or other issue in the array
              if (resourcesContent.includes('}{') || resourcesContent.includes('""')) {
                console.log("Found missing comma in resources array");
                const fixedResources = resourcesContent.replace(/}(\s*){/g, '},\n$1{').replace(/"(\s*)"/g, '",\n$1"');
                
                // Replace the problematic resources array with the fixed one
                const startIdx = lastResourceMatch.index + lastResourceMatch[0].indexOf('[') + 1;
                const endIdx = lastResourceMatch.index + lastResourceMatch[0].length - 1;
                
                fixedJson = 
                  fixedJson.substring(0, startIdx) + 
                  fixedResources + 
                  fixedJson.substring(endIdx);
                  
                console.log("Fixed resources array");
              }
            }
          } else if (posMatch && posMatch[1]) {
            const errorPos = parseInt(posMatch[1]);
            console.log(`JSON error at position ${errorPos}, attempting targeted fix`);
            console.log(`Character at error position: "${fixedJson.charAt(errorPos)}", char code: ${fixedJson.charCodeAt(errorPos)}`);
            console.log(`Characters before: "${fixedJson.substring(errorPos-10, errorPos)}"`);
            console.log(`Characters after: "${fixedJson.substring(errorPos, errorPos+10)}"`);
            
            // Look at the content around the error position
            const contextStart = Math.max(0, errorPos - 50);
            const contextEnd = Math.min(fixedJson.length, errorPos + 50);
            const errorContext = fixedJson.substring(contextStart, contextEnd);
            console.log(`Context around error: "${errorContext}"`);
            
            // Common error patterns and fixes
            // 1. Missing commas between array elements or object properties
            if (errorContext.includes('""') || 
                errorContext.match(/\}\s*\{/) || 
                errorContext.match(/"\s*"/)) {
              console.log("Possible missing comma detected");
              const before = fixedJson.substring(0, errorPos);
              const after = fixedJson.substring(errorPos);
              fixedJson = before + "," + after;
            }
            
            // 2. Unescaped quotes in strings
            else if (errorContext.match(/([^\\]")([^,\}])/)) {
              console.log("Possible unescaped quote detected");
              fixedJson = fixedJson.replace(/([^\\]")([^,\}])/, '$1,$2');
            }
            
            // 3. Extra/stray commas before closing brackets/braces
            else if (errorContext.match(/,\s*[\]\}]/)) {
              console.log("Extra comma before closing bracket/brace");
              fixedJson = fixedJson.replace(/,(\s*[\]\}])/g, '$1');
            }
            
            // 4. Missing quotes around property names
            else if (errorContext.match(/\{[^"']*?([a-zA-Z0-9_]+):/)) {
              console.log("Missing quotes around property name");
              fixedJson = fixedJson.replace(/\{([^"']*?)([a-zA-Z0-9_]+):/g, '{$1"$2":');
            }
            
            // 5. General approach: try removing characters at error position
            else {
              console.log("Attempting to fix by removing problematic character");
              fixedJson = fixedJson.substring(0, errorPos) + fixedJson.substring(errorPos + 1);
            }
          }
        }
        
        // Fix 4: Convert JavaScript syntax to JSON syntax if needed
        // Fix undefined values (not valid in JSON)
        fixedJson = fixedJson.replace(/:\s*undefined\s*([,\}])/g, ':null$1');
        
        // Fix single quotes to double quotes for properties and string values
        let inString = false;
        let fixedChars = fixedJson.split('');
        for (let i = 0; i < fixedChars.length; i++) {
          if (fixedChars[i] === '"') {
            // Check if this quote is escaped
            if (i > 0 && fixedChars[i-1] === '\\') {
              // This is an escaped quote, don't toggle inString
              continue;
            }
            inString = !inString;
          } else if (fixedChars[i] === "'" && !inString) {
            // Convert single quotes to double quotes, but only outside of string literals
            fixedChars[i] = '"';
          }
        }
        fixedJson = fixedChars.join('');
        
        // Log the changes made
        if (fixedJson !== jsonContent) {
          console.log("JSON was modified during repair");
        }
        
        // Try parsing the fixed JSON
        try {
          mindmapData = JSON.parse(fixedJson);
          console.log("Successfully parsed fixed JSON");
        } catch (fixError: any) {
          // If still fails, try one last desperate measure - manual extraction
          console.error("Failed to fix JSON:", fixError.message);
          
          try {
            console.log("Attempting last-resort extraction of nodes and edges");
            
            // Try to extract nodes array
            const nodesMatch = fixedJson.match(/"nodes"\s*:\s*(\[[\s\S]*?\])(?=\s*,\s*"edges"|\s*\})/);
            const edgesMatch = fixedJson.match(/"edges"\s*:\s*(\[[\s\S]*?\])(?=\s*\})/);
            
            if (nodesMatch && edgesMatch) {
              console.log("Extracted nodes and edges arrays directly");
              
              // Construct a new JSON object with extracted arrays
              const manualJson = `{
                "nodes": ${nodesMatch[1]},
                "edges": ${edgesMatch[1]}
              }`;
              
              mindmapData = JSON.parse(manualJson);
              console.log("Successfully parsed manually extracted JSON");
            } else {
              throw new Error("Could not extract nodes and edges arrays");
            }
          } catch (extractError) {
            console.error("Last-resort extraction failed:", extractError);
            throw parseError;
          }
        }
      }
      
      // Validate that the response has the expected structure
      if (!mindmapData.nodes || !Array.isArray(mindmapData.nodes) || 
          !mindmapData.edges || !Array.isArray(mindmapData.edges)) {
        console.error("Invalid mindmap data structure", safeStringify(mindmapData));
        return NextResponse.json(
          { error: "AI response had invalid structure" },
          { status: 500 }
        );
      }
      
      // If API didn't generate enough edges, create default connections from node 1 to all others
      if (mindmapData.edges.length < mindmapData.nodes.length - 1) {
        console.log("Not enough edges detected, adding default connections");
        console.log("Original edges:", safeStringify(mindmapData.edges));
        
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
      console.log("Final edges structure:", safeStringify(mindmapData.edges));
      
      return NextResponse.json({ result: mindmapData });
      
    } catch (e) {
      console.error("Error processing JSON from Gemini response:", e);
      console.error("Problematic content first 500 chars:", jsonContent.substring(0, 500));
      console.error("Problematic content last 500 chars:", jsonContent.substring(Math.max(0, jsonContent.length - 500)));
      
      // Return fallback data in case of parsing error
      const fallbackData = {
        nodes: [
          {
            id: '1',
            data: { 
              label: 'React Native',
              description: 'React Native is a popular JavaScript framework that allows you to build native mobile applications for iOS and Android using a single codebase. It was developed by Facebook and uses React architecture, allowing developers to use their web development skills to create truly native mobile apps. React Native combines the best parts of native development with React, employing a vast ecosystem of libraries and tools.',
              resources: [
                {
                  title: 'React Native Official Documentation',
                  description: 'The official React Native documentation providing comprehensive guides, API references, and tutorials.',
                  url: 'https://reactnative.dev/docs/getting-started'
                },
                {
                  title: 'React Native GitHub Repository',
                  description: 'The official GitHub repository for React Native, containing source code and development resources.',
                  url: 'https://github.com/facebook/react-native'
                },
                {
                  title: 'React Native Course by The Net Ninja',
                  description: 'A comprehensive YouTube course covering React Native fundamentals and project building.',
                  url: 'https://www.youtube.com/playlist?list=PL4cUxeGkcC9ixPU-QkScoRBVxtPPzVjrQ'
                }
              ]
            },
            position: { x: 400, y: 100 }
          },
          {
            id: '2',
            data: { 
              label: 'JavaScript & React Fundamentals',
              description: 'Before diving into React Native, you need a solid understanding of JavaScript and React. This includes modern ES6+ syntax, functional programming concepts, and React core principles like components, props, state, and hooks. Having these fundamentals will make your React Native journey much smoother as the framework is built on these technologies.',
              resources: [
                {
                  title: 'Modern JavaScript for React Native',
                  description: 'A guide focusing on JavaScript concepts essential for React and React Native development.',
                  url: 'https://www.robinwieruch.de/javascript-fundamentals-react-requirements/'
                },
                {
                  title: 'React Documentation',
                  description: 'The official React documentation covering core concepts that transfer to React Native.',
                  url: 'https://react.dev/learn'
                },
                {
                  title: 'React Hooks Explained',
                  description: 'Comprehensive tutorial on React Hooks which are essential for modern React Native development.',
                  url: 'https://dmitripavlutin.com/react-hooks-tutorial/'
                }
              ]
            },
            position: { x: 200, y: 200 }
          },
          {
            id: '3',
            data: { 
              label: 'Setting Up Development Environment',
              description: 'Setting up the React Native development environment involves installing Node.js, a package manager (npm/yarn), React Native CLI or Expo CLI, and platform-specific tools like Android Studio or Xcode. Expo provides a faster setup with managed workflow, while React Native CLI offers more control and native module integration. Choosing the right setup is crucial for your development experience.',
              resources: [
                {
                  title: 'React Native Environment Setup Guide',
                  description: 'Official guide for setting up your development environment for React Native.',
                  url: 'https://reactnative.dev/docs/environment-setup'
                },
                {
                  title: 'Expo vs React Native CLI',
                  description: 'A comparison between Expo and React Native CLI to help you choose the right approach.',
                  url: 'https://docs.expo.dev/introduction/expo-or-react-native/'
                },
                {
                  title: 'Setting Up React Native with TypeScript',
                  description: 'Guide for setting up a React Native project with TypeScript for type safety.',
                  url: 'https://reactnative.dev/docs/typescript'
                }
              ]
            },
            position: { x: 600, y: 200 }
          },
          {
            id: '4',
            data: { 
              label: 'Core Components & APIs',
              description: 'React Native provides a set of essential built-in components that map to native UI elements like View, Text, Image, ScrollView, and TextInput. Additionally, it offers APIs for accessing device functionalities such as camera, geolocation, and storage. Understanding these core components and APIs is fundamental to building mobile apps with React Native.',
              resources: [
                {
                  title: 'React Native Core Components and APIs',
                  description: 'Official documentation on the essential building blocks of React Native apps.',
                  url: 'https://reactnative.dev/docs/components-and-apis'
                },
                {
                  title: 'React Native Elements',
                  description: 'A cross-platform UI toolkit that provides reusable components for React Native.',
                  url: 'https://reactnativeelements.com/docs'
                },
                {
                  title: 'React Native Practical Guide',
                  description: 'A hands-on course teaching how to use React Native components effectively.',
                  url: 'https://www.udemy.com/course/react-native-the-practical-guide/'
                }
              ]
            },
            position: { x: 400, y: 300 }
          },
          {
            id: '5',
            data: { 
              label: 'Navigation',
              description: 'Navigation is essential in mobile apps, allowing users to move between different screens. React Navigation is the most popular library for handling navigation in React Native apps, offering stack, tab, drawer, and nested navigators. Understanding how to structure your app\'s navigation flow is crucial for creating intuitive user experiences.',
              resources: [
                {
                  title: 'React Navigation Documentation',
                  description: 'The official documentation for React Navigation, the standard navigation library for React Native.',
                  url: 'https://reactnavigation.org/docs/getting-started'
                },
                {
                  title: 'Navigation Patterns in React Native',
                  description: 'A guide to implementing different navigation patterns in React Native apps.',
                  url: 'https://blog.logrocket.com/react-native-navigation-tutorial/'
                },
                {
                  title: 'Deep Linking in React Navigation',
                  description: 'How to implement deep linking to allow users to navigate directly to specific parts of your app.',
                  url: 'https://reactnavigation.org/docs/deep-linking'
                }
              ]
            },
            position: { x: 200, y: 400 }
          },
          {
            id: '6',
            data: { 
              label: 'State Management',
              description: 'Managing state in React Native applications is crucial for handling data flow. While React\'s built-in state and Context API can handle simple cases, larger apps often use libraries like Redux, MobX, or Recoil. Choosing the right state management approach depends on your app\'s complexity, team preferences, and performance requirements.',
              resources: [
                {
                  title: 'Redux Toolkit with React Native',
                  description: 'Official guide on using Redux Toolkit for state management in React Native apps.',
                  url: 'https://redux-toolkit.js.org/tutorials/quick-start'
                },
                {
                  title: 'React Query for Data Fetching',
                  description: 'Documentation for TanStack Query (React Query), a powerful data fetching library.',
                  url: 'https://tanstack.com/query/latest/docs/react/overview'
                },
                {
                  title: 'Zustand - Simple State Management',
                  description: 'A lightweight state management solution for React and React Native.',
                  url: 'https://github.com/pmndrs/zustand'
                }
              ]
            },
            position: { x: 600, y: 400 }
          },
          {
            id: '7',
            data: { 
              label: 'Styling & UI Libraries',
              description: 'Styling in React Native uses a subset of CSS with a JavaScript object-based syntax. You can create styles using StyleSheet.create() or use styled-components/emotion for a CSS-like experience. For consistent UI design, libraries like React Native Paper, Native Base, or UI Kitten provide pre-built components following design systems. These tools help create polished interfaces faster.',
              resources: [
                {
                  title: 'Styling in React Native',
                  description: 'Official guide on styling approaches in React Native applications.',
                  url: 'https://reactnative.dev/docs/style'
                },
                {
                  title: 'React Native Paper',
                  description: 'A Material Design implementation for React Native with ready-to-use components.',
                  url: 'https://callstack.github.io/react-native-paper/'
                },
                {
                  title: 'Styled Components for React Native',
                  description: 'Documentation on using styled-components to create component-scoped styles in React Native.',
                  url: 'https://styled-components.com/docs/basics#react-native'
                }
              ]
            },
            position: { x: 400, y: 500 }
          },
          {
            id: '8',
            data: { 
              label: 'Networking & API Integration',
              description: 'Most React Native apps need to communicate with external APIs to fetch or send data. You can use the built-in fetch API or libraries like Axios for HTTP requests. Understanding how to handle API responses, error management, and implementing features like caching, offline support, and real-time updates is essential for creating robust mobile applications.',
              resources: [
                {
                  title: 'Networking in React Native',
                  description: 'Official guide on making network requests in React Native applications.',
                  url: 'https://reactnative.dev/docs/network'
                },
                {
                  title: 'Axios Documentation',
                  description: 'Documentation for Axios, a popular HTTP client for making API requests.',
                  url: 'https://axios-http.com/docs/intro'
                },
                {
                  title: 'GraphQL with Apollo Client',
                  description: 'Guide on integrating GraphQL APIs in React Native using Apollo Client.',
                  url: 'https://www.apollographql.com/docs/react/'
                }
              ]
            },
            position: { x: 200, y: 600 }
          },
          {
            id: '9',
            data: { 
              label: 'Testing & Debugging',
              description: 'Testing and debugging are critical for building reliable React Native applications. Jest is commonly used for unit and integration testing, while Detox or Appium handle end-to-end testing. For debugging, React Native offers developer tools like Flipper, React DevTools, and debugging within Chrome. Implementing proper testing strategies improves code quality and reduces bugs.',
              resources: [
                {
                  title: 'Testing React Native Apps',
                  description: 'Official guide on testing strategies for React Native applications.',
                  url: 'https://reactnative.dev/docs/testing-overview'
                },
                {
                  title: 'Debugging React Native',
                  description: 'Comprehensive guide on debugging techniques for React Native.',
                  url: 'https://reactnative.dev/docs/debugging'
                },
                {
                  title: 'Detox for E2E Testing',
                  description: 'Documentation for Detox, a gray box end-to-end testing framework for mobile apps.',
                  url: 'https://wix.github.io/Detox/'
                }
              ]
            },
            position: { x: 600, y: 600 }
          }
        ],
        edges: [
          { id: 'e1', source: '1', target: '2', type: 'straight' },
          { id: 'e2', source: '1', target: '3', type: 'straight' },
          { id: 'e3', source: '1', target: '4', type: 'straight' },
          { id: 'e4', source: '1', target: '5', type: 'straight' },
          { id: 'e5', source: '1', target: '6', type: 'straight' },
          { id: 'e6', source: '2', target: '3', type: 'straight' },
          { id: 'e7', source: '2', target: '4', type: 'straight' },
          { id: 'e8', source: '3', target: '4', type: 'straight' },
          { id: 'e9', source: '3', target: '6', type: 'straight' },
          { id: 'e10', source: '4', target: '6', type: 'straight' },
          { id: 'e11', source: '5', target: '6', type: 'straight' }
        ]
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