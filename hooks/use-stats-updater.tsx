"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { UserStats, UserProgress } from "@/types/user";

export function useStatsUpdater() {
  const { data: session, update: updateSession } = useSession();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStats = async (newStats: Partial<UserStats>, newProgress?: Partial<UserProgress>) => {
    if (!session?.user?.id) return false;

    try {
      setIsUpdating(true);
      
      const response = await fetch('/api/users/stats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats: newStats,
          progress: newProgress
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      
      // Update session if progress was updated
      if (newProgress) {
        await updateSession({
          ...session,
          user: {
            ...session.user,
            level: data.progress.level,
            xp: data.progress.xp,
            points: data.progress.points,
          }
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to update stats:', error);
      toast({
        title: "Update failed",
        description: "Could not update your statistics. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper function to complete a quiz
  const completeQuiz = async (correctAnswers: number, totalQuestions: number, timeSpent: number) => {
    const points = Math.round(correctAnswers * 10);
    const xpEarned = Math.round(correctAnswers * 15);
    
    const newStats: Partial<UserStats> = {
      quizzesCompleted: 1, // This will be incremented by the server
      quizzesCorrect: correctAnswers,
      totalQuizPoints: points,
      totalTimeSpent: timeSpent,
    };
    
    // Calculate if level up is needed
    const currentXP = session?.user?.xp || 0;
    const currentLevel = session?.user?.level || 1;
    const nextLevelXP = currentLevel * 1000;
    const newXP = currentXP + xpEarned;
    
    let newLevel = currentLevel;
    if (newXP >= nextLevelXP) {
      newLevel = Math.floor(newXP / 1000) + 1;
      
      toast({
        title: "Level Up! 🎉",
        description: `Congratulations! You've reached level ${newLevel}!`,
        duration: 5000
      });
    }
    
    const newProgress: Partial<UserProgress> = {
      xp: newXP,
      level: newLevel,
      points: (session?.user?.points || 0) + points
    };
    
    const updated = await updateStats(newStats, newProgress);
    
    if (updated) {
      toast({
        title: "Quiz Completed! 🎓",
        description: `You earned ${points} points and ${xpEarned} XP!`,
        duration: 3000
      });
    }
    
    return updated;
  };

  // Helper function to complete a task
  const completeTask = async (taskDifficulty: 'easy' | 'medium' | 'hard', timeSpent: number) => {
    // Calculate points and XP based on difficulty
    const pointsMap = {
      easy: 5,
      medium: 15,
      hard: 30
    };
    
    const xpMap = {
      easy: 10,
      medium: 25,
      hard: 50
    };
    
    const points = pointsMap[taskDifficulty];
    const xpEarned = xpMap[taskDifficulty];
    
    const newStats: Partial<UserStats> = {
      tasksCompleted: 1, // This will be incremented by the server
      totalTimeSpent: timeSpent,
    };
    
    // Calculate if level up is needed
    const currentXP = session?.user?.xp || 0;
    const currentLevel = session?.user?.level || 1;
    const nextLevelXP = currentLevel * 1000;
    const newXP = currentXP + xpEarned;
    
    let newLevel = currentLevel;
    if (newXP >= nextLevelXP) {
      newLevel = Math.floor(newXP / 1000) + 1;
      
      toast({
        title: "Level Up! 🎉",
        description: `Congratulations! You've reached level ${newLevel}!`,
        duration: 5000
      });
    }
    
    const newProgress: Partial<UserProgress> = {
      xp: newXP,
      level: newLevel,
      points: (session?.user?.points || 0) + points
    };
    
    const updated = await updateStats(newStats, newProgress);
    
    if (updated) {
      toast({
        title: "Task Completed! ✅",
        description: `You earned ${points} points and ${xpEarned} XP!`,
        duration: 3000
      });
    }
    
    return updated;
  };

  return {
    updateStats,
    completeQuiz,
    completeTask,
    isUpdating
  };
}