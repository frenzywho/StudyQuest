import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb-client";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
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
    const reqBody = await request.json();
    const { userId, title, messages, conversationId } = reqBody;
    
    console.log("Save conversation request:", { 
      userId, 
      title: title?.substring(0, 20) + "...", 
      messagesCount: messages?.length,
      conversationId: conversationId || "new" 
    });
    
    if (!userId || !Array.isArray(messages) || messages.length === 0) {
      console.log("Invalid request data:", { userId, messages: Array.isArray(messages) });
      return NextResponse.json(
        { error: "Invalid request data - missing required fields" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    
    // Validate the user
    const user = await db.collection("users").findOne({ email: session.user.email });
    
    if (!user) {
      console.log("User not found, creating new user");
      
      // Create a new user record
      const newUser = {
        email: session.user.email,
        name: session.user.name || "User",
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
          quizzesCompleted: 0,
          quizzesCorrect: 0,
          totalQuizPoints: 0,
          tasksCompleted: 0,
          challengesCompleted: 0,
          streakDays: 0,
          totalTimeSpent: 0,
          lastActive: new Date(),
          badges: [],
          achievements: []
        },
        progress: {
          level: 1,
          xp: 0,
          points: 0,
          nextLevelXp: 1000
        }
      };
      
      await db.collection("users").insertOne(newUser);
    }

    let result;

    // Handle conversation update or creation
    if (conversationId) {
      try {
        // First check if the ID is a valid ObjectId
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
        
        // Check if the conversation exists
        const existingConv = await db.collection("conversations").findOne(
          { _id: objectId }
        );
        
        if (!existingConv) {
          console.log("Conversation not found:", conversationId);
          return NextResponse.json(
            { error: "Conversation not found" },
            { status: 404 }
          );
        }
        
        // Update the existing conversation
        await db.collection("conversations").updateOne(
          { _id: objectId },
          {
            $set: {
              title: title,
              messages: messages,
              updatedAt: new Date()
            }
          }
        );
        
        // Get the updated document
        result = await db.collection("conversations").findOne(
          { _id: objectId }
        );
        
        if (result) {
          console.log("Updated conversation:", result._id.toString());
        } else {
          console.error("Failed to retrieve updated conversation");
        }
      } catch (error) {
        console.error("Error updating conversation:", error);
        return NextResponse.json(
          { error: "Failed to update conversation" },
          { status: 500 }
        );
      }
    } else {
      // Create new conversation
      try {
        // Insert the new conversation
        const insertResult = await db.collection("conversations").insertOne({
          userId: userId,
          title: title,
          messages: messages,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        if (!insertResult.insertedId) {
          console.error("Failed to create conversation - no ID returned");
          return NextResponse.json(
            { error: "Failed to create conversation" },
            { status: 500 }
          );
        }
        
        // Get the newly created conversation document
        result = await db.collection("conversations").findOne(
          { _id: insertResult.insertedId }
        );
        
        if (result) {
          console.log("Created conversation:", result._id.toString());
        } else {
          console.error("Failed to retrieve created conversation");
        }
      } catch (error) {
        console.error("Error creating conversation:", error);
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500 }
        );
      }
    }

    // Return the result
    return NextResponse.json(result);
    
  } catch (error) {
    console.error("Unhandled error in conversation save:", error);
    return NextResponse.json(
      { error: `Failed to save conversation: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}