import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy API route for making requests to Google's AI services
 * This prevents exposing the API key directly in client-side code
 */
export async function POST(request: NextRequest) {
  try {
    // Get data from the request
    const requestData = await request.json();
    
    // Get the Google API key from environment variable or server storage
    // For demo, we're using a mock method, but in production you'd want to
    // securely retrieve this from a database or environment variables
    const apiKey = process.env.GOOGLE_API_KEY || await getApiKeyFromStorage(requestData.userId);
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google API key not found. Please set it in your settings." },
        { status: 400 }
      );
    }
    
    // Forward the request to Google's API with the key
    // Updated to use the current stable API endpoint
    const endpoint = requestData.endpoint || "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(requestData.payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Google API request failed: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error("Error proxying request to Google API:", error);
    return NextResponse.json(
      { error: "Failed to process request", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get API key from storage
 * In a real application, this would fetch from a secure database
 */
async function getApiKeyFromStorage(userId: string): Promise<string | null> {
  // This is a mock implementation
  // In production, this would query a database
  
  // For demo purposes, we're using the in-memory storage from the settings API
  try {
    // Simple approach to access the same in-memory storage
    // In a real app, this would be a database query
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/settings?userId=${userId}`, {
      headers: {
        // Add any internal auth headers if needed
        "x-internal-request": "true"
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.googleApiKey || null;
  } catch (error) {
    console.error("Error retrieving API key:", error);
    return null;
  }
} 