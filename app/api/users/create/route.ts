import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb-client";

export async function POST() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email: session.user.email });

    if (existingUser) {
      // User already exists, return their ID
      return NextResponse.json({
        _id: existingUser._id.toString(),
        email: existingUser.email,
        name: existingUser.name,
        message: "User already exists"
      });
    }

    // Create new user
    const newUser = {
      email: session.user.email,
      name: session.user.name || "User",
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: {
        level: 1,
        xp: 0,
        points: 0,
        nextLevelXp: 1000
      },
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
      }
    };

    const result = await db.collection("users").insertOne(newUser);

    return NextResponse.json({
      _id: result.insertedId.toString(),
      email: session.user.email,
      name: session.user.name,
      message: "User created successfully"
    });

  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}