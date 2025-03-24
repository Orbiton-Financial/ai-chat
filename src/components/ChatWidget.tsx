"use client";

import React, { useState, useRef, useEffect, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, ChevronDown } from "lucide-react";
import { v4 as uuidv4 } from "uuid"; // For generating user IDs

interface Message {
  role: string;
  content: string;
}

interface ChatWidgetProps {
  onClose: () => void;
  initialQuestion: string;
}

/** Remove citations like 【6:0†source】 */
function removeCitations(str: string) {
  return str.replace(/【[^】]+】/g, "");
}

/** Convert any **text** into <strong>text</strong>. */
function parseBold(str: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.slice(lastIndex, match.index));
    }
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    parts.push(str.slice(lastIndex));
  }

  return parts;
}

function getDisplayRole(role: string): string {
  const lower = role.toLowerCase();
  if (lower === "user" || lower === "investor") return "INVESTOR";
  if (lower === "assistant" || lower === "ai agent") return "AI AGENT";
  return role;
}

export default function ChatWidget({ onClose, initialQuestion }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [chatId, setChatId] = useState<number | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [chats, setChats] = useState<{ id: number; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [assistantTyping, setAssistantTyping] = useState(false);
  const [showChatDropdown, setShowChatDropdown] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const isProcessingQuestion = useRef(false);

  // On mount, load or generate user ID and fetch chats
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchUserChats(storedUserId);
    } else {
      const newUserId = uuidv4();
      localStorage.setItem("userId", newUserId);
      setUserId(newUserId);
    }
  }, []);

  // Handle initial question
  useEffect(() => {
    if (initialQuestion && !isProcessingQuestion.current) {
      isProcessingQuestion.current = true;
      handleSendInitialQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  // Fetch chats for the user
  async function fetchUserChats(userId: string) {
    try {
      const res = await fetch("/api/userChats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.chats) {
        // load content for last chat
        handleChatSelect(data.chats[data.chats.length - 1].id)
        setChats(data.chats);
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
    }
  }

  async function handleChatSelect(chatId: number) {
    setLoading(true);
    try {
      // Call the new API to load the chat and messages
      const res = await fetch("/api/loadChat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId }),
      });

      const data = await res.json();

      if (data.error) {
        console.error("Error loading chat:", data.error);
        return;
      }

      if (data.messages) {
        setMessages(data.messages);
        setChatId(data.chatId); 
        setThreadId(data.threadId || null);
      }
    } catch (err) {
      console.error("Error loading chat:", err);
    } finally {
      setShowChatDropdown(false)
      setLoading(false);
    }
  }

  // Start a new chat
  function handleNewChat() {
    setChatId(null);
    setThreadId(null);
    setMessages([]);
    setUserMessage("");
  }

  // Reusable function to send a message
  async function sendMessage(message: string, isInitialQuestion: boolean = false) {
    setLoading(true);
    setAssistantTyping(true);

    // Show user message as "INVESTOR"
    setMessages((prev) => [...prev, { role: "INVESTOR", content: message }]);

    try {
      const res = await fetch("/api/assistantChat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: message, userId, chatId, threadId }),
      });

      const data = await res.json();
      if (data.error) {
        console.error("API error:", data.error);
        return;
      }

      if (data.chatId) {
        setChatId(data.chatId);
      }
      if (data.threadId) {
        setThreadId(data.threadId);
      }

      if (data.messages) {
        setMessages(data.messages);
      }

      // Fetch updated chats for the user if it's a new chat
      if (isInitialQuestion) {
        fetchUserChats(userId!);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
      setAssistantTyping(false);
      if (isInitialQuestion) {
        isProcessingQuestion.current = false;
      }
    }
  }

  // Handle initial question
  async function handleSendInitialQuestion(question: string) {
    await sendMessage(question, true); // Pass `true` to indicate it's an initial question
  }

  // Handle regular user message
  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!userMessage.trim()) return;

    await sendMessage(userMessage); // Pass `false` (default) for regular messages
    setUserMessage(""); // Clear the input field
}

  return (
    <div className="min-h-full w-full text-white flex flex-col">
      {/* Header */}
       
      <div className="mb-4">
      {/* Title and Close Button Row */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-m font-semibold">
          Dolly Varden Silver&#39;s Ai IR Agent
        </h1>
        <button
          onClick={onClose}
          className="text-white hover:bg-[#3f3f46] px-3 py-1 rounded-md"
        >
          ✕
        </button>
      </div>

      {/* Chat Dropdown and New Chat Button Row */}
      <div className="flex items-center justify-between">
        {/* Chat Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            className="text-white hover:bg-[#3f3f46]"
            onClick={() => setShowChatDropdown(!showChatDropdown)}
          >
            <ChevronDown className="mr-1 h-5 w-5" />
            Chats ({chats?.length})
          </Button>

          {/* Dropdown Menu */}
          {showChatDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-[#3f3f46] rounded-md shadow-lg">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className="px-4 py-2 hover:bg-[#52525B] cursor-pointer"
                  onClick={() => handleChatSelect(chat.id)}
                >
                  {chat.title}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Chat Button */}
        <Button
          variant="ghost"
          className="text-white hover:bg-[#3f3f46]"
          onClick={handleNewChat}
        >
          <Plus className="mr-1 h-5 w-5" />
          New Chat
        </Button>
      </div>
    </div>


      {/* Chat area */}
      <div
        className="
          flex-1 overflow-y-auto mb-4 px-2 py-2 flex flex-col space-y-4
          scrollbar-thin scrollbar-thumb-[#4a4a51] scrollbar-track-transparent
          border border-[#3f3f46] rounded-md p-2
          bg-transparent
        "
      >
        {messages.map((msg, index) => (
          <ChatBubble key={index} role={msg.role} content={msg.content} />
        ))}

        {assistantTyping && <ChatBubble role="AI AGENT" content={<TypingIndicator />} />}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="flex gap-2">
        <Input
          className="flex-1 bg-[#3f3f46] text-white border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="Type your message..."
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500"
        >
          {loading ? "Sending..." : "Send"}
        </Button>
      </form>
    </div>
  );
}

function ChatBubble({
  role,
  content,
}: {
  role: string;
  content: React.ReactNode;
}) {
  const displayRole = getDisplayRole(role);
  const isUser = displayRole === "INVESTOR";

  let bubbleContent: React.ReactNode;
  if (typeof content === "string") {
    const textNoCitations = removeCitations(content);
    bubbleContent = parseBold(textNoCitations);
  } else {
    bubbleContent = content;
  }

  return (
    <div
      className={cn(
        "max-w-[75%] rounded-md px-4 py-2 whitespace-pre-wrap break-words shadow-md",
        isUser
          ? "bg-[#3F3F46] self-end text-right"
          : "bg-[#52525B] self-start text-left"
      )}
    >
      <p className="text-xs mb-1 opacity-70">{displayRole}</p>
      {bubbleContent}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm opacity-80">Sarah is thinking...</span>
    </div>
  );
}
