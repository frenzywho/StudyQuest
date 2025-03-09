import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"
import { Header } from "@/components/header"
import { validateEnv } from '@/lib/env';
import ErrorBoundary from "@/components/error-boundary";
import { Providers } from "./providers";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Validate environment variables at app startup
if (typeof window === 'undefined') {
  validateEnv();
}

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StudyQuest - Gamified Learning Platform",
  description: "Learn through gamification and AI-powered assistance",
  generator: 'Akatsuki'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <Providers>
              <ErrorBoundary>
                <div className="min-h-screen bg-background">
                  <Header />
                  <main>{children}</main>
                  <Toaster />
                </div>
              </ErrorBoundary>
              <ToastContainer 
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
              />
            </Providers>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}