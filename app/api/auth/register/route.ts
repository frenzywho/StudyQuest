import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import clientPromise from "@/lib/mongodb-client";

export async function POST(request: Request) {
  try {
    const { name, email, password, level = 1, xp = 0, points = 0, avatarUrl = "/avatar-placeholder.png" } = await request.json();

    // Validate request data
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const result = await usersCollection.insertOne({
      name,
      email,
      password: hashedPassword,
      level,
      xp,
      points,
      avatarUrl,
      created: new Date(),
      updated: new Date(),
    });

    // Return success response (without password)
    return NextResponse.json({
      id: result.insertedId,
      name,
      email,
      level,
      xp,
      points,
      avatarUrl,
    }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Failed to create user account" },
      { status: 500 }
    );
  }
}