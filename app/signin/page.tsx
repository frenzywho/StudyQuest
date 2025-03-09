"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy } from "lucide-react"

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      console.error("Sign-in error:", error)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">StudyQuest</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue your learning journey</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
          
          <div className="relative my-4 px-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <div className="px-6 pb-4 grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => signIn('github')}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.477 2 2 6.477 2 12C2 16.418 4.865 20.166 8.839 21.489C9.339 21.581 9.521 21.272 9.521 21.007C9.521 20.77 9.514 20.14 9.51 19.271C6.73 19.914 6.139 17.967 6.139 17.967C5.685 16.801 5.028 16.493 5.028 16.493C4.132 15.863 5.097 15.876 5.097 15.876C6.094 15.945 6.628 16.914 6.628 16.914C7.521 18.49 8.97 18.014 9.54 17.757C9.63 17.093 9.89 16.617 10.18 16.374C7.955 16.128 5.62 15.272 5.62 11.449C5.62 10.302 6.01 9.364 6.649 8.631C6.539 8.378 6.199 7.362 6.747 6.027C6.747 6.027 7.586 5.76 9.497 7.013C10.3 6.791 11.15 6.68 12 6.675C12.85 6.68 13.7 6.791 14.503 7.013C16.414 5.759 17.251 6.027 17.251 6.027C17.801 7.363 17.461 8.379 17.351 8.631C17.991 9.364 18.38 10.302 18.38 11.449C18.38 15.283 16.042 16.125 13.81 16.366C14.17 16.667 14.5 17.264 14.5 18.179C14.5 19.477 14.488 20.676 14.488 21.007C14.488 21.275 14.668 21.587 15.176 21.486C19.146 20.159 22 16.415 22 12C22 6.477 17.523 2 12 2Z"></path>
              </svg>
              GitHub
            </Button>
            
            <Button variant="outline" onClick={() => signIn('google')}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" fill="#4285F4"></path>
                <path d="M4.17 12.958l-.667 2.504-2.44.052a8.943 8.943 0 0 1-.064-8.329l2.172.4.95 2.162a5.314 5.314 0 0 0 .05 3.211" fill="#FBBC05"></path>
                <path d="M12.207 4.448a5.132 5.132 0 0 1 3.013 1.058l2.289-2.29a8.932 8.932 0 0 0-14.02 2.653l3.122 2.42c.782-2.305 2.932-3.841 5.596-3.841z" fill="#EA4335"></path>
                <path d="M12.207 16.811c-2.665 0-4.814-1.536-5.595-3.841l-3.122 2.42a8.927 8.927 0 0 0 8.717 6.07c2.275 0 4.43-.761 6.078-2.18l-2.917-2.258c-.81.54-1.843.789-3.16.789z" fill="#34A853"></path>
              </svg>
              Google
            </Button>
          </div>
          
          <CardFooter className="flex flex-col space-y-2 border-t pt-6">
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </div>
            
            <div className="text-center text-xs text-muted-foreground">
              For testing, use: demo@example.com / password
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}