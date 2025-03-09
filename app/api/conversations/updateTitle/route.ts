import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb-client";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    // Get the current session
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the request body
    const { conversationId, title } = await request.json();
    
    if (!conversationId || !title) {
      return NextResponse.json(
        { error: "Conversation ID and title are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();

    // Validate the conversation ID format
    let objectId;
    try {
      objectId = new ObjectId(conversationId);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid conversation ID format" },
        { status: 400 }
      );
    }
    
    // Check if the conversation exists
    const conversation = await db.collection("conversations").findOne({ _id: objectId });
    
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
    
    // Verify the user owns this conversation
    const user = await db.collection("users").findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    const userId = user._id.toString();
    
    if (conversation.userId !== userId && conversation.userId !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to update this conversation" },
        { status: 403 }
      );
    }
    
    // Update just the title
    const updateResult = await db.collection("conversations").updateOne(
      { _id: objectId },
      { $set: { title: title, updatedAt: new Date() } }
    );
    
    if (updateResult.modifiedCount !== 1) {
      return NextResponse.json(
        { error: "Failed to update conversation title" },
        { status: 500 }
      );
    }
    
    // Return the updated conversation
    const updatedConversation = await db.collection("conversations").findOne({ _id: objectId });
    
    return NextResponse.json(updatedConversation);
    
  } catch (error) {
    console.error("Error updating conversation title:", error);
    return NextResponse.json(
      { error: `Failed to update title: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}