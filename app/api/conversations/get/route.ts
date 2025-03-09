import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb-client";

export async function GET(request: Request) {
  try {
    // Get the current session
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get userId from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Missing required parameter: userId" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();

    // Verify the user making the request
    const user = await db.collection("users").findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if the user ID in the query matches the session user ID
    if (user._id.toString() !== userId && user.id !== userId) {
      console.log("User ID mismatch:", user._id.toString(), user.id, userId);
      return NextResponse.json(
        { error: "Unauthorized - user ID mismatch" },
        { status: 403 }
      );
    }

    // Fetch the conversations
    const conversations = await db.collection("conversations")
      .find({ userId: userId })
      .sort({ updatedAt: -1 })
      .toArray();

    // Return the conversations
    return NextResponse.json(conversations);
    
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: `Failed to fetch conversations: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}