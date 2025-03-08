"use client"
import { useAuth } from "@/components/auth-provider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Medal, Trophy, Star, Clock } from "lucide-react"

// User interface for leaderboard
interface LeaderboardUser {
  id: string
  name: string
  avatarUrl: string
  level: number
  xp: number
  position: number
  isCurrentUser: boolean
  streak?: number
  tasksCompleted?: number
  quizScore?: number
}

// Mock leaderboard data
const mockWeeklyData: LeaderboardUser[] = [
  {
    id: "user-1",
    name: "Alex Student",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 5,
    xp: 350,
    position: 3,
    isCurrentUser: true,
  },
  {
    id: "user-2",
    name: "Emma Johnson",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 7,
    xp: 570,
    position: 1,
    isCurrentUser: false,
  },
  {
    id: "user-3",
    name: "Michael Chen",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 6,
    xp: 430,
    position: 2,
    isCurrentUser: false,
  },
  {
    id: "user-4",
    name: "Olivia Davis",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 4,
    xp: 290,
    position: 4,
    isCurrentUser: false,
  },
  {
    id: "user-5",
    name: "James Wilson",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 4,
    xp: 260,
    position: 5,
    isCurrentUser: false,
  },
]

const mockStreakData: LeaderboardUser[] = [
  {
    id: "user-1",
    name: "Alex Student",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 5,
    streak: 5,
    position: 4,
    isCurrentUser: true,
  },
  {
    id: "user-2",
    name: "Emma Johnson",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 7,
    streak: 12,
    position: 1,
    isCurrentUser: false,
  },
  {
    id: "user-3",
    name: "Michael Chen",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 6,
    streak: 9,
    position: 2,
    isCurrentUser: false,
  },
  {
    id: "user-6",
    name: "Sophia Martinez",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 5,
    streak: 8,
    position: 3,
    isCurrentUser: false,
  },
  {
    id: "user-7",
    name: "Daniel Brown",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 4,
    streak: 4,
    position: 5,
    isCurrentUser: false,
  },
]

const mockTasksData: LeaderboardUser[] = [
  {
    id: "user-1",
    name: "Alex Student",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 5,
    tasksCompleted: 14,
    position: 2,
    isCurrentUser: true,
  },
  {
    id: "user-8",
    name: "Isabella Taylor",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 6,
    tasksCompleted: 17,
    position: 1,
    isCurrentUser: false,
  },
  {
    id: "user-3",
    name: "Michael Chen",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 6,
    tasksCompleted: 12,
    position: 3,
    isCurrentUser: false,
  },
  {
    id: "user-9",
    name: "Ethan Anderson",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 5,
    tasksCompleted: 11,
    position: 4,
    isCurrentUser: false,
  },
  {
    id: "user-5",
    name: "James Wilson",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 4,
    tasksCompleted: 9,
    position: 5,
    isCurrentUser: false,
  },
]

const mockQuizData: LeaderboardUser[] = [
  {
    id: "user-1",
    name: "Alex Student",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 5,
    quizScore: 84,
    position: 3,
    isCurrentUser: true,
  },
  {
    id: "user-2",
    name: "Emma Johnson",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 7,
    quizScore: 92,
    position: 1,
    isCurrentUser: false,
  },
  {
    id: "user-10",
    name: "Ava Thomas",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 6,
    quizScore: 88,
    position: 2,
    isCurrentUser: false,
  },
  {
    id: "user-4",
    name: "Olivia Davis",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 4,
    quizScore: 79,
    position: 4,
    isCurrentUser: false,
  },
  {
    id: "user-11",
    name: "Noah Williams",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    level: 3,
    quizScore: 75,
    position: 5,
    isCurrentUser: false,
  },
]

export function Leaderboard() {
  const { user } = useAuth()

  return (
    <Tabs defaultValue="weekly" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="weekly">
          <Trophy className="h-4 w-4 mr-2" />
          XP
        </TabsTrigger>
        <TabsTrigger value="streaks">
          <Clock className="h-4 w-4 mr-2" />
          Streaks
        </TabsTrigger>
        <TabsTrigger value="tasks">
          <Star className="h-4 w-4 mr-2" />
          Tasks
        </TabsTrigger>
        <TabsTrigger value="quizzes">
          <Medal className="h-4 w-4 mr-2" />
          Quizzes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="weekly">
        <LeaderboardTable users={mockWeeklyData} type="xp" />
      </TabsContent>

      <TabsContent value="streaks">
        <LeaderboardTable users={mockStreakData} type="streaks" />
      </TabsContent>

      <TabsContent value="tasks">
        <LeaderboardTable users={mockTasksData} type="tasks" />
      </TabsContent>

      <TabsContent value="quizzes">
        <LeaderboardTable users={mockQuizData} type="quizzes" />
      </TabsContent>
    </Tabs>
  )
}

function LeaderboardTable({
  users,
  type,
}: {
  users: LeaderboardUser[]
  type: "xp" | "streaks" | "tasks" | "quizzes"
}) {
  const valueLabels = {
    xp: "XP Earned",
    streaks: "Current Streak",
    tasks: "Tasks Completed",
    quizzes: "Quiz Accuracy",
  }

  const valueFormatters = {
    xp: (user: LeaderboardUser) => `${user.xp} XP`,
    streaks: (user: LeaderboardUser) => `${user.streak} days`,
    tasks: (user: LeaderboardUser) => `${user.tasksCompleted}`,
    quizzes: (user: LeaderboardUser) => `${user.quizScore}%`,
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Rank</TableHead>
          <TableHead>Student</TableHead>
          <TableHead>Level</TableHead>
          <TableHead className="text-right">{valueLabels[type]}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id} className={user.isCurrentUser ? "bg-muted" : ""}>
            <TableCell>
              {user.position <= 3 ? (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                  {user.position === 1 ? (
                    <Trophy className="h-4 w-4 text-amber-400" />
                  ) : user.position === 2 ? (
                    <Medal className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Medal className="h-4 w-4 text-amber-700" />
                  )}
                </div>
              ) : (
                <div className="pl-3">{user.position}</div>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">
                    {user.name}
                    {user.isCurrentUser && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
                  </span>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="font-bold">
                {user.level}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-medium">{valueFormatters[type](user)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

