import { NextRequest, NextResponse } from "next/server";

// This would ideally be saved in a database for persistence and security
// In-memory storage as fallback (will be lost on server restarts)
let apiKeys: Record<string, string> = {};

export async function POST(request: NextRequest) {
  try {
    const { googleApiKey, userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Save API key associated with the user
    apiKeys[userId] = googleApiKey;
    
    // Also save to environment variable in production as a fallback
    if (googleApiKey && process.env.NODE_ENV === 'production') {
      process.env.GOOGLE_API_KEY = googleApiKey;
    }

    return NextResponse.json(
      { message: "API key saved successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving API key:", error);
    return NextResponse.json(
      { error: "Failed to save API key" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Try to get from in-memory storage first
    let apiKey = apiKeys[userId] || null;
    
    // If not found in memory and in production, try environment variable
    if (!apiKey && process.env.NODE_ENV === 'production') {
      apiKey = process.env.GOOGLE_API_KEY || null;
    }

    return NextResponse.json(
      { googleApiKey: apiKey },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving API key:", error);
    return NextResponse.json(
      { error: "Failed to retrieve API key" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Remove from in-memory storage
    if (userId in apiKeys) {
      delete apiKeys[userId];
    }
    
    // Clear environment variable if it exists and in production
    if (process.env.GOOGLE_API_KEY && process.env.NODE_ENV === 'production') {
      delete process.env.GOOGLE_API_KEY;
    }

    return NextResponse.json(
      { message: "API key removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing API key:", error);
    return NextResponse.json(
      { error: "Failed to remove API key" },
      { status: 500 }
    );
  }
} 