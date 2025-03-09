import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb-client";
import { ObjectId } from "mongodb";

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

    // Get conversation ID from query parameters
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("id");
    
    if (!conversationId) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
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

    // Fetch the conversation
    try {
      const objectId = new ObjectId(conversationId);
      const conversation = await db.collection("conversations").findOne({ 
        _id: objectId
      });
      
      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
      
      // Verify conversation ownership (by user ID)
      if (conversation.userId !== user._id.toString() && conversation.userId !== user.id) {
        return NextResponse.json(
          { error: "Unauthorized - you do not have permission to view this conversation" },
          { status: 403 }
        );
      }
      
      // Return the conversation
      return NextResponse.json(conversation);
      
    } catch (error) {
      console.error("Error with ObjectId or finding conversation:", error);
      return NextResponse.json(
        { error: "Invalid conversation ID format or database error" },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: `Failed to fetch conversation: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}