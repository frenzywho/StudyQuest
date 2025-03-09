"use client";

import { useState, useEffect } from "react";

export default function DebugPage() {
  const [status, setStatus] = useState<string>("Checking...");
  const [errors, setErrors] = useState<string[]>([]);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if the API is reachable
        const response = await fetch("/api/auth/session");
        
        if (response.ok) {
          setStatus("Auth API is working");
          const data = await response.json();
          console.log("Session data:", data);
        } else {
          setStatus(`Auth API returned status: ${response.status}`);
          setErrors(prev => [...prev, `Auth API error: ${response.status} ${response.statusText}`]);
        }
      } catch (error) {
        setStatus("Auth API is not reachable");
        setErrors(prev => [...prev, `Error: ${error instanceof Error ? error.message : String(error)}`]);
      }
    };
    
    checkAuth();
  }, []);
  
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Debug Page</h1>
      
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Auth API Status</h2>
        <p className={status.includes("working") ? "text-green-500" : "text-red-500"}>
          {status}
        </p>
      </div>
      
      {errors.length > 0 && (
        <div className="mb-8 p-4 border border-red-300 bg-red-50 rounded">
          <h2 className="text-xl font-semibold mb-2 text-red-700">Errors</h2>
          <ul className="list-disc pl-5">
            {errors.map((error, idx) => (
              <li key={idx} className="text-red-600">{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Environment</h2>
        <p>NODE_ENV: {process.env.NODE_ENV}</p>
        <p>NEXT_PUBLIC_VERCEL_ENV: {process.env.NEXT_PUBLIC_VERCEL_ENV || "Not set"}</p>
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={() => window.location.href = "/"}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Go Home
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}