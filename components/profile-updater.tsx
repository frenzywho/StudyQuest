"use client"

import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { DefaultSession } from "next-auth";

interface UpdateProfileOptions {
  xp?: number;
  level?: number;
  points?: number;
}

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  xp?: number;
  level?: number;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      xp?: number;
      level?: number;
      points?: number;
    } & DefaultSession["user"];
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

// Ensure we're working with a consistent Session type throughout the application
declare global {
  // This makes the Session type consistent across your application
  namespace NextAuth {
    interface Session {
      user: {
        id: string;
        xp?: number;
        level?: number;
        points?: number;
      } & Omit<DefaultSession["user"], "id">;
    }
  }
}

export function useProfileUpdater() {
  const { data: session, update: updateSession } = useSession();
  const { toast } = useToast();

  const updateProfile = async (options: UpdateProfileOptions) => {
    if (!session?.user) return false;

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const updatedUser = await response.json();

      // Update the session with new user data
      await updateSession({
        ...session,
        user: {
          ...session.user,
          ...updatedUser
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: "Update failed",
        description: "Could not update your profile. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Helper function to add XP
  const addXP = async (amount: number) => {
    if (!session?.user) return false;
    
    const currentXP = session.user.xp || 0;
    const currentLevel = session.user.level || 1;
    const nextLevelXP = currentLevel * 1000;
    
    // Calculate new XP and level
    const newXP = currentXP + amount;
    let newLevel = currentLevel;
    
    // Check if user leveled up
    if (newXP >= nextLevelXP) {
      newLevel = Math.floor(newXP / 1000) + 1;
      
      toast({
        title: "Level Up! 🎉",
        description: `Congratulations! You've reached level ${newLevel}!`,
        variant: "default",
        duration: 5000
      });
    }
    
    // Update profile with new values
    return updateProfile({
      xp: newXP,
      level: newLevel
    });
  };

  return { updateProfile, addXP };
}