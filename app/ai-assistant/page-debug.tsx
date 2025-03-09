"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function AiAssistantDebugPage() {
  const { data: session, status } = useSession();
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">AI Assistant Debug Page</h1>
      
      <div className="mb-4 p-4 border rounded">
        <h2 className="font-bold">Session Status: {status}</h2>
        <p>Time elapsed: {timeElapsed} seconds</p>
      </div>
      
      <div className="mb-4 p-4 border rounded">
        <h2 className="font-bold">Session Data:</h2>
        <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded mt-2">
          {JSON.stringify(session, null, 2) || "No session data"}
        </pre>
      </div>
      
      <div className="flex gap-4">
        <a href="/signin" className="px-4 py-2 bg-blue-500 text-white rounded">Go to Sign In</a>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}