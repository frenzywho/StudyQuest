import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      xp?: number;
      level?: number;
      points?: number;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    xp?: number;
    level?: number;
    points?: number;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}