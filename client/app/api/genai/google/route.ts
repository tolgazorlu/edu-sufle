import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy API route for making requests to Google's AI services
 * This prevents exposing the API key directly in client-side code
 */
export async function POST(request: NextRequest) {
  try {
    // Get data from the request
    const requestData = await request.json();
    
    // Get the Google API key from multiple possible sources
    const apiKey = await getApiKeyFromMultipleSources(requestData.userId);
    
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
      let errorDetails = errorText;
      
      // Try to parse the error for better debugging
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.error.message) {
          errorDetails = errorJson.error.message;
        }
      } catch (e) {
        // Use the original error text if parsing fails
      }
      
      return NextResponse.json(
        { 
          error: `Google API request failed: ${response.status} ${response.statusText}`, 
          details: errorDetails 
        },
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
 * Helper function to get API key from multiple potential sources
 * Prioritizes direct environment variables, then API calls to settings
 */
async function getApiKeyFromMultipleSources(userId: string): Promise<string | null> {
  // 1. First check if we have a direct environment variable
  if (process.env.GOOGLE_API_KEY) {
    return process.env.GOOGLE_API_KEY;
  }
  
  // 2. Attempt to fetch from the settings API (in-memory storage)
  try {
    // Use a relative URL that works in both development and production
    // This avoids the localhost issue completely
    const response = await fetch(`/api/settings?userId=${userId}`, {
      headers: {
        "x-internal-request": "true"
      }
    });
    
    if (!response.ok) {
      console.error("Settings API returned error:", response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data.googleApiKey || null;
  } catch (error) {
    console.error("Error retrieving API key from settings API:", error);
    return null;
  }
} 