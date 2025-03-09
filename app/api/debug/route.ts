import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "API is working",
    timestamp: new Date().toISOString(),
    env: {
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      hasMongoUri: !!process.env.MONGODB_URI,
      hasGeminiKey: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });
}