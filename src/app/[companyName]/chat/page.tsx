"use client";

import React, {
  useState,
  useEffect,
  useRef,
  FormEvent,
  useCallback,
} from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { AutoSuggestions } from "./components/AutoSuggestions";
import { TypingIndicator } from "./components/TypingIndicator";
import { ChatBubble } from "./components/ChatBubble";
import { Message } from "./types/message";
import { AssistantResponse } from "./types/assistantResponse";
import styles from './styles.module.css';
import { createClient } from '@supabase/supabase-js';
import { useParams } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const defaultSuggestions = [
  "Recentt drill results?",
  "Upcoming catalysts?",
  "Accretive acquisitions?",
];

// --- Main ChatPage Component ---
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [chatId, setChatId] = useState<number | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assistantTyping, setAssistantTyping] = useState(false);
  const params = useParams();
  const companyName = params.companyName as string; 
  const [company, setCompany] = useState<{
    openai_api_key: string;
    assistant_id: string;
    default_suggestions: string[];
  }>({ openai_api_key: '', assistant_id: '', default_suggestions: []});

  // State for controlling suggestions
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);

  // Fetch company config on mount
  useEffect(() => {
    const fetchCompanyConfig = async () => {
      try {
        const { data: company, error } = await supabase
          .from('companies')
          .select('*')
          .eq('name', companyName.toLowerCase())
          .single();

        if (error) throw error;
        
        setCompany(company);
        if (company?.default_suggestions) {
          setDynamicSuggestions(company.default_suggestions);
        } else {
          // Fallback if no suggestions in DB
          setDynamicSuggestions(defaultSuggestions);
        }
      } catch (error) {
        console.error("Error loading company config:", error);
        // Set fallback suggestions
        setDynamicSuggestions(defaultSuggestions);
      }
    };

    fetchCompanyConfig();
  }, [companyName]);

  const bottomRef = useRef<HTMLDivElement>(null);

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
        handleChatSelect(data.chats[data.chats.length - 1]?.id)
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
      //setShowChatDropdown(false)
      setLoading(false);
    }
  }

  // Wrap handleNewChat in useCallback to avoid dependency issues
  const handleNewChat = useCallback(() => {
    setChatId(null);
    setThreadId(null);
    setMessages([]);
    localStorage.removeItem("chatId");
    localStorage.removeItem("threadId");

    // Show default suggestions again for a fresh chat
    setShowSuggestions(true);
  }, []);

  // Wrap sendUserMessage in useCallback to include it in dependencies
  const sendUserMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;
      setLoading(true);
      setAssistantTyping(true);

      // Optimistically add the user's message
      setMessages((prev) => [...prev, { role: "INVESTOR", content: message }]);

      if (!company) {
        console.error("Company configuration not found!");
        return;
      }
      
      try {
        const res = await fetch("/api/assistantChat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userMessage: message, userId, chatId, threadId, openaiApiKey: company?.openai_api_key, assistantId: company?.assistant_id }),
        });
        const data: AssistantResponse = await res.json();

        if (!data.error && data.messages) {
          setMessages(data.messages);
          if (data.chatId) {
            setChatId(data.chatId);
            localStorage.setItem("chatId", String(data.chatId));
          }
          if (data.threadId) {
            setThreadId(data.threadId);
            localStorage.setItem("threadId", data.threadId);
          }
        }
      } catch (err) {
        console.error("Error sending message:", err);
      } finally {
        setLoading(false);
        setAssistantTyping(false);
        setUserMessage("");
        // Hide suggestions after sending a message
        setShowSuggestions(false);
      }
    },
    [chatId, threadId]
  );

  // Listen for "fillInput" messages from parent embed
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data) return;
      const { type, question, newChat } = event.data;
      if (type === "fillInput" && question) {
        if (newChat) {
          handleNewChat();
        }
        setUserMessage(question);
        sendUserMessage(question);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [sendUserMessage, handleNewChat]);

  // Load stored chat ID & thread ID
  useEffect(() => {
    const storedChatId = localStorage.getItem("chatId");
    const storedThreadId = localStorage.getItem("threadId");
    if (storedChatId) setChatId(Number(storedChatId));
    if (storedThreadId) setThreadId(storedThreadId);
  }, []);

  // Fetch existing conversation on mount if we have chatId/threadId
  useEffect(() => {
    if (chatId && threadId) {
      fetchExistingConversation(chatId, threadId);
    }
  }, [chatId, threadId]);

  // Scroll to bottom on messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchExistingConversation(chatId: number, threadId: string) {
    try {
      setLoading(true);
      const res = await fetch("/api/assistantChat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: "", chatId, threadId, openaiApiKey: company.openai_api_key, assistantId: company.assistant_id }),
      });
      const data: AssistantResponse = await res.json();
      if (!data.error && data.messages) {
        setMessages(data.messages);
        if (data.suggestions) {
          setDynamicSuggestions(data.suggestions);
        }
      }
    } catch (err) {
      console.error("Error loading conversation:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleCloseChat() {
    window.parent.postMessage({ type: "closeChat" }, "*");
  }

  // Handle the form submit
  async function handleSend(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!userMessage.trim()) return;
    await sendUserMessage(userMessage);
  }

  // Hide suggestions on user typing
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setUserMessage(value);

    // If user starts typing, hide suggestions
    if (value.trim().length > 0) {
      setShowSuggestions(false);
    } else {
      // If input is cleared and no messages yet, show suggestions
      if (messages.length === 0) {
        setShowSuggestions(true);
      }
    }
  }

  // Hide suggestions on scroll
  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 5) {
      setShowSuggestions(false);
    } else {
      if (messages.length === 0 && !userMessage.trim()) {
        setShowSuggestions(true);
      }
    }
  }

  // When user clicks on a suggestion
  function handleSuggestionClick(suggestion: string) {
    setUserMessage(suggestion);
    sendUserMessage(suggestion);
  }

  const suggestionsToShow =
    dynamicSuggestions.length > 0
      ? dynamicSuggestions
      : messages.length === 0
      ? defaultSuggestions
      : [];

      return (
        <div className={styles.chatPageContainer}>
          {/* Header */}
          <div className={styles.header}>
            <h1 className="text-lg font-semibold text-gray-800">Ai IR Agent</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="text-gray-600" onClick={handleNewChat}>
                <Plus className="mr-1 h-5 w-5" />
                New
              </Button>
              <Button variant="ghost" className="text-gray-600" onClick={handleCloseChat}>
                X
              </Button>
            </div>
          </div>
    
          {/* Chat area */}
          <div
            onScroll={handleScroll}
            className={styles.chatArea}
          >
            {messages.map((msg, idx) => (
              <ChatBubble key={idx} role={msg.role} content={msg.content} />
            ))}
            {assistantTyping && (
              <ChatBubble role="AI AGENT" content={<TypingIndicator />} />
            )}
            <div ref={bottomRef} />
          </div>
    
          {/* Show suggestions if allowed and we have something to display */}
          {showSuggestions && suggestionsToShow.length > 0 && (
            <AutoSuggestions suggestions={suggestionsToShow} onSelect={handleSuggestionClick} />
          )}
    
          <div className="flex justify-center px-3 py-2 border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500 mb-2">
              This is not financial advice. Do your own due diligence.
            </p>
          </div>
    
          {/* Input area */}
          <form
            onSubmit={handleSend}
            className={styles.inputArea}
          >
            <Input
              className={styles.inputField}
              placeholder="Type your message..."
              value={userMessage}
              onChange={handleInputChange}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              type="submit"
              disabled={loading}
              className={styles.sendButton}
            >
              {loading ? "Sending..." : "Send"}
            </Button>
          </form>
        </div>
  );
}