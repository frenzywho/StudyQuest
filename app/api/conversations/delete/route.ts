import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb-client";
import { ObjectId } from "mongodb";

// For DELETE requests
export async function DELETE(request: Request) {
  try {
    // Get the current session
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      console.log("No authenticated user");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error("Error parsing request body:", e);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    
    const { conversationId } = body;
    
    if (!conversationId) {
      console.log("No conversation ID provided");
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }
    
    console.log(`Deleting conversation: ${conversationId}`);

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    
    // Validate the MongoDB ObjectId format
    let objectId;
    try {
      objectId = new ObjectId(conversationId);
    } catch (e) {
      console.error("Invalid conversation ID format:", conversationId);
      return NextResponse.json(
        { error: "Invalid conversation ID format" },
        { status: 400 }
      );
    }
    
    // Find the conversation first to verify ownership
    const conversation = await db.collection("conversations").findOne({ _id: objectId });
    
    if (!conversation) {
      console.log("Conversation not found");
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
    
    // Delete the conversation
    const deleteResult = await db.collection("conversations").deleteOne({ _id: objectId });
    
    if (deleteResult.deletedCount !== 1) {
      console.log("Failed to delete conversation");
      return NextResponse.json(
        { error: "Failed to delete conversation" },
        { status: 500 }
      );
    }
    
    console.log(`Conversation deleted: ${conversationId}`);
    
    // Return success
    return NextResponse.json({ success: true, message: "Conversation deleted successfully" });
    
  } catch (error) {
    console.error("Unhandled error in conversation deletion:", error);
    return NextResponse.json(
      { error: `Failed to delete conversation: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

// For browsers or clients that don't support DELETE method
export async function POST(request: Request) {
  // Just call the DELETE handler
  return DELETE(request);
}