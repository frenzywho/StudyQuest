"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function TestPage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">NextAuth Test Page</h1>
        
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
          <h2 className="font-medium">Session Status: {status}</h2>
        </div>
        
        {session && (
          <div className="mb-6 p-3 bg-green-100 dark:bg-green-900 rounded">
            <h2 className="font-medium mb-2">Session Data:</h2>
            <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="flex gap-2 mt-4">
          <Link 
            href="/"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Home
          </Link>
          
          <Link 
            href="/signin"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}