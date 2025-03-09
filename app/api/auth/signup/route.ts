import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import clientPromise from "@/lib/mongodb-client";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    
    // Validate inputs
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }
    
    // Hash the password
    const hashedPassword = await hash(password, 10);
    
    // Create new user with initialized stats and progress
    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
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

    return NextResponse.json({
      message: "User created successfully",
      userId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
