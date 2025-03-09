"use client"

import { SessionProvider } from "next-auth/react"
import { AuthProvider as CustomAuthProvider } from "@/contexts/auth-context"

// This component should only provide the authentication context,
// not export a useAuth hook
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CustomAuthProvider>
        {children}
      </CustomAuthProvider>
    </SessionProvider>
  )
}

// Do NOT export useAuth from here

