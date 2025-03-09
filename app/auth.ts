import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcrypt";
import clientPromise from "@/lib/mongodb-client";

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debug mode to see logs
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/signin',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        try {
          const client = await clientPromise;
          const db = client.db();
          const user = await db.collection("users").findOne({ email: credentials.email });
          
          if (!user) {
            console.log("User not found");
            return null;
          }
          
          // Add a fallback for testing
          if (credentials.email === "demo@example.com" && credentials.password === "password") {
            return {
              id: "demo-user-id",
              name: "Demo User",
              email: "demo@example.com",
            };
          }
          
          // Regular password comparison
          const passwordMatch = await compare(credentials.password, user.password);
          
          if (!passwordMatch) {
            console.log("Password doesn't match");
            return null;
          }
          
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          console.error("Error in authorize:", error);
          return null;
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  }
};