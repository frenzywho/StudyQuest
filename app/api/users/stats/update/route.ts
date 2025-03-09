import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb-client";

export async function PUT(request: Request) {
  try {
    // Get the session
    const session = await getServerSession();
    console.log("Session:", session?.user?.email || "No session user email");
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse update data
    let updateData;
    try {
      updateData = await request.json();
      console.log("Update data received:", updateData);
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db();

    // First, ensure the user exists with proper stat fields
    const existingUser = await db.collection("users").findOne({ email: session.user.email });
    
    console.log("Existing user:", existingUser ? "Found" : "Not found");

    // If user doesn't exist, create a new user record
    if (!existingUser) {
      try {
        const result = await db.collection("users").insertOne({
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
            achievements: [],
          },
          progress: {
            level: 1,
            xp: 0,
            points: 0,
            nextLevelXp: 1000,
          }
        });
        console.log("Created new user document with ID:", result.insertedId);
      } catch (error) {
        console.error("Failed to create user document:", error);
        return NextResponse.json(
          { error: "Failed to create user record" },
          { status: 500 }
        );
      }
    }

    // Ensure stats and progress objects exist with default values
    if (!existingUser?.stats) {
      await db.collection("users").updateOne(
        { email: session.user.email },
        {
          $set: {
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
              achievements: [],
            }
          }
        }
      );
    }

    if (!existingUser?.progress) {
      await db.collection("users").updateOne(
        { email: session.user.email },
        {
          $set: {
            progress: {
              level: 1,
              xp: 0,
              points: 0,
              nextLevelXp: 1000,
            }
          }
        }
      );
    }

    // Prepare the update operation - much simpler now
    const updateOperation: {
      $set: { updatedAt: Date; "stats.lastActive": Date };
      $inc?: { [key: string]: number };
    } = {
      $set: { 
        updatedAt: new Date(),
        "stats.lastActive": new Date()
      }
    };

    // Add increments
    if (updateData.tasksCompleted) {
      updateOperation.$inc = updateOperation.$inc || {};
      updateOperation.$inc["stats.tasksCompleted"] = updateData.tasksCompleted;
    }
    
    if (updateData.xp) {
      updateOperation.$inc = updateOperation.$inc || {};
      updateOperation.$inc["progress.xp"] = updateData.xp;
    }
    
    if (updateData.points) {
      updateOperation.$inc = updateOperation.$inc || {};
      updateOperation.$inc["progress.points"] = updateData.points;
    }

    console.log("Update operation:", JSON.stringify(updateOperation));

    // Much simpler update method
    await db.collection("users").updateOne(
      { email: session.user.email },
      updateOperation
    );

    // Now get the updated user document
    const updatedUser = await db.collection("users").findOne(
      { email: session.user.email }
    );

    if (!updatedUser) {
      console.error("User not found after update");
      return NextResponse.json(
        { error: "User not found after update" },
        { status: 404 }
      );
    }

    console.log("User successfully updated");

    // Check if user should level up
    const currentXP = updatedUser.progress?.xp || 0;
    const currentLevel = updatedUser.progress?.level || 1;
    const nextLevelXP = updatedUser.progress?.nextLevelXp || 1000;
    let didLevelUp = false;

    if (currentXP >= nextLevelXP) {
      console.log(`User leveling up: ${currentLevel} -> ${currentLevel + 1}`);
      const newLevel = currentLevel + 1;
      const newNextLevelXP = newLevel * 1000;
      
      await db.collection("users").updateOne(
        { email: session.user.email },
        {
          $set: {
            "progress.level": newLevel,
            "progress.nextLevelXp": newNextLevelXP
          }
        }
      );
      
      didLevelUp = true;
      
      // Get the final updated user after level up
      const finalUser = await db.collection("users").findOne({ email: session.user.email });
      
      if (!finalUser) {
        console.error("User not found after level up");
        return NextResponse.json({
          stats: updatedUser.stats,
          progress: {
            ...updatedUser.progress,
            level: newLevel,
            nextLevelXp: newNextLevelXP
          },
          levelUp: true
        });
      }
      
      return NextResponse.json({
        stats: finalUser.stats,
        progress: finalUser.progress,
        levelUp: true
      });
    }

    // Return the updated stats
    return NextResponse.json({
      stats: updatedUser.stats,
      progress: updatedUser.progress,
      levelUp: false
    });

  } catch (error) {
    console.error("Error in stats update:", error);
    return NextResponse.json(
      { error: `Failed to update stats: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}