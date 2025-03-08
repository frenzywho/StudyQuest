import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, ImagePlus } from 'lucide-react';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const MODEL_NAME = "gemini-1.5-pro";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  image?: string;
}

const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [messages]);

  const generateAIResponse = async (prompt: string, image?: string): Promise<string> => {
    if (!GEMINI_API_KEY) throw new Error("API key is missing! Check your environment variables.");

    const requestBody: any = {
      contents: [{ parts: [{ text: prompt }] }],
    };
    
    if (image) {
      requestBody.contents[0].parts.push({ inline_data: { mime_type: "image/png", data: image.split(',')[1] } });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await convertToBase64(file);
      setSelectedImage(base64);
      fileInputRef.current!.value = '';
    } catch (error) {
      console.error('Error converting image:', error);
      setError('Failed to process image. Please try again.');
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!input.trim() && !selectedImage) return;
    setIsLoading(true);
    setError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
      image: selectedImage || undefined,
    };
    setMessages((prev) => [...prev, userMessage]);

    setInput('');
    setSelectedImage(null);

    try {
      const aiResponse = await generateAIResponse(input, userMessage.image);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), type: 'ai', content: aiResponse, timestamp: new Date() },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#121212] rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-semibold text-white">AI Assistant</h1>
        </div>

        <div ref={chatContainerRef} className="h-[500px] overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
              <div className={`max-w-[80%] rounded-lg p-4 ${message.type === 'user' ? 'bg-purple-600 text-white' : 'bg-[#1a1a1a] text-gray-100 border border-gray-700'}`}>
                {message.image && <img src={message.image} alt="Uploaded content" className="max-w-full h-auto rounded-lg mb-2" />}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-purple-200' : 'text-gray-400'}`}>{message.timestamp.toLocaleTimeString()}</div>
              </div>
            </div>
          ))}

          {isLoading && <div className="text-center text-purple-500 animate-pulse">Thinking...</div>}
          {error && <div className="bg-red-900/20 border border-red-500 text-red-500 p-3 rounded-lg">{error}</div>}
        </div>

        <div className="p-4 border-t border-gray-800">
          {selectedImage && (
            <div className="mb-2 relative">
              <img src={selectedImage} alt="Selected" className="max-h-32 rounded-lg" />
              <button onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">×</button>
            </div>
          )}
          <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg p-2">
            <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="p-2 text-gray-400 hover:text-purple-500">
              <ImagePlus size={20} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" disabled={isLoading} />
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..." className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none" rows={1} disabled={isLoading} />
            <button onClick={handleSubmit} disabled={isLoading || (!input.trim() && !selectedImage)} className="p-2 bg-purple-600 text-white rounded-lg">
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
