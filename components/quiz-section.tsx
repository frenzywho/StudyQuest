"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, FileText, PlusCircle, Timer, Trophy, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Quiz question interface
interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

// Quiz interface
interface Quiz {
  id: string
  title: string
  subject: string
  difficulty: "Easy" | "Medium" | "Hard"
  questions: QuizQuestion[]
  pointsPerQuestion: number
  timeLimit: number // in minutes
  completed?: boolean
  score?: number
  totalQuestions?: number
}

// Mock quizzes
const mockQuizzes: Quiz[] = [
  {
    id: "q1",
    title: "Algebra Fundamentals",
    subject: "Mathematics",
    difficulty: "Medium",
    pointsPerQuestion: 3,
    timeLimit: 15,
    questions: [
      {
        id: "q1-1",
        question: "Solve for x: 2x + 5 = 13",
        options: ["x = 3", "x = 4", "x = 5", "x = 6"],
        correctAnswer: 1,
        explanation: "To solve, subtract 5 from both sides: 2x = 8, then divide by 2: x = 4",
      },
      {
        id: "q1-2",
        question: "Simplify: 3(2x - 4) + 5",
        options: ["6x - 12 + 5", "6x - 7", "6x - 12", "6x + 5"],
        correctAnswer: 1,
        explanation: "Distribute 3: 3(2x - 4) = 6x - 12, then add 5: 6x - 12 + 5 = 6x - 7",
      },
      {
        id: "q1-3",
        question: "If f(x) = x² + 2x - 3, what is f(2)?",
        options: ["3", "5", "7", "9"],
        correctAnswer: 1,
        explanation: "f(2) = 2² + 2(2) - 3 = 4 + 4 - 3 = 5",
      },
      {
        id: "q1-4",
        question: "Which of the following is a factor of x² - 9?",
        options: ["x - 3", "x + 3", "Both x - 3 and x + 3", "Neither"],
        correctAnswer: 2,
        explanation: "x² - 9 is a difference of squares: x² - 9 = (x - 3)(x + 3)",
      },
      {
        id: "q1-5",
        question: "Solve the inequality: 2x - 5 > 7",
        options: ["x > 6", "x > 5", "x > 6.5", "x > 6"],
        correctAnswer: 0,
        explanation: "Add 5 to both sides: 2x > 12, then divide by 2: x > 6",
      },
    ],
    completed: false,
  },
  {
    id: "q2",
    title: "World History: Ancient Civilizations",
    subject: "History",
    difficulty: "Medium",
    pointsPerQuestion: 3,
    timeLimit: 20,
    completed: true,
    score: 12,
    totalQuestions: 15,
    questions: [],
  },
  {
    id: "q3",
    title: "Physics: Forces and Motion",
    subject: "Science",
    difficulty: "Hard",
    pointsPerQuestion: 4,
    timeLimit: 25,
    completed: false,
    questions: [],
  },
  {
    id: "q4",
    title: "Spanish Vocabulary",
    subject: "Languages",
    difficulty: "Easy",
    pointsPerQuestion: 2,
    timeLimit: 10,
    completed: true,
    score: 9,
    totalQuestions: 10,
    questions: [],
  },
]

// Quiz status interface
interface QuizStatus {
  currentQuestionIndex: number
  selectedAnswer: number | null
  isAnswerCorrect: boolean | null
  score: number
  timeRemaining: number
  isComplete: boolean
  showExplanation: boolean
  streakCount: number
}

export function QuizSection() {
  const { toast } = useToast()
  const [quizzes, setQuizzes] = useState<Quiz[]>(mockQuizzes)
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [quizStatus, setQuizStatus] = useState<QuizStatus>({
    currentQuestionIndex: 0,
    selectedAnswer: null,
    isAnswerCorrect: null,
    score: 0,
    timeRemaining: 0,
    isComplete: false,
    showExplanation: false,
    streakCount: 0,
  })
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)

  // Start a quiz
  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz)
    setQuizStatus({
      currentQuestionIndex: 0,
      selectedAnswer: null,
      isAnswerCorrect: null,
      score: 0,
      timeRemaining: quiz.timeLimit * 60, // Convert minutes to seconds
      isComplete: false,
      showExplanation: false,
      streakCount: 0,
    })

    // Start the timer
    const newTimer = setInterval(() => {
      setQuizStatus((prev) => {
        if (prev.timeRemaining <= 1) {
          clearInterval(newTimer)
          return {
            ...prev,
            timeRemaining: 0,
            isComplete: true,
          }
        }

        return { ...prev, timeRemaining: prev.timeRemaining - 1 }
      })
    }, 1000)

    setTimer(newTimer)
  }

  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [timer])

  // Handle selecting an answer
  const handleSelectAnswer = (answerIndex: number) => {
    if (quizStatus.selectedAnswer !== null || !activeQuiz) return

    const currentQuestion = activeQuiz.questions[quizStatus.currentQuestionIndex]
    const isCorrect = answerIndex === currentQuestion.correctAnswer
    const newStreakCount = isCorrect ? quizStatus.streakCount + 1 : 0

    // Calculate points (base points + streak bonus)
    let pointsEarned = isCorrect ? activeQuiz.pointsPerQuestion : 0
    if (isCorrect && newStreakCount > 1) {
      // Add streak bonus (1 bonus point per streak level, up to 3)
      pointsEarned += Math.min(newStreakCount - 1, 3)
    }

    setQuizStatus((prev) => ({
      ...prev,
      selectedAnswer: answerIndex,
      isAnswerCorrect: isCorrect,
      score: prev.score + pointsEarned,
      showExplanation: true,
      streakCount: newStreakCount,
    }))

    // Show toast for correct/incorrect
    toast({
      title: isCorrect ? "Correct!" : "Incorrect",
      description: isCorrect
        ? `+${pointsEarned} points${newStreakCount > 1 ? ` (${newStreakCount}x streak!)` : ""}`
        : "Let's review the explanation and try again!",
      variant: isCorrect ? "default" : "destructive",
      duration: 2000,
    })
  }

  // Move to next question
  const handleNextQuestion = () => {
    if (!activeQuiz) return

    const isLastQuestion = quizStatus.currentQuestionIndex === activeQuiz.questions.length - 1

    if (isLastQuestion) {
      // Quiz complete
      setQuizStatus((prev) => ({
        ...prev,
        isComplete: true,
      }))

      // Update quizzes list
      setQuizzes((prev) =>
        prev.map((q) =>
          q.id === activeQuiz.id
            ? {
                ...q,
                completed: true,
                score: quizStatus.score,
                totalQuestions: activeQuiz.questions.length,
              }
            : q,
        ),
      )

      // Clear timer
      if (timer) clearInterval(timer)

      // Show completion toast
      toast({
        title: "Quiz Completed!",
        description: `You scored ${quizStatus.score} points!`,
      })
    } else {
      // Move to next question
      setQuizStatus((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        selectedAnswer: null,
        isAnswerCorrect: null,
        showExplanation: false,
      }))
    }
  }

  // Format time remaining
  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  // Get current question
  const currentQuestion = activeQuiz ? activeQuiz.questions[quizStatus.currentQuestionIndex] : null

  return (
    <div className="space-y-4">
      {!activeQuiz ? (
        <Tabs defaultValue="available" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">Available Quizzes</TabsTrigger>
            <TabsTrigger value="completed">Completed Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {quizzes
                .filter((quiz) => !quiz.completed)
                .map((quiz) => (
                  <Card key={quiz.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        <Badge
                          variant={
                            quiz.difficulty === "Easy"
                              ? "outline"
                              : quiz.difficulty === "Medium"
                                ? "secondary"
                                : "default"
                          }
                        >
                          {quiz.difficulty}
                        </Badge>
                      </div>
                      <CardDescription>{quiz.subject}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            {quiz.questions.length} questions
                          </div>
                          <div className="flex items-center">
                            <Timer className="h-4 w-4 mr-1" />
                            {quiz.timeLimit} minutes
                          </div>
                        </div>
                        <div className="flex items-center text-sm">
                          <Trophy className="h-4 w-4 mr-1 text-amber-400" />
                          {quiz.pointsPerQuestion} points per question
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" onClick={() => startQuiz(quiz)}>
                        Start Quiz
                      </Button>
                    </CardFooter>
                  </Card>
                ))}

              <Card className="bg-muted/50 border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PlusCircle className="h-5 w-5 text-primary" />
                    Generate New Quiz
                  </CardTitle>
                  <CardDescription>Use AI to create a custom quiz</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Get personalized quizzes based on your study needs. Choose your subject, difficulty, and question
                    count.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Create Custom Quiz
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {quizzes
                .filter((quiz) => quiz.completed)
                .map((quiz) => (
                  <Card key={quiz.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        <Badge
                          variant={
                            quiz.difficulty === "Easy"
                              ? "outline"
                              : quiz.difficulty === "Medium"
                                ? "secondary"
                                : "default"
                          }
                        >
                          {quiz.difficulty}
                        </Badge>
                      </div>
                      <CardDescription>{quiz.subject}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Score</span>
                          <span className="text-sm">
                            {quiz.score} / {quiz.totalQuestions! * quiz.pointsPerQuestion} points
                          </span>
                        </div>
                        <Progress
                          value={(quiz.score! / (quiz.totalQuestions! * quiz.pointsPerQuestion)) * 100}
                          className="h-2"
                        />
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          <div>
                            Accuracy:{" "}
                            {Math.round((quiz.score! / (quiz.totalQuestions! * quiz.pointsPerQuestion)) * 100)}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        Review
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          const quizToRetake = mockQuizzes.find((q) => q.id === quiz.id)
                          if (quizToRetake) startQuiz(quizToRetake)
                        }}
                      >
                        Retake
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="md:max-w-3xl mx-auto">
          {!quizStatus.isComplete ? (
            <>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>{activeQuiz.title}</CardTitle>
                  <Badge className="ml-2">
                    <Timer className="h-4 w-4 mr-1" />
                    {formatTimeRemaining(quizStatus.timeRemaining)}
                  </Badge>
                </div>
                <CardDescription>
                  Question {quizStatus.currentQuestionIndex + 1} of {activeQuiz.questions.length}
                </CardDescription>
                <Progress
                  value={(quizStatus.currentQuestionIndex / activeQuiz.questions.length) * 100}
                  className="h-2 mt-2"
                />
              </CardHeader>
              <CardContent className="py-4">
                {currentQuestion && (
                  <div className="space-y-4">
                    <div className="text-lg font-medium">{currentQuestion.question}</div>
                    <div className="space-y-2">
                      {currentQuestion.options.map((option, index) => (
                        <Button
                          key={index}
                          variant={
                            quizStatus.selectedAnswer === index
                              ? quizStatus.isAnswerCorrect
                                ? "default"
                                : "destructive"
                              : quizStatus.selectedAnswer !== null && index === currentQuestion.correctAnswer
                                ? "default"
                                : "outline"
                          }
                          className="w-full justify-start text-left h-auto py-3 px-4"
                          onClick={() => handleSelectAnswer(index)}
                          disabled={quizStatus.selectedAnswer !== null}
                        >
                          <div className="flex items-center gap-2">
                            {quizStatus.selectedAnswer === index ? (
                              quizStatus.isAnswerCorrect ? (
                                <CheckCircle className="h-5 w-5 text-primary-foreground" />
                              ) : (
                                <X className="h-5 w-5" />
                              )
                            ) : quizStatus.selectedAnswer !== null && index === currentQuestion.correctAnswer ? (
                              <CheckCircle className="h-5 w-5 text-primary-foreground" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border border-muted-foreground flex items-center justify-center">
                                {String.fromCharCode(65 + index)}
                              </div>
                            )}
                            {option}
                          </div>
                        </Button>
                      ))}
                    </div>

                    {quizStatus.showExplanation && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <div className="font-medium mb-1">Explanation:</div>
                        <div className="text-sm">{currentQuestion.explanation}</div>
                      </div>
                    )}
                  </div>
                )}

                {quizStatus.streakCount > 1 && quizStatus.isAnswerCorrect && (
                  <div className="mt-4 flex items-center justify-center">
                    <Badge variant="outline" className="text-amber-500 border-amber-500 bg-amber-500/10">
                      <Trophy className="h-4 w-4 mr-1 text-amber-500" />
                      {quizStatus.streakCount}x Streak Bonus!
                    </Badge>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  <span className="font-medium">{quizStatus.score} points</span>
                </div>
                {quizStatus.selectedAnswer !== null && (
                  <Button onClick={handleNextQuestion}>
                    {quizStatus.currentQuestionIndex === activeQuiz.questions.length - 1
                      ? "Finish Quiz"
                      : "Next Question"}
                  </Button>
                )}
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
                <CardDescription>Congratulations on finishing the quiz</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="mb-8 flex flex-col items-center justify-center gap-2">
                  <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                    <Trophy className="h-10 w-10 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{quizStatus.score} points</div>
                  <div className="text-muted-foreground">
                    {Math.round(
                      (quizStatus.score / (activeQuiz.questions.length * activeQuiz.pointsPerQuestion)) * 100,
                    )}
                    % Score
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Accuracy</span>
                      <span>
                        {Math.round(
                          (quizStatus.score / (activeQuiz.questions.length * activeQuiz.pointsPerQuestion)) * 100,
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={(quizStatus.score / (activeQuiz.questions.length * activeQuiz.pointsPerQuestion)) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Time Used</span>
                      <span>{formatTimeRemaining(activeQuiz.timeLimit * 60 - quizStatus.timeRemaining)}</span>
                    </div>
                    <Progress
                      value={
                        ((activeQuiz.timeLimit * 60 - quizStatus.timeRemaining) / (activeQuiz.timeLimit * 60)) * 100
                      }
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => setActiveQuiz(null)}>
                  Back to Quizzes
                </Button>
                <Button onClick={() => startQuiz(activeQuiz)}>Retry Quiz</Button>
              </CardFooter>
            </>
          )}
        </Card>
      )}
    </div>
  )
}

