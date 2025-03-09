"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AlertTriangle } from "lucide-react"

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams ? searchParams.get("error") : null

  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    Signin: "Try signing in with a different account.",
    OAuthSignin: "Try signing in with a different account.",
    OAuthCallback: "Try signing in with a different account.",
    OAuthCreateAccount: "Try signing in with a different account.",
    EmailCreateAccount: "Try signing in with a different account.",
    Callback: "Try signing in with a different account.",
    OAuthAccountNotLinked: "To confirm your identity, sign in with the same account you used originally.",
    EmailSignin: "Check your email inbox for the sign-in link.",
    CredentialsSignin: "Invalid email or password. Please try again.",
    SessionRequired: "Please sign in to access this page.",
    default: "Unable to sign in. Please try again or contact support."
  };

  const errorMessage = error ? (errorMessages[error] || errorMessages.default) : errorMessages.default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We encountered a problem signing you in
          </p>
        </div>

        <div className="rounded-md bg-destructive/10 p-4">
          <div className="flex">
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-destructive">
                Error details
              </h3>
              <div className="mt-2 text-sm text-destructive/90">
                <p>{errorMessage}</p>
                {error && <p className="mt-1 text-xs opacity-70">Error code: {error}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <Link
            href="/signin"
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Return to Sign In
          </Link>
          <Link
            href="/"
            className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-foreground bg-background hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Go to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}