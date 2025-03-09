"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/use-toast"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter as DialogFooterComponent,
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
import { useSession } from "next-auth/react"

// Task interface
interface Task {
  id: string
  title: string
  description?: string
  dueDate?: Date
  difficulty?: "Easy" | "Medium" | "Hard"
  category?: string
  completed: boolean
  xpReward: number
  pointsReward: number
}

// Default rewards based on difficulty
const difficultyRewards = {
  "Easy": { xp: 50, points: 25 },
  "Medium": { xp: 100, points: 50 },
  "Hard": { xp: 200, points: 100 }
};

// Mock initial tasks
const initialTasks: Task[] = [
  {
    id: "1",
    title: "Complete Introduction to React",
    description: "Finish the React basics tutorial and build a simple counter app",
    category: "Programming",
    difficulty: "Easy",
    completed: false,
    xpReward: 100,
    pointsReward: 50,
  },
  {
    id: "2",
    title: "Solve Algorithm Challenge",
    description: "Complete the binary search tree traversal problem",
    category: "Algorithms",
    difficulty: "Hard",
    completed: false,
    xpReward: 150,
    pointsReward: 75,
  },
  {
    id: "3",
    title: "Submit Programming Quiz",
    description: "Take the JavaScript fundamentals quiz",
    category: "Quiz",
    difficulty: "Medium",
    completed: false,
    xpReward: 120,
    pointsReward: 60,
  },
];

export function TaskList() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task>({
    id: "",
    title: "",
    description: "",
    difficulty: "Medium",
    category: "",
    completed: false,
    xpReward: 100,
    pointsReward: 50,
  })

  // Handle task completion
  const handleTaskComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
  
      // Toggle completion state
      const newCompletionState = !task.completed;
      
      // Update local state first (optimistic update)
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === taskId ? { ...t, completed: newCompletionState } : t
        )
      );
      
      // Only proceed with API call if completing the task (not uncompleting)
      if (newCompletionState) {
        // Prepare the update data
        const updateData = {
          tasksCompleted: 1,
          xp: task.xpReward,
          points: task.pointsReward,
        };
  
        console.log("Sending task completion update:", updateData);
  
        try {
          // Send update to server
          const response = await fetch("/api/users/stats/update", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
          });
  
          // Get the response text first for debugging
          const responseText = await response.text();
          console.log("Raw response:", responseText);
          
          // Try to parse the response as JSON
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (e) {
            console.error("Failed to parse response as JSON:", e);
            throw new Error("Invalid server response");
          }
  
          // Check if the response was successful
          if (!response.ok) {
            throw new Error(data.error || "Server returned an error");
          }
  
          // If we got here, the update was successful
          console.log("Stats update successful:", data);
  
          // Dispatch stats update event
          window.dispatchEvent(
            new CustomEvent("statsUpdate", {
              detail: data
            })
          );
  
          // Show success toast
          toast({
            title: "Task completed! 🎉",
            description: `Earned ${task.xpReward} XP and ${task.pointsReward} points${
              data.levelUp ? ' and leveled up!' : ''
            }`,
          });
        } catch (error) {
          console.error("Error updating stats:", error);
          
          // Revert the local state change
          setTasks(prevTasks =>
            prevTasks.map(t =>
              t.id === taskId ? { ...t, completed: !newCompletionState } : t
            )
          );
  
          // Show error toast
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to update task completion",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Task completion error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Add new task
  const handleAddTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: `New Task ${tasks.length + 1}`,
      description: "Click to edit this task",
      difficulty: "Medium",
      completed: false,
      xpReward: difficultyRewards.Medium.xp,
      pointsReward: difficultyRewards.Medium.points,
    };
    
    setTasks([...tasks, newTask]);
    
    toast({
      title: "Task added",
      description: "A new task has been added to your list",
    });
  };

  // Open dialog to add a new task
  const openNewTaskDialog = () => {
    setIsEditMode(false);
    setCurrentTask({
      id: `task-${Date.now()}`,
      title: "",
      description: "",
      difficulty: "Medium",
      category: "",
      completed: false,
      xpReward: difficultyRewards["Medium"].xp,
      pointsReward: difficultyRewards["Medium"].points,
    });
    setIsNewTaskDialogOpen(true);
  }

  // Open dialog to edit an existing task
  const openEditTaskDialog = (task: Task) => {
    setIsEditMode(true);
    setCurrentTask({ ...task });
    setIsNewTaskDialogOpen(true);
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentTask({ ...currentTask, [name]: value });
  }

  // Handle difficulty selection
  const handleDifficultyChange = (value: string) => {
    const difficulty = value as "Easy" | "Medium" | "Hard";
    setCurrentTask({
      ...currentTask,
      difficulty,
      xpReward: difficultyRewards[difficulty].xp,
      pointsReward: difficultyRewards[difficulty].points,
    });
  }

  // Handle date selection
  const handleDateChange = (date: Date | undefined) => {
    setCurrentTask({ ...currentTask, dueDate: date });
  }

  // Save new or edited task
  const saveTask = () => {
    if (!currentTask.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    if (isEditMode) {
      setTasks(tasks.map(t => t.id === currentTask.id ? currentTask : t));
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully",
      });
    } else {
      setTasks([...tasks, currentTask]);
      toast({
        title: "Task created",
        description: "Your new task has been created",
      });
    }

    setIsNewTaskDialogOpen(false);
  }

  // Confirm task deletion
  const confirmDelete = (taskId: string) => {
    setTaskToDelete(taskId);
    setIsDeleteConfirmOpen(true);
  }

  // Delete task
  const deleteTask = () => {
    if (taskToDelete) {
      setTasks(tasks.filter(t => t.id !== taskToDelete));
      setIsDeleteConfirmOpen(false);
      setTaskToDelete(null);
      toast({
        title: "Task deleted",
        description: "The task has been removed",
      });
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
          <CardDescription>Complete tasks to earn rewards</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={task.id}
                    checked={task.completed}
                    onCheckedChange={() => handleTaskComplete(task.id)}
                    className="data-[state=checked]:bg-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <label
                        htmlFor={task.id}
                        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                          task.completed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </label>
                      {task.difficulty && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          task.difficulty === "Easy" ? "bg-green-100 text-green-700" :
                          task.difficulty === "Medium" ? "bg-blue-100 text-blue-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {task.difficulty}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Rewards: {task.xpReward} XP, {task.pointsReward} points
                    </p>
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        Due: {format(task.dueDate, "PPP")}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {task.completed && (
                      <span className="text-xs text-primary font-medium px-2 py-1 bg-primary/10 rounded-full">
                        Completed
                      </span>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEditTaskDialog(task)}>
                      <PencilLine className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => confirmDelete(task.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-6 text-muted-foreground">
                No tasks yet. Create one to get started.
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={openNewTaskDialog} className="w-full" variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </CardFooter>
      </Card>

      {/* Task Dialog */}
      <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Task" : "Create New Task"}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Update the details of your task." 
                : "Add a new task to your list and earn rewards when you complete it."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter task title"
                value={currentTask.title}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter task description"
                value={currentTask.description || ""}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  placeholder="e.g., Programming"
                  value={currentTask.category || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select 
                  value={currentTask.difficulty || "Medium"} 
                  onValueChange={handleDifficultyChange}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !currentTask.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentTask.dueDate ? format(currentTask.dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={currentTask.dueDate}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>Rewards</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center border rounded-md p-2">
                  <span className="text-sm font-medium mr-2">XP:</span>
                  <Input
                    id="xpReward"
                    name="xpReward"
                    type="number"
                    value={currentTask.xpReward}
                    onChange={handleInputChange}
                    className="max-w-20"
                  />
                </div>
                <div className="flex items-center border rounded-md p-2">
                  <span className="text-sm font-medium mr-2">Points:</span>
                  <Input
                    id="pointsReward"
                    name="pointsReward"
                    type="number"
                    value={currentTask.pointsReward}
                    onChange={handleInputChange}
                    className="max-w-20"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooterComponent>
            <Button variant="outline" onClick={() => setIsNewTaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveTask}>{isEditMode ? "Update Task" : "Create Task"}</Button>
          </DialogFooterComponent>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteTask}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

