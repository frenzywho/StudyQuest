"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarIcon, Clock, Plus, BookOpen, Trash2, PencilLine } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Task interface
interface Task {
  id: string
  title: string
  description: string
  dueDate: Date
  difficulty: "Easy" | "Medium" | "Hard"
  category: string
  completed: boolean
  xp: number
}

// Mock initial tasks
const initialTasks: Task[] = [
  {
    id: "1",
    title: "Complete Algebra Assignment",
    description: "Solve problems from Chapter 5, pages 45-48",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    difficulty: "Medium",
    category: "Mathematics",
    completed: false,
    xp: 25,
  },
  {
    id: "2",
    title: "Read History Chapter",
    description: "Read Chapter 8: The Industrial Revolution",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    difficulty: "Easy",
    category: "History",
    completed: false,
    xp: 10,
  },
  {
    id: "3",
    title: "Practice Spanish Vocabulary",
    description: "Learn 20 new words and practice with flashcards",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
    difficulty: "Medium",
    category: "Languages",
    completed: false,
    xp: 25,
  },
  {
    id: "4",
    title: "Physics Lab Report",
    description: "Write up the results from the pendulum experiment",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 4)),
    difficulty: "Hard",
    category: "Science",
    completed: false,
    xp: 50,
  },
]

export function TaskList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    dueDate: new Date(),
    difficulty: "Medium",
    category: "Mathematics",
  })
  const [filter, setFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)

  // Difficulty to XP mapping
  const difficultyXp = {
    Easy: 10,
    Medium: 25,
    Hard: 50,
  }

  // Categories
  const categories = [
    "Mathematics",
    "Science",
    "History",
    "Languages",
    "Computer Science",
    "Art",
    "Physical Education",
    "Other",
  ]

  // Handle task creation
  const handleCreateTask = () => {
    if (!newTask.title) {
      toast({
        title: "Task title required",
        description: "Please enter a title for your task",
        variant: "destructive",
      })
      return
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title || "New Task",
      description: newTask.description || "",
      dueDate: newTask.dueDate || new Date(),
      difficulty: (newTask.difficulty as "Easy" | "Medium" | "Hard") || "Medium",
      category: newTask.category || "Mathematics",
      completed: false,
      xp: difficultyXp[(newTask.difficulty as "Easy" | "Medium" | "Hard") || "Medium"],
    }

    setTasks([...tasks, task])
    setNewTask({
      title: "",
      description: "",
      dueDate: new Date(),
      difficulty: "Medium",
      category: "Mathematics",
    })
    setIsAddTaskOpen(false)
    toast({
      title: "Task created",
      description: "Your new task has been added successfully",
    })
  }

  // Handle task completion
  const handleTaskCompletion = (id: string, completed: boolean) => {
    const taskIndex = tasks.findIndex((task) => task.id === id)
    if (taskIndex === -1) return

    const updatedTasks = [...tasks]
    updatedTasks[taskIndex].completed = completed

    setTasks(updatedTasks)

    if (completed) {
      const earnedXp = updatedTasks[taskIndex].xp
      toast({
        title: "Task completed!",
        description: `You earned ${earnedXp} XP for completing this task!`,
      })
    }
  }

  // Handle task deletion
  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
    toast({
      title: "Task deleted",
      description: "The task has been removed from your list",
    })
  }

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const statusMatch =
      filter === "all" || (filter === "completed" && task.completed) || (filter === "pending" && !task.completed)

    const categoryMatch = categoryFilter === "all" || task.category === categoryFilter

    return statusMatch && categoryMatch
  })

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl">Task Management</CardTitle>
            <CardDescription>Organize and track your study tasks</CardDescription>
          </div>
          <Button onClick={() => setIsAddTaskOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-2 justify-between">
              <div className="flex gap-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tasks</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredTasks.length} tasks ({tasks.filter((t) => t.completed).length} completed)
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No tasks found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {filter === "all" && categoryFilter === "all"
                    ? "Create your first task to start earning XP!"
                    : "Try changing your filters to see more tasks"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task) => (
                  <div key={task.id} className={`border rounded-lg p-4 ${task.completed ? "bg-muted" : ""}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={(checked) => handleTaskCompletion(task.id, checked === true)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                              {task.title}
                            </h3>
                            <Badge
                              variant={
                                task.difficulty === "Easy"
                                  ? "outline"
                                  : task.difficulty === "Medium"
                                    ? "secondary"
                                    : "default"
                              }
                            >
                              {task.difficulty} ({task.xp} XP)
                            </Badge>
                            <Badge variant="outline">{task.category}</Badge>
                          </div>
                          <p className={`text-sm mt-1 ${task.completed ? "text-muted-foreground" : ""}`}>
                            {task.description}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            Due: {format(new Date(task.dueDate), "PPP")}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost">
                          <PencilLine className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteTask(task.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a new task to your study plan. Set difficulty to earn more XP.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                placeholder="e.g., Complete Math Assignment"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your task..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("justify-start text-left font-normal", !newTask.dueDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTask.dueDate ? format(newTask.dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newTask.dueDate}
                      onSelect={(date) => setNewTask({ ...newTask, dueDate: date || new Date() })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>Difficulty</Label>
                <Select
                  value={newTask.difficulty}
                  onValueChange={(value: "Easy" | "Medium" | "Hard") => setNewTask({ ...newTask, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy (10 XP)</SelectItem>
                    <SelectItem value="Medium">Medium (25 XP)</SelectItem>
                    <SelectItem value="Hard">Hard (50 XP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={newTask.category} onValueChange={(value) => setNewTask({ ...newTask, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

