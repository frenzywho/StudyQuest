"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
  level: number
  xp: number
  points: number
  avatarUrl: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading user from local storage
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    // Mock user for demo purposes
    if (!storedUser) {
      const mockUser = {
        id: "user-1",
        name: "Alex Student",
        email: "alex@example.com",
        level: 5,
        xp: 350,
        points: 275,
        avatarUrl: "/placeholder.svg?height=40&width=40",
      }
      setUser(mockUser)
      localStorage.setItem("user", JSON.stringify(mockUser))
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    // Mock login for demo
    const mockUser = {
      id: "user-1",
      name: "Alex Student",
      email,
      level: 5,
      xp: 350,
      points: 275,
      avatarUrl: "/placeholder.svg?height=40&width=40",
    }

    setUser(mockUser)
    localStorage.setItem("user", JSON.stringify(mockUser))
    setIsLoading(false)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

