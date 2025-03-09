import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb-client";
import { ObjectId } from "mongodb";
import { authOptions } from "@/pages/api/auth/nextauth";

// Get user stats
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
      // For demo user, return mock stats
      if (session.user.email === "demo@example.com") {
        return NextResponse.json({
          progress: {
            level: session.user.level || 1,
            xp: session.user.xp || 0,
            points: session.user.points || 0,
            nextLevelXp: (session.user.level || 1) * 1000,
          },
          stats: {
            quizzesCompleted: 5,
            quizzesCorrect: 42,
            totalQuizPoints: 380,
            tasksCompleted: 12,
            challengesCompleted: 3,
            streakDays: 7,
            totalTimeSpent: 240,
            lastActive: new Date(),
            badges: ["quick_learner", "perfect_score", "week_streak"],
            achievements: [
              {
                id: "first_quiz",
                name: "Quiz Master",
                description: "Complete your first quiz",
                unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            ],
          },
        });
      }
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await db.collection("users").findOne(
      { _id: userId },
      {
        projection: {
          "progress": 1,
          "stats": 1,
        },
      }
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // If user doesn't have stats yet, initialize with default values
    const userStats = user.stats || {
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
    };

    const userProgress = user.progress || {
      level: 1,
      xp: 0,
      points: 0,
      nextLevelXp: 1000,
    };

    return NextResponse.json({
      progress: userProgress,
      stats: userStats,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}

// Update user stats
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { stats, progress } = await request.json();
    
    const client = await clientPromise;
    const db = client.db();
    
    let userId;
    try {
      userId = new ObjectId(session.user.id);
    } catch (e) {
      // For demo user, just return the data that was sent
      if (session.user.email === "demo@example.com") {
        return NextResponse.json({
          progress: progress || {
            level: session.user.level || 1,
            xp: session.user.xp || 0,
            points: session.user.points || 0,
            nextLevelXp: (session.user.level || 1) * 1000,
          },
          stats: stats || {
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
        });
      }
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }
    
    // First, get the current user data
    const currentUser = await db.collection("users").findOne({ _id: userId });
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: Record<string, any> = {
      updatedAt: new Date()
    };
    
    // Update stats if provided
    if (stats) {
      const currentStats = currentUser.stats || {
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
      };
      
      updateData.stats = {
        ...currentStats,
        ...stats,
        lastActive: new Date(),
      };
    }
    
    // Update progress if provided
    if (progress) {
      const currentProgress = currentUser.progress || {
        level: 1,
        xp: 0,
        points: 0,
        nextLevelXp: 1000,
      };
      
      updateData.progress = {
        ...currentProgress,
        ...progress,
        // Always calculate nextLevelXp based on current level
        nextLevelXp: (progress.level || currentProgress.level) * 1000,
      };
    }
    
    // Update the user
    const result = await db.collection("users").findOneAndUpdate(
      { _id: userId },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    if (!result || !result.value) {
      return NextResponse.json(
        { error: "Failed to update user stats" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      progress: result.value.progress || {
        level: 1,
        xp: 0,
        points: 0,
        nextLevelXp: 1000,
      },
      stats: result.value.stats || {
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
    });
  } catch (error) {
    console.error("Error updating user stats:", error);
    return NextResponse.json(
      { error: "Failed to update user stats" },
      { status: 500 }
    );
  }
}