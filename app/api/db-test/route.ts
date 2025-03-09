import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb-client";

export async function GET() {
  try {
    const client = await clientPromise;
    // Attempt to fetch server info to confirm connection
    const admin = client.db().admin();
    const result = await admin.serverInfo();
    
    return NextResponse.json({
      connected: true,
      version: result.version,
      message: "Successfully connected to MongoDB!"
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Failed to connect to MongoDB"
    }, { status: 500 });
  }
}