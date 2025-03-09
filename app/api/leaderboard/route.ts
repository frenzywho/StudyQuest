import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb-client";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get users sorted by XP in descending order
    const users = await db.collection("users")
      .find({})
      .project({
        name: 1,
        email: 1,
        xp: 1,
        level: 1,
        avatarUrl: 1,
        createdAt: 1
      })
      .sort({ xp: -1, level: -1 })
      .limit(100) // Limit to prevent too many results
      .toArray();
    
    // Format the users for the leaderboard
    const leaderboardData = users.map((user, index) => ({
      rank: index + 1,
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      level: user.level || 1,
      xp: user.xp || 0,
      avatarUrl: user.avatarUrl || "/avatar-placeholder.png",
      joinedDate: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString()
    }));
    
    return NextResponse.json(leaderboardData);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 }
    );
  }
}