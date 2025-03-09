"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, ImagePlus, Plus, MessageSquare, Menu, X, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react'; // Assuming you use next-auth
import { DefaultSession, Session } from 'next-auth';

interface Conversation {
  _id: string;
  title: string;
  userId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// Existing Message interface
interface MessagePart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

interface ContentPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

interface Part {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

interface Part {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

interface RequestBody {
  contents: {
    parts: Part[];
  }[];
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  image?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.0-flash";

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      xp?: number;
      level?: number;
      points?: number;
    } & DefaultSession['user'];
  }
}

const AiAssistant: React.FC = () => {
    const { data: session, status } = useSession();
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  
  // Add timeout effect to prevent infinite loading
  useEffect(() => {
    // Set a timeout to stop showing the loading spinner after 5 seconds
    const timeoutId = setTimeout(() => {
      if (status === "loading") {
        setIsSessionLoading(false);
        console.log("Session loading timed out");
      }
    }, 5000);
    
    // If session status changes before timeout, clear the timeout
    if (status !== "loading") {
      setIsSessionLoading(false);
    }
    
    return () => clearTimeout(timeoutId);
  }, [status]);
  
  // Show loading spinner only if we're truly waiting for the session
  if (status === "loading" && isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  // Show sign-in message if not authenticated
  if (status === "unauthenticated" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center p-8 rounded-xl shadow-xl max-w-md backdrop-blur-md border border-purple-300">
          <h2 className="text-2xl font-bold mb-4">Sign in Required</h2>
          <p className="mb-6">Please sign in to use the AI Assistant</p>
          <a
            href="/signin"
            className="px-6 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700"
          >
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  // Safe access to userId with fallback
  const userId = session?.user?.id || '';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // New state for conversations and sidebar
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start closed on mobile
  const [isMobile, setIsMobile] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  // Add these state variables inside your component
  const [retryCount, setRetryCount] = useState(0);
  const [requestQueue, setRequestQueue] = useState<{prompt: string, image?: string}[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds
  
  // Check screen size for responsive design
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Fetch conversations on component mount
  useEffect(() => {
    if (session?.user) {
      // Ensure user exists in database before doing anything else
      fetch('/api/users/create', { method: 'POST' })
        .then(resp => resp.json())
        .then(data => {
          console.log("User check/create result:", data);
          // Now that we know the user exists, fetch conversations
          fetchConversations();
        })
        .catch(err => {
          console.error("Error ensuring user exists:", err);
        });
    }
  }, [session]);
  
  // Update the fetchConversations function with better error handling:

const fetchConversations = async () => {
  if (!session?.user?.id) return;

  try {
    setIsLoadingConversations(true);
    const response = await fetch(`/api/conversations/get?userId=${encodeURIComponent(session.user.id)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch conversations:", response.status, errorText);
      return;
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.length} conversations`);
    setConversations(data);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    toast.error("Failed to load your conversations");
  } finally {
    setIsLoadingConversations(false);
  }
};
  
  const createNewConversation = async () => {
    setMessages([]);
    setActiveConversationId(null);
  };
  
  const selectConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/getById?id=${conversationId}`);
      if (!response.ok) throw new Error('Failed to fetch conversation');
      const conversation = await response.json();
      
      // Convert message format if needed
      const formattedMessages = conversation.messages.map((msg: any) => ({
        id: msg.id || Math.random().toString(36).substr(2, 9),
        type: msg.type,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        image: msg.image
      }));
      
      setMessages(formattedMessages);
      setActiveConversationId(conversationId);
      
      // Auto-close sidebar on mobile after selecting conversation
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError('Failed to load conversation');
    }
  };
  
  // Save conversation to database
const saveConversation = async (newMessages: Message[]) => {
  if (!session?.user?.id) {
    console.log("No user session, can't save conversation");
    return;
  }
  
  try {
    // First, check if we already have a conversation
    let title = "New Conversation";
    
    if (activeConversationId) {
      // For existing conversations, try to preserve the title
      const existingConversation = conversations.find(c => c._id === activeConversationId);
      if (existingConversation) {
        title = existingConversation.title;
      }
    } else if (newMessages.length >= 2) {
      // For new conversations with enough messages, generate an AI title
      title = await generateConversationTitle(newMessages);
    }

    // Clean and format messages for saving
    const formattedMessages = newMessages.map(msg => ({
      id: msg.id,
      type: msg.type,
      content: msg.content,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : new Date().toISOString(),
      image: msg.image || undefined
    }));
    
    // Prepare payload
    const payload: {
      userId: string;
      title: string;
      messages: {
        id: string;
        type: 'user' | 'ai';
        content: string;
        timestamp: string;
        image?: string;
      }[];
      conversationId?: string;
    } = {
      userId: session.user.id,
      title: title,
      messages: formattedMessages,
    };

    // Only include conversationId if we have a valid one
    if (activeConversationId && activeConversationId.trim() !== '') {
      payload.conversationId = activeConversationId;
      console.log("Updating existing conversation:", activeConversationId, "with title:", title);
    } else {
      console.log("Creating new conversation with title:", title);
    }

    // Send the request to save conversation
    const response = await fetch('/api/conversations/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    // Rest of your existing code for handling the response...
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to save conversation: ${response.status} - ${errorText}`);
      
      // For new conversations, don't try to create again - the error is likely something else
      if (!activeConversationId) {
        throw new Error(`Failed to create conversation: ${response.status}`);
      }
      
      // If we got a 404 and were trying to update an existing conversation,
      // create a new one instead
      if (response.status === 404) {
        console.log("Conversation not found, creating new one instead");
        
        // Create a new payload without the conversationId
        const newPayload = { ...payload };
        delete newPayload.conversationId;
        
        const retryResponse = await fetch('/api/conversations/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPayload)
        });
        
        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text();
          console.error(`Retry failed: ${retryResponse.status} - ${retryErrorText}`);
          throw new Error(`Failed to save conversation: ${retryResponse.status}`);
        }
        
        const savedConversation = await retryResponse.json();
        console.log("New conversation created:", savedConversation._id);
        
        // Update the active conversation ID
        setActiveConversationId(savedConversation._id);
        
        // Refresh conversation list
        fetchConversations();
        
        return;
      }
      
      throw new Error(`Failed to save conversation: ${response.status}`);
    }
    
    // Parse the response
    const savedConversation = await response.json();
    console.log("Conversation saved successfully:", savedConversation._id);
    
    // Update active conversation ID for new conversations
    if (!activeConversationId && savedConversation._id) {
      setActiveConversationId(savedConversation._id);
      console.log("Setting active conversation ID to:", savedConversation._id);
    }
    
    // Refresh conversation list
    fetchConversations();
    
  } catch (err) {
    console.error('Error saving conversation:', err);
    // Don't throw the error again, just log it to prevent UI disruption
    toast.error("Your message was sent but couldn't be saved for later. You can continue chatting.");
  }
};
  
  // Add this function to process the queue
  const processQueue = useCallback(async () => {
    if (requestQueue.length === 0 || isProcessingQueue) return;
    
    setIsProcessingQueue(true);
    const request = requestQueue[0];
    
    try {
      // Get the last message that was added to display "thinking..." while we process
      const currentMessages = [...messages];
      const userMessageIndex = currentMessages.length - 1;
      
      // Call the API
      console.log("Processing queued request...");
      const response = await fetch('/api/generateResponse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: request.prompt, 
          imageData: request.image,
          history: currentMessages.slice(0, userMessageIndex) // Send previous messages as context
        })
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        console.error("API error response:", errorData);
        
        // For rate limiting errors
        if (response.status === 429) {
          if (retryCount < MAX_RETRIES) {
            console.log(`Rate limited. Retry attempt ${retryCount + 1} in ${RETRY_DELAY}ms`);
            setRetryCount(prev => prev + 1);
            
            // Wait and then try again with the same request
            setTimeout(() => {
              setIsProcessingQueue(false);
              processQueue();
            }, RETRY_DELAY * (retryCount + 1)); // Exponential backoff
            
            return;
          } else {
            throw new Error("Rate limit exceeded after multiple retries. Please try again later.");
          }
        } else {
          throw new Error(`Failed to generate response: ${response.status}`);
        }
      }
  
      const data = await response.json();
      console.log("API response received");
  
      if (!data.text) {
        throw new Error("No text in response");
      }
  
      // Reset retry count on success
      setRetryCount(0);
  
      const aiMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'ai',
        content: data.text,
        timestamp: new Date()
      };
  
      // Add AI response to messages
      const updatedMessages = [...currentMessages, aiMessage];
      setMessages(updatedMessages);
  
      // Try to save the conversation after getting AI response
      await saveConversation(updatedMessages);
  
      // Remove the processed request from queue
      setRequestQueue(prev => prev.slice(1));
      
    } catch (err) {
      console.error('Error generating response:', err);
      setError(`Failed to get response from AI assistant: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // If we hit a fatal error, clear the queue
      if (retryCount >= MAX_RETRIES) {
        setRequestQueue([]);
      }
    } finally {
      setIsProcessingQueue(false);
    }
  }, [messages, requestQueue, retryCount, isProcessingQueue, saveConversation]);
  
  // Add this effect to process the queue
  useEffect(() => {
    if (requestQueue.length > 0 && !isProcessingQueue) {
      processQueue();
    }
  }, [requestQueue, isProcessingQueue, processQueue]);

  // Update the handleSubmit function
const handleSubmit = async () => {
  if (isLoading || (!input.trim() && !selectedImage)) return;

  // Validate we have some actual content to send
  if (!input.trim() && !selectedImage) {
    toast.error("Please enter a message or upload an image.");
    return;
  }

  // Log current conversation state
  console.log("Current conversationId:", activeConversationId); 

  const userMessage: Message = {
    id: Math.random().toString(36).substr(2, 9),
    type: 'user',
    content: input.trim() || "Image analysis request",
    timestamp: new Date(),
    image: selectedImage || undefined
  };

  // Add user message to the chat
  const newMessages = [...messages, userMessage];
  setMessages(newMessages);
  setInput('');
  setSelectedImage(null);
  setIsLoading(true);
  setError(null); // Reset error state

  // Scroll to bottom
  setTimeout(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, 100);

  try {
    // Call the API endpoint
    const response = await fetch('/api/generateResponse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: userMessage.content, 
        imageData: userMessage.image
      })
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || "Failed to get response from AI assistant";
      } catch (e) {
        // If we can't parse the error as JSON, use response status
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    // Parse successful response
    const data = await response.json();
    
    if (!data.text) {
      throw new Error("No response text received from AI assistant");
    }

    // Create AI response message
    const aiMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'ai',
      content: data.text,
      timestamp: new Date()
    };

    // Add AI response to messages
    const updatedMessages = [...newMessages, aiMessage];
    setMessages(updatedMessages);

    // Try to save the conversation after getting AI response
    await saveConversation(updatedMessages);
    console.log("After save, conversationId:", activeConversationId);

  } catch (err) {
    console.error('Error generating response:', err);
    setError(`${err instanceof Error ? err.message : 'Unknown error'}`);
  } finally {
    setIsLoading(false);
    
    // Scroll to bottom again after response or error
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  }
};
  
  // Keep your existing code for handling image change, input change, etc...

  // Check if dark mode is active
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    typeof window !== 'undefined' ? 
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches : 
    false
  );
  
  // Update dark mode state when system preference changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, []);

  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [messages]);

  // Add this function to your AiAssistant component
const generateConversationTitle = async (messages: Message[]): Promise<string> => {
  try {
    // Filter to just the first few messages (to keep the request small)
    const limitedMessages = messages.slice(0, Math.min(5, messages.length));
    
    // Create a summary of the conversation content
    const conversationContent = limitedMessages.map(msg => {
      return `${msg.type === 'user' ? 'User' : 'AI'}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`;
    }).join('\n');
    
    // Create a prompt to generate a title
    const titlePrompt = `Based on this conversation, generate a concise and descriptive title (max 40 characters):\n\n${conversationContent}`;
    
    console.log("Generating title for conversation...");
    
    const response = await fetch('/api/generateResponse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: titlePrompt,
        isTitleGeneration: true // Flag to indicate this is for title generation
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate title: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Clean up the title - remove quotes if present and trim whitespace
    let title = data.text || "New Conversation";
    title = title.replace(/^["']|["']$/g, '').trim();
    
    // Keep title length reasonable
    if (title.length > 50) {
      title = title.substring(0, 47) + "...";
    }
    
    console.log("Generated title:", title);
    return title;
    
  } catch (error) {
    console.error("Error generating conversation title:", error);
    
    // Fall back to using the first user message
    const firstUserMessage = messages.find(m => m.type === 'user');
    if (firstUserMessage) {
      const title = firstUserMessage.content.length > 30 
        ? `${firstUserMessage.content.substring(0, 27)}...` 
        : firstUserMessage.content;
      return title;
    }
    
    return "New Conversation";
  }
};

  // Add this effect to auto-resize the textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set the height to match the content (plus a small buffer)
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse {
        0% {
          box-shadow: 0 0 20px 5px rgba(139, 92, 246, 0), 0 10px 40px rgba(124, 58, 237, 0.25);
        }
        100% {
          box-shadow: 0 0 25px 8px rgba(139, 92, 246, 0.2), 0 10px 40px rgba(124, 58, 237, 0.25);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fix the image handling in generateAIResponse function
const generateAIResponse = async (prompt: string, image?: string): Promise<string> => {
  if (!GEMINI_API_KEY) throw new Error("API key is missing");

  const requestBody: RequestBody = {
    contents: [
      {
        parts: [
          { text: prompt || "Describe this image" } as Part
        ]
      }
    ]
  };
  
  if (image) {
    try {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      
      if (base64Data && mimeType) {
        // This is the correct format for inline images with Gemini
        requestBody.contents[0].parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        });
      }
    } catch (e) {
      console.error("Could not process image data:", e);
    }
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
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

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      // Check file size (limit to 4MB)
      if (files[0].size > 4 * 1024 * 1024) {
        toast.error("Image is too large. Please select an image under 4MB.");
        return;
      }
      
      // Check file type
      if (!files[0].type.startsWith('image/')) {
        toast.error("Only image files are supported.");
        return;
      }
      
      const base64 = await convertToBase64(files[0]);
      setSelectedImage(base64);
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process the selected image.");
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Update the deleteConversation function
const deleteConversation = async (id: string) => {
  if (!id || !session?.user?.id) return;
  
  try {
    console.log(`Deleting conversation: ${id}`);
    
    // Show confirmation dialog
    if (!confirm("Are you sure you want to delete this conversation?")) {
      return;
    }
    
    setIsLoading(true);
    
    const response = await fetch('/api/conversations/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: id })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to delete conversation: ${response.status} - ${errorText}`);
      throw new Error(`Failed to delete conversation: ${response.status}`);
    }
    
    // Success - update UI
    console.log('Conversation deleted successfully');
    
    // Remove from conversations list
    setConversations(prev => prev.filter(conv => conv._id !== id));
    
    // If the deleted conversation was the active one, clear the chat
    if (id === activeConversationId) {
      setActiveConversationId('');
      setMessages([]);
    }
    
    // Show success notification
    toast.success("Conversation deleted successfully");
    
  } catch (error) {
    console.error('Error deleting conversation:', error);
    toast.error("Failed to delete conversation");
  } finally {
    setIsLoading(false);
  }
};

  // Add or update this function
const fetchConversation = async (id: string) => {
  try {
    setIsLoading(true);
    const response = await fetch(`/api/conversations/getById?id=${encodeURIComponent(id)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch conversation ${id}:`, response.status, errorText);
      throw new Error("Could not load conversation");
    }
    
    const data = await response.json();
    console.log("Fetched conversation:", data._id);
    
    if (!data.messages || !Array.isArray(data.messages)) {
      throw new Error("Invalid conversation format");
    }
    
    // Set the conversation data
    setActiveConversationId(data._id);
    setMessages(data.messages);
  } catch (error) {
    console.error("Error loading conversation:", error);
    toast.error("Failed to load conversation");
  } finally {
    setIsLoading(false);
  }
};

// Add this effect to check API key at component initialization
useEffect(() => {
  // Test the API key validity on component mount
  const testApiKey = async () => {
    try {
      const response = await fetch('/api/generateResponse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: "Hello, this is a test to verify the API key is working."
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 401 || 
            (errorData.error && errorData.error.includes("API key"))) {
          console.error("API key validation failed:", errorData.error);
          toast.error("API key is invalid or has usage limits. Check your configuration.", {
            autoClose: false
          });
        }
      } else {
        console.log("API key validation successful");
      }
    } catch (error) {
      console.error("Error testing API key:", error);
    }
  };
  
  if (session?.user) {
    testApiKey();
  }
}, [session]);

// Update the ConversationItem component
const ConversationItem = ({ 
  conversation, 
  active, 
  onClick, 
  onDelete,
  onRename 
}: { 
  conversation: Conversation; 
  active: boolean; 
  onClick: (id: string) => void; 
  onDelete: (id: string) => void; 
  onRename: (id: string) => void; 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Close the menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);
  
  return (
    <div 
      className={`flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${
        active ? 'bg-gray-100 dark:bg-gray-800' : ''
      }`}
    >
      <div 
        className="flex-1 truncate mr-2"
        onClick={() => onClick(conversation._id)}
        title={conversation.title || 'Untitled Conversation'}
      >
        {conversation.title || 'Untitled Conversation'}
      </div>
      
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          aria-label="Conversation options"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
          </svg>
        </button>
        
        {isMenuOpen && (
          <div 
            className="absolute right-0 z-10 mt-1 w-48 origin-top-right rounded-md bg-white dark:bg-gray-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            role="menu"
          >
            <div className="py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsMenuOpen(false);
                  onRename(conversation._id);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                role="menuitem"
              >
                Regenerate title
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsMenuOpen(false);
                  onDelete(conversation._id);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                role="menuitem"
              >
                Delete conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Fix the renameConversation function toast notifications
const renameConversation = async (id: string, newTitle?: string) => {
  if (!id || !session?.user?.id) return;
  
  try {
    setIsLoading(true);
    
    // If no title provided, generate one from the conversation
    if (!newTitle) {
      // Find the conversation
      const conversation = conversations.find(c => c._id === id);
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      
      // Convert message timestamps to Date objects if they aren't already
      const formattedMessages = conversation.messages.map(msg => ({
        ...msg,
        timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
      }));
      
      // Generate a new title
      newTitle = await generateConversationTitle(formattedMessages);
    }
    
    // Call the API to update just the title
    const response = await fetch('/api/conversations/updateTitle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: id,
        title: newTitle
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to rename conversation: ${response.status}`, errorText);
      throw new Error(`Failed to rename conversation: ${response.status}`);
    }
    
    // Update the conversations list with the new title
    setConversations(prev => prev.map(conv => 
      conv._id === id ? { ...conv, title: newTitle! } : conv
    ));
    
    toast.success("Conversation renamed successfully");
    
  } catch (error) {
    console.error('Error renaming conversation:', error);
    toast.error("Failed to rename conversation");
  } finally {
    setIsLoading(false);
  }
};

// Add these to your AI Assistant component
console.log("AI Assistant rendering, status:", status);
console.log("Session:", session);

useEffect(() => {
  console.log("Status changed to:", status);
  console.log("Session is now:", session);
}, [status, session]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex rounded-xl overflow-hidden">
        {/* Conversation History Sidebar */}
        <div 
          className={`${isSidebarOpen ? 'flex' : 'hidden'} md:flex flex-col w-64 h-[600px] bg-white/30 dark:bg-slate-900/30 backdrop-blur-md border-r border-purple-300 dark:border-purple-600 transition-all duration-300`}
          style={{
            backgroundColor: 'rgba(124, 58, 237, 0.08)',
            backgroundImage: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.2) 100%)',
            boxShadow: '0 0 20px 5px rgba(139, 92, 246, 0.4), 0 10px 40px rgba(124, 58, 237, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
            animation: 'pulse 3s infinite alternate'
          }}
        >
          <div className="p-4 border-b border-purple-300/50 dark:border-purple-600/50 backdrop-blur-md bg-gradient-to-r from-purple-500/10 to-violet-500/10 dark:from-purple-800/20 dark:to-violet-900/20 flex justify-between items-center">
            <h2 className="font-semibold text-purple-900 dark:text-purple-100">Conversations</h2>
            <button 
              onClick={createNewConversation}
              className="p-1 rounded-md text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv._id}
                  conversation={conv}
                  active={conv._id === activeConversationId}
                  onClick={() => selectConversation(conv._id)}
                  onDelete={deleteConversation}
                  onRename={renameConversation}
                />
              ))
            ) : (
              <div className="text-center p-4 text-gray-500 dark:text-gray-400 text-sm">
                No conversation history
              </div>
            )}
          </div>
        </div>
        
        {/* Main AI Assistant Window */}
        <div 
          className="flex-1 flex flex-col rounded-xl shadow-xl overflow-hidden backdrop-blur-md border border-purple-300 dark:border-purple-600"
          style={{
            backgroundColor: 'rgba(124, 58, 237, 0.08)',
            backgroundImage: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.2) 100%)',
            boxShadow: '0 0 20px 5px rgba(139, 92, 246, 0.4), 0 10px 40px rgba(124, 58, 237, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
            animation: 'pulse 3s infinite alternate'
          }}
        >
          <div className="p-4 border-b border-purple-300/50 dark:border-purple-600/50 backdrop-blur-md bg-gradient-to-r from-purple-500/10 to-violet-500/10 dark:from-purple-800/20 dark:to-violet-900/20 flex items-center">
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="mr-3 text-purple-600 dark:text-purple-400"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
            <h1 className="text-xl font-semibold text-purple-900 dark:text-purple-100">AI Assistant</h1>
          </div>

          {/* Rest of your existing AI Assistant component */}
          <div 
            ref={chatContainerRef} 
            className="flex-1 h-[500px] overflow-y-auto p-4 space-y-4 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md"
            style={{
              backgroundImage: 'linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.1) 100%)'
            }}
          >
            {/* Your existing message display code */}
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="h-20 w-20 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-4">
                  <MessageSquare size={32} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-medium text-purple-900 dark:text-purple-100 mb-2">How can I help you today?</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                  Ask me anything! I'm here to answer your questions, help with coding, provide information, or just chat.
                </p>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                <div 
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white' 
                      : 'bg-white/70 dark:bg-slate-800/70 border border-purple-200 dark:border-purple-800'
                  } backdrop-blur-sm`}
                >
                  {message.image && <img src={message.image} alt="Uploaded content" className="max-w-full h-auto rounded-lg mb-2" />}
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-purple-200' : 'text-gray-500 dark:text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && <div className="text-center animate-pulse text-purple-600 dark:text-purple-400">Thinking...</div>}
            {error && <div className="p-3 rounded-lg bg-red-100/70 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 backdrop-blur-sm">{error}</div>}
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-purple-300/50 dark:border-purple-600/50 bg-gradient-to-b from-purple-50/40 to-violet-100/30 dark:from-purple-900/20 dark:to-violet-900/30 backdrop-blur-md">
            {selectedImage && (
              <div className="mb-2 relative">
                <img src={selectedImage} alt="Selected" className="max-h-32 rounded-lg shadow-md" />
                <button onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 rounded-full p-1 bg-red-500 text-white hover:bg-red-600 transition-colors">×</button>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-lg p-2 bg-white/70 dark:bg-purple-950/40 backdrop-blur-md border border-purple-200 dark:border-purple-700 shadow-inner">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isLoading} 
                className="p-2 text-purple-600 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 transition-colors"
              >
                <ImagePlus size={20} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" disabled={isLoading} />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 resize-none bg-transparent focus:outline-none text-slate-900 dark:text-slate-100"
                style={{ minHeight: '36px', maxHeight: '200px', overflowY: 'auto' }}
                disabled={isLoading}
              />
              <button 
                onClick={handleSubmit} 
                disabled={isLoading || (!input.trim() && !selectedImage)} 
                className={`p-2 rounded-lg transition-colors ${
                  isLoading || (!input.trim() && !selectedImage)
                    ? 'bg-purple-400/50 text-white/70 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700 shadow-md hover:shadow-lg'
                }`}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;