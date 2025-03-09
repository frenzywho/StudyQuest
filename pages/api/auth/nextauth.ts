import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb-client";
import { compare } from "bcrypt";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // For demo purposes
          if (credentials.email === "demo@example.com" && credentials.password === "password") {
            return {
              id: "demo-user-id",
              name: "Demo User",
              email: "demo@example.com",
              image: "/avatar-placeholder.png",
              level: 5,
              xp: 2500,
              points: 500,
            };
          }

          // Check against database
          const client = await clientPromise;
          const db = client.db();
          const user = await db.collection("users").findOne({ email: credentials.email });

          if (!user) {
            return null;
          }

          // Check password
          const passwordValid = await compare(credentials.password, user.password);
          if (!passwordValid) {
            return null;
          }

          // Return user without password
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.avatarUrl || null,
            level: user.level || 1,
            xp: user.xp || 0,
            points: user.points || 0,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          level: 1,
          xp: 0,
          points: 0,
        };
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          level: 1,
          xp: 0,
          points: 0,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any, user?: any }) {
      // Add custom user fields to token
      if (user) {
        token.id = user.id;
        token.level = user.level || 1;
        token.xp = user.xp || 0;
        token.points = user.points || 0;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      // Add custom fields to session
      if (session.user) {
        session.user.id = token.id;
        session.user.level = token.level || 1;
        session.user.xp = token.xp || 0;
        session.user.points = token.points || 0;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/auth/error",
  },
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: 'jwt' as 'jwt' | 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as 'lax',
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };