"use client"

import { useSession, signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskList } from "@/components/task-list"
import { RewardDisplay } from "@/components/reward-display"
import { useToast } from "@/components/ui/use-toast"
import AiAssistant from "@/components/ai-assistant"
import { QuizSection } from "@/components/quiz-section"
import { Activity, Award, Calendar, CheckCircle, Star, Trophy, Clock, Target, Users } from "lucide-react"
import { Leaderboard } from "@/components/leaderboard"
import React, { useEffect, useState } from "react"

// Fixed: Safer type for JSX.Element
type IconType = React.ReactNode;

// Default stats when user has no data
const defaultStats = {
  quizzesCompleted: 0,
  quizzesCorrect: 0,
  totalQuizPoints: 0,
  tasksCompleted: 0,
  challengesCompleted: 0,
  streakDays: 0,
  totalTimeSpent: 0, // in minutes
  lastActive: new Date(),
  badges: [] as string[], // Fixed: Explicitly typed array
  achievements: [] as string[], // Fixed: Explicitly typed array
};

// Define badge types that match what would be in the database
type BadgeDefinitions = {
  [key: string]: {
    title: string;
    description: string;
    icon: IconType; // Fixed: Use safer type
  };
};

const badgeDefinitions: BadgeDefinitions = {
  "study_streak": {
    title: "Study Streak",
    description: "Log in for 7 consecutive days",
    icon: <Activity className="h-5 w-5" />
  },
  "quiz_master": {
    title: "Quiz Master",
    description: "Score 100% on 5 different quizzes",
    icon: <Star className="h-5 w-5" />
  },
  "task_champion": {
    title: "Task Champion",
    description: "Complete 20 tasks",
    icon: <CheckCircle className="h-5 w-5" />
  },
  "knowledge_seeker": {
    title: "Knowledge Seeker",
    description: "Spend 5 hours learning",
    icon: <Target className="h-5 w-5" />
  },
  "early_bird": {
    title: "Early Bird",
    description: "Start learning before 8am for 5 days",
    icon: <Calendar className="h-5 w-5" />
  },
  "focus_mode": {
    title: "Focus Mode",
    description: "Complete a 2-hour study session without breaks",
    icon: <Clock className="h-5 w-5" />
  },
  "team_player": {
    title: "Team Player",
    description: "Help 3 other learners with their questions",
    icon: <Users className="h-5 w-5" />
  },
  "problem_solver": {
    title: "Problem Solver",
    description: "Solve 10 challenging programming problems",
    icon: <Award className="h-5 w-5" />
  }
};

// All possible badge IDs
const allBadgeIds = Object.keys(badgeDefinitions);

// Fixed: Define interfaces for better type safety
interface UserStats {
  quizzesCompleted: number;
  quizzesCorrect: number;
  totalQuizPoints: number;
  tasksCompleted: number;
  challengesCompleted: number;
  streakDays: number;
  totalTimeSpent: number;
  lastActive: Date;
  badges: string[];
  achievements: string[];
}

interface ProgressStats {
  level: number;
  xp: number;
  points: number;
  nextLevelXp: number;
}

interface StatsUpdateEvent {
  stats?: Partial<UserStats>;
  progress?: Partial<ProgressStats>;
  levelUp?: boolean;
}

export default function Dashboard() {
  // Fixed: Handle loading state properly
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>(defaultStats);

  const [progress, setProgress] = useState<ProgressStats>({
    level: 1,
    xp: 0,
    points: 0,
    nextLevelXp: 1000,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Fixed: Add error state

  // Fixed: More robust fetchUserStats with better error handling
  const fetchUserStats = async () => {
    if (!session?.user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null); // Reset error state before fetching
      
      const response = await fetch("/api/users/stats");
      
      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch user stats: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("User stats data received:", data);
      
      // Set user stats and progress with defaults for missing data
      setUserStats({
        quizzesCompleted: data.stats?.quizzesCompleted ?? 0,
        quizzesCorrect: data.stats?.quizzesCorrect ?? 0,
        totalQuizPoints: data.stats?.totalQuizPoints ?? 0,
        tasksCompleted: data.stats?.tasksCompleted ?? 0,
        challengesCompleted: data.stats?.challengesCompleted ?? 0,
        streakDays: data.stats?.streakDays ?? 0,
        totalTimeSpent: data.stats?.totalTimeSpent ?? 0,
        lastActive: data.stats?.lastActive ? new Date(data.stats.lastActive) : new Date(),
        badges: data.stats?.badges ?? [],
        achievements: data.stats?.achievements ?? [],
      });
      
      setProgress({
        level: data.progress?.level ?? 1,
        xp: data.progress?.xp ?? 0,
        points: data.progress?.points ?? 0,
        nextLevelXp: data.progress?.nextLevelXp ?? 1000,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      setError(error instanceof Error ? error.message : "Unknown error fetching stats");
      // Fixed: Use mock data on error for better UX
      // We still show the UI with default values instead of failing completely
      
      // Optional: Show toast only if it's not a 404 (which can happen if the user is new)
      if (!(error instanceof Error && error.message.includes("404"))) {
        toast({
          title: "Error Loading Stats",
          description: "Using default values. You can continue using the app.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fixed: Add effect for initial session detection
  useEffect(() => {
    console.log("Session status:", status);
    if (status === "authenticated") {
      console.log("User authenticated:", session?.user?.name);
    }
  }, [status, session]);

  // Fixed: Better fetch user profile data with fallbacks
  useEffect(() => {
    // Define the function inline to avoid calling it during SSR
    async function fetchUserData() {
      if (session?.user?.id) {
        try {
          setIsLoading(true);
          setError(null); // Reset error state
          
          console.log("Fetching user profile data...");
          const response = await fetch("/api/users/profile");
          
          if (response.ok) {
            const userData = await response.json();
            console.log("User profile data:", userData);
            
            // Update stats from real data with fallbacks
            setUserStats({
              quizzesCompleted: userData.stats?.quizzesCompleted ?? defaultStats.quizzesCompleted,
              quizzesCorrect: userData.stats?.quizzesCorrect ?? defaultStats.quizzesCorrect,
              totalQuizPoints: userData.stats?.totalQuizPoints ?? defaultStats.totalQuizPoints,
              tasksCompleted: userData.stats?.tasksCompleted ?? defaultStats.tasksCompleted,
              challengesCompleted: userData.stats?.challengesCompleted ?? defaultStats.challengesCompleted,
              streakDays: userData.stats?.streakDays ?? defaultStats.streakDays,
              totalTimeSpent: userData.stats?.totalTimeSpent ?? defaultStats.totalTimeSpent,
              lastActive: userData.stats?.lastActive ? new Date(userData.stats.lastActive) : new Date(),
              badges: userData.stats?.badges ?? [],
              achievements: userData.stats?.achievements ?? [],
            });
            
            // Use nullish coalescing for safer defaults
            setProgress({
              level: userData.progress?.level ?? (session.user.level ?? 1),
              xp: userData.progress?.xp ?? (session.user.xp ?? 0),
              points: userData.progress?.points ?? (session.user.points ?? 0),
              nextLevelXp: userData.progress?.nextLevelXp ?? 1000
            });
          } else if (response.status === 404) {
            // New user, no profile yet - use session data with defaults
            console.log("User profile not found, using session data");
            setProgress({
              level: session.user.level ?? 1,
              xp: session.user.xp ?? 0,
              points: session.user.points ?? 0,
              nextLevelXp: 1000
            });
          } else {
            console.error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
            throw new Error(`API error: ${response.status}`);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setError(error instanceof Error ? error.message : "Unknown error fetching user data");
          // Still use session data as fallback
          if (session?.user) {
            setProgress({
              level: session.user.level ?? 1,
              xp: session.user.xp ?? 0,
              points: session.user.points ?? 0,
              nextLevelXp: 1000
            });
          }
        } finally {
          setIsLoading(false);
        }
      } else if (status === "authenticated") {
        // Session exists but no user ID - handle this edge case
        console.warn("Session is authenticated but no user.id is present");
        setIsLoading(false);
      }
    }

    // Only fetch when session is available
    if (status === "authenticated") {
      fetchUserData();
    } else if (status === "unauthenticated") {
      // Clear loading state if user is not authenticated
      setIsLoading(false);
    }
  }, [session, status, toast]);

  // Fixed: Better event handler with proper typing
  useEffect(() => {
    // Listen for stats updates from child components
    const handleStatsUpdate = (event: Event) => {
      // Fixed: Proper type casting
      const customEvent = event as CustomEvent<StatsUpdateEvent>;
      console.log("Stats update event received:", customEvent.detail);
      
      const { stats, progress: newProgress, levelUp } = customEvent.detail || {};
      
      if (stats) {
        console.log("Updating stats:", stats);
        setUserStats(prev => ({
          ...prev,
          quizzesCompleted: stats.quizzesCompleted ?? prev.quizzesCompleted,
          quizzesCorrect: stats.quizzesCorrect ?? prev.quizzesCorrect,
          totalQuizPoints: stats.totalQuizPoints ?? prev.totalQuizPoints,
          tasksCompleted: stats.tasksCompleted ?? prev.tasksCompleted,
          challengesCompleted: stats.challengesCompleted ?? prev.challengesCompleted,
          streakDays: stats.streakDays ?? prev.streakDays,
          totalTimeSpent: stats.totalTimeSpent ?? prev.totalTimeSpent,
          lastActive: stats.lastActive ? new Date(stats.lastActive) : prev.lastActive,
          badges: stats.badges ?? prev.badges,
          achievements: stats.achievements ?? prev.achievements,
        }));
      }
      
      if (newProgress) {
        console.log("Updating progress:", newProgress);
        setProgress(prev => ({
          level: newProgress.level ?? prev.level,
          xp: newProgress.xp ?? prev.xp,
          points: newProgress.points ?? prev.points,
          nextLevelXp: newProgress.nextLevelXp ?? prev.nextLevelXp,
        }));
        
        // If user leveled up, show animation/notification
        if (levelUp) {
          setShowLevelUp(true);
          toast({
            title: "Level Up! 🎉",
            description: `Congratulations! You've reached level ${newProgress.level}!`,
            variant: "default"
          });
          
          // Reset animation after a delay
          setTimeout(() => {
            setShowLevelUp(false);
          }, 3000);
        }
      }
    };

    // Fixed: Only add event listener in browser
    if (typeof window !== 'undefined') {
      window.addEventListener("statsUpdate", handleStatsUpdate);
      
      return () => {
        window.removeEventListener("statsUpdate", handleStatsUpdate);
      };
    }
  }, [toast]);

  // Fixed: Safe calculation of XP percentage
  const xpPercentage = Math.min(100, Math.round((progress.xp / (progress.nextLevelXp || 1)) * 100));

  // Fixed: Better study time formatter
  const formatStudyTime = (minutes: number): string => {
    if (typeof minutes !== 'number' || isNaN(minutes)) {
      return '0h 0m';
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  // Fixed: More robust stats display with proper fallbacks
  const displayStats = [
    {
      label: "Tasks Completed",
      value: userStats?.tasksCompleted?.toString() || "0",
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    },
    {
      label: "Current Streak",
      value: `${userStats?.streakDays || 0} days`,
      icon: <Activity className="h-4 w-4 text-orange-500" />,
    },
    {
      label: "Quiz Accuracy",
      value: (userStats?.quizzesCompleted || 0) > 0 
        ? `${Math.round(((userStats?.quizzesCorrect || 0) / (userStats?.quizzesCompleted || 1)) * 100)}%` 
        : "0%",
      icon: <Star className="h-4 w-4 text-yellow-500" />,
    },
    {
      label: "Study Time",
      value: formatStudyTime(userStats?.totalTimeSpent || 0),
      icon: <Clock className="h-4 w-4 text-blue-500" />,
    },
  ];

  // Fixed: Ensure badges are always an array
  const userBadges: string[] = Array.isArray(userStats.badges) ? userStats.badges : [];

  // Fixed: Better loading state handling
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Fixed: Proper check for authenticated session with required user data
  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-xl font-semibold mb-4">Sign in to view your dashboard</h2>
        <p className="mb-6">Please sign in to access your personalized learning dashboard.</p>
        
        {/* Single sign-in button that redirects to sign-in page */}
        <div className="flex justify-center">
          <button
            onClick={() => signIn()}
            className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Go to Sign In Page
          </button>
        </div>
      </div>
    );
  }

  // Fixed: The main rendering with error handling
  return (
    <div className="space-y-6">
      {/* Show error banner if there are problems */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-lg">
          <p className="text-red-800 dark:text-red-200 font-medium">
            {error}
          </p>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
            Some features may be limited. You can continue using the app with default values.
          </p>
        </div>
      )}

      {/* User stats cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Welcome back, {session.user.name || "Learner"}!</CardTitle>
            <CardDescription>Continue your learning journey and earn rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Level {progress.level}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {progress.xp} / {progress.nextLevelXp} XP
                  </span>
                </div>
                <Progress value={xpPercentage} className={`h-2 ${showLevelUp ? "animate-level-up" : ""}`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {displayStats.map((stat, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    {stat.icon}
                    <div>
                      <div className="font-medium">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Achievements
            </CardTitle>
            <CardDescription>Your latest badges and accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {allBadgeIds.map((badgeId, i) => {
                // Fixed: Safe access to badge definitions
                const badgeEarned = userBadges.includes(badgeId);
                const badge = badgeDefinitions[badgeId] || {
                  title: "Badge",
                  description: "Achievement badge",
                  icon: <Award className="h-5 w-5" />
                };
                
                return (
                  <div 
                    key={i} 
                    className="flex flex-col items-center p-2 rounded-lg bg-muted"
                    title={badge.description}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        badgeEarned ? "bg-primary/20" : "bg-muted-foreground/20"
                      }`}
                    >
                      {React.isValidElement(badge.icon) 
                        ? React.cloneElement(badge.icon, {
                            className: `h-5 w-5 ${badgeEarned ? "text-primary" : "text-muted-foreground/50"}`
                          } as React.HTMLAttributes<SVGElement>)
                        : <Award className={`h-5 w-5 ${badgeEarned ? "text-primary" : "text-muted-foreground/50"}`} />
                      }
                    </div>
                    <span className={`text-xs mt-1 text-center ${badgeEarned ? "" : "text-muted-foreground"}`}>
                      {badge.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs section with error handling */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>
        
        {/* Fixed: Error boundary wrapping for each tab content */}
        <TabsContent value="tasks" className="space-y-4">
          <ErrorBoundary fallback={<ComponentErrorState componentName="Task List" />}>
            <TaskList />
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="assistant" className="space-y-4">
          <ErrorBoundary fallback={<ComponentErrorState componentName="AI Assistant" />}>
            <AiAssistant />
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="quizzes" className="space-y-4">
          <ErrorBoundary fallback={<ComponentErrorState componentName="Quiz Section" />}>
            <QuizSection />
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="rewards" className="space-y-4">
          <ErrorBoundary fallback={<ComponentErrorState componentName="Rewards Display" />}>
            <RewardDisplay />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Leaderboard
          </CardTitle>
          <CardDescription>See how you compare to other students</CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorBoundary fallback={<ComponentErrorState componentName="Leaderboard" />}>
            <Leaderboard />
          </ErrorBoundary>
        </CardContent>
      </Card>
    </div>
  );
}

// Fixed: Add ErrorBoundary component for catching rendering errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Fixed: Error fallback component
function ComponentErrorState({ componentName }: { componentName: string }) {
  return (
    <div className="p-6 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
      <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
        {componentName} could not be loaded
      </h3>
      <p className="text-red-600 dark:text-red-300">
        There was a problem loading this component. Please try refreshing the page.
      </p>
    </div>
  );
}

