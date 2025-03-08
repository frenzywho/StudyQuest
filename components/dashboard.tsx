"use client"

import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskList } from "@/components/task-list"
import { RewardDisplay } from "@/components/reward-display"
import { useToast } from "@/components/ui/use-toast"
import AiAssistant from "@/components/ai-assistant"
import { QuizSection } from "@/components/quiz-section"
import { Activity, Award, Calendar, CheckCircle, Star, Trophy, Users } from "lucide-react"
import { Leaderboard } from "@/components/leaderboard"
import { useEffect, useState } from "react"

export default function Dashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [showLevelUp, setShowLevelUp] = useState(false)

  const xpNeeded = 500 // XP needed for next level
  const xpPercentage = user ? (user.xp / xpNeeded) * 100 : 0

  // Mock statistics
  const stats = [
    {
      label: "Tasks Completed",
      value: "14",
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    },
    {
      label: "Current Streak",
      value: "5 days",
      icon: <Activity className="h-4 w-4 text-orange-500" />,
    },
    {
      label: "Quiz Accuracy",
      value: "84%",
      icon: <Star className="h-4 w-4 text-yellow-500" />,
    },
    {
      label: "Study Time",
      value: "23h",
      icon: <Calendar className="h-4 w-4 text-blue-500" />,
    },
  ]

  // Level up simulation
  useEffect(() => {
    // Simulate level up after 2 seconds
    const timer = setTimeout(() => {
      setShowLevelUp(true)
      toast({
        title: "Level Up!",
        description: "Congratulations! You've reached Level 6! Keep up the great work!",
        duration: 5000,
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [toast])

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Welcome back, {user.name}!</CardTitle>
            <CardDescription>Continue your learning journey and earn rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Level {showLevelUp ? "6" : user.level}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {user.xp} / {xpNeeded} XP
                  </span>
                </div>
                <Progress value={xpPercentage} className={`h-2 ${showLevelUp ? "animate-level-up" : ""}`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
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
              {[
                "Study Streak",
                "Quiz Master",
                "Task Champion",
                "Knowledge Seeker",
                "Early Bird",
                "Focus Mode",
                "Team Player",
                "Problem Solver",
              ].map((badge, i) => (
                <div key={i} className="flex flex-col items-center p-2 rounded-lg bg-muted">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      i < 5 ? "bg-primary/20" : "bg-muted-foreground/20"
                    }`}
                  >
                    {i < 5 ? (
                      <Trophy className={`h-5 w-5 ${i < 5 ? "text-primary" : "text-muted-foreground"}`} />
                    ) : (
                      <Trophy className="h-5 w-5 text-muted-foreground/50" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 text-center ${i < 5 ? "" : "text-muted-foreground"}`}>{badge}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="space-y-4">
          <TaskList />
        </TabsContent>
        <TabsContent value="assistant" className="space-y-4">
          <AiAssistant />
        </TabsContent>
        <TabsContent value="quizzes" className="space-y-4">
          <QuizSection />
        </TabsContent>
        <TabsContent value="rewards" className="space-y-4">
          <RewardDisplay />
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
          <Leaderboard />
        </CardContent>
      </Card>
    </div>
  )
}

