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
          { id: 'e6', source: '1', target: '7', type: 'straight' },
          { id: 'e7', source: '1', target: '8', type: 'straight' },
          { id: 'e8', source: '1', target: '9', type: 'straight' },
          { id: 'e9', source: '2', target: '4', type: 'straight' },
          { id: 'e10', source: '3', target: '4', type: 'straight' },
          { id: 'e11', source: '4', target: '5', type: 'straight' },
          { id: 'e12', source: '4', target: '6', type: 'straight' },
          { id: 'e13', source: '4', target: '7', type: 'straight' },
          { id: 'e14', source: '5', target: '8', type: 'straight' },
          { id: 'e15', source: '6', target: '8', type: 'straight' },
          { id: 'e16', source: '7', target: '9', type: 'straight' },
          { id: 'e17', source: '8', target: '9', type: 'straight' }
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