"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function TestAuth() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState<any>(null);

  const handleTestAuth = async () => {
    try {
      setStatus("loading");
      // Use the demo credentials
      const response = await signIn("credentials", {
        redirect: false,
        email: "demo@example.com",
        password: "password",
      });
      setResult(response);
      setStatus("complete");
    } catch (error) {
      console.error("Auth test error:", error);
      setResult({ error: String(error) });
      setStatus("error");
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Test Authentication</h1>
        <div className="mb-6">
          <button
            onClick={handleTestAuth}
            className="w-full py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            {status === "loading" ? "Testing..." : "Test Auth"}
          </button>
        </div>

        {status === "complete" && (
          <div className="mt-6 p-4 bg-gray-100 rounded overflow-auto max-h-60">
            <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 p-4 bg-red-100 text-red-700 rounded">
            <h3 className="font-bold">Error</h3>
            <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}