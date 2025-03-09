import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // ✅ Correct import from lib/auth.ts

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions }; // ✅ Correct Next.js API route export
 // ✅ Correct Next.js API route export
