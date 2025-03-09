import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.0-flash";

export async function POST(request: Request) {
  try {
    if (!GEMINI_API_KEY) {
      console.error("Missing Gemini API key");
      return NextResponse.json(
        { error: "API key is not configured" },
        { status: 500 }
      );
    }

    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return NextResponse.json(
        { error: "Invalid JSON in request" },
        { status: 400 }
      );
    }

    const { prompt, imageData, isTitleGeneration = false } = body;
    
    if (!prompt && !imageData) {
      return NextResponse.json(
        { error: "Prompt or image data is required" },
        { status: 400 }
      );
    }
    
    // For title generation, use a simplified request body to ensure fast response
    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      // For title generation, use more direct generation settings
      generationConfig: isTitleGeneration ? {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 60, // Limit token output for titles
        responseMimeType: "text/plain",
      } : undefined
    };

    // Only add image if it's provided and valid and we're not generating a title
    if (!isTitleGeneration && imageData && typeof imageData === 'string' && imageData.startsWith('data:image/')) {
      try {
        // Extract the base64 part
        const base64Data = imageData.split(',')[1];
        const mimeType = imageData.split(';')[0].split(':')[1];
        
        if (base64Data) {
          // Add the image to the parts
          requestBody.contents[0].parts.push({
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          } as any);
        }
      } catch (e) {
        console.error("Error processing image data:", e);
      }
    }

    console.log(`Sending ${isTitleGeneration ? 'title generation' : 'regular'} request to Gemini API`);
    
    try {
      // Make the API call with a timeout
      const controller = new AbortController();
      // Use a shorter timeout for title generation
      const timeoutMs = isTitleGeneration ? 5000 : 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Handle non-200 responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error ${response.status}:`, errorText);
        
        return NextResponse.json(
          { error: `API error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }
      
      // Parse successful response
      const responseData = await response.json();
      
      // Extract the generated text - adjust path based on actual response structure
      const generatedText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        console.error("No text in response:", JSON.stringify(responseData).substring(0, 200));
        return NextResponse.json(
          { error: "The AI model did not return any text" },
          { status: 500 }
        );
      }
      
      // For title generation, post-process to clean up the title
      if (isTitleGeneration) {
        let cleanTitle = generatedText
          .replace(/^["']|["']$/g, '') // Remove quotes
          .replace(/^Title: |^Conversation Title: |^Suggested Title: /gi, '') // Remove common prefixes
          .trim();
          
        return NextResponse.json({ text: cleanTitle });
      }
      
      // Success - return the generated text
      return NextResponse.json({ text: generatedText });
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { error: "Request timed out. The API took too long to respond." },
          { status: 504 }
        );
      }
      
      console.error("Error calling Gemini API:", error);
      return NextResponse.json(
        { error: `API request failed: ${error instanceof Error ? error.message : String(error)}` },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Unhandled error in generateResponse:", error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}