import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb-client";
import { authOptions } from "../../auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    let userId;
    try {
      userId = new ObjectId(session.user.id);
    } catch (e) {
      // If ID is not a valid ObjectId (e.g., demo user)
      userId = session.user.id;
    }
    
    // Find user and get their rank
    let user;
    
    if (typeof userId === 'string') {
      // Handle demo user
      user = {
        _id: userId,
        name: session.user.name,
        email: session.user.email,
        xp: session.user.xp || 0,
        level: session.user.level || 1,
        points: session.user.points || 0,
        avatarUrl: session.user.image || "/avatar-placeholder.png",
      };
    } else {
      // For normal users, get from database
      user = await db.collection("users").findOne({ _id: userId });
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Count users with higher XP to determine rank
    const higherXpCount = await db.collection("users").countDocuments({
      xp: { $gt: user.xp || 0 }
    });
    
    // Get total user count for percentile calculation
    const totalUsers = await db.collection("users").countDocuments();
    
    const userProfile = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      level: user.level || 1,
      xp: user.xp || 0,
      points: user.points || 0,
      avatarUrl: user.avatarUrl || "/avatar-placeholder.png",
      rank: higherXpCount + 1,
      percentile: totalUsers > 0 ? Math.round(((totalUsers - higherXpCount) / totalUsers) * 100) : 100,
      nextLevelXp: (user.level || 1) * 1000, // Simple calculation, adjust as needed
    };
    
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

// Also allow updating the profile
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { xp, level, points } = await request.json();
    
    const client = await clientPromise;
    const db = client.db();
    
    // Only allow updating these specific fields
    const updateData: Record<string, any> = {};
    if (xp !== undefined) updateData.xp = xp;
    if (level !== undefined) updateData.level = level;
    if (points !== undefined) updateData.points = points;
    
    // Don't proceed with empty update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }
    
    let userId;
    try {
      userId = new ObjectId(session.user.id);
    } catch (e) {
      // If ID is not a valid ObjectId (e.g., demo user)
      // For demo users, don't actually update the database
      if (session.user.email === "demo@example.com") {
        return NextResponse.json({
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          level: level !== undefined ? level : session.user.level,
          xp: xp !== undefined ? xp : session.user.xp,
          points: points !== undefined ? points : session.user.points,
          avatarUrl: session.user.image || "/avatar-placeholder.png",
        });
      } else {
        return NextResponse.json(
          { error: "Invalid user ID" },
          { status: 400 }
        );
      }
    }
    
    // Update the user
    const result = await db.collection("users").findOneAndUpdate(
      { _id: userId },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    if (!result || !result.value) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Return updated user data (excluding sensitive fields)
    const { password, ...userData } = result.value;
    
    return NextResponse.json({
      id: userData._id.toString(),
      name: userData.name,
      email: userData.email,
      level: userData.level || 1,
      xp: userData.xp || 0,
      points: userData.points || 0,
      avatarUrl: userData.avatarUrl || "/avatar-placeholder.png",
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}