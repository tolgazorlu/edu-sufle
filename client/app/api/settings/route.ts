import { NextRequest, NextResponse } from "next/server";

// This would ideally be saved in a database for persistence and security
// For a more robust solution, consider using a real database
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

    const apiKey = apiKeys[userId] || null;

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

    // Remove the API key for this user
    if (userId in apiKeys) {
      delete apiKeys[userId];
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