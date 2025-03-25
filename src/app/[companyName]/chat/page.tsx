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
import { v4 as uuidv4 } from "uuid";
import { AutoSuggestions } from "./components/AutoSuggestions";
import { TypingIndicator } from "./components/TypingIndicator";
import { ChatBubble } from "./components/ChatBubble";
import { Message } from "./types/message";
import { AssistantResponse } from "./types/assistantResponse";
import styles from "./styles.module.css";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const defaultSuggestions = [
  "Recent drill results?",
  "Upcoming catalysts?",
  "Accretive acquisitions?",
];

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
  } | null>(null);

  const [showSuggestions, setShowSuggestions] = useState(true);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCompanyConfig = async () => {
      try {
        const { data: company, error } = await supabase
          .from("companies")
          .select("*")
          .eq("name", companyName.toLowerCase())
          .single();

        if (error) throw error;

        setCompany(company);
        if (company?.default_suggestions) {
          setDynamicSuggestions(company.default_suggestions);
        } else {
          setDynamicSuggestions(defaultSuggestions);
        }
      } catch (error) {
        console.error("Error loading company config:", error);
        setDynamicSuggestions(defaultSuggestions);
      }
    };

    fetchCompanyConfig();
  }, [companyName]);

  const handleChatSelect = useCallback(async (chatId: number) => {
    setLoading(true);
    try {
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
      setLoading(false);
    }
  }, []);

  const fetchUserChats = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch("/api/userChats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (data.chats) {
          const selectedChatId = data.chats[data.chats.length - 1]?.id;
          if (!selectedChatId) return;
          handleChatSelect(selectedChatId);
        }
      } catch (err) {
        console.error("Error fetching chats:", err);
      }
    },
    [handleChatSelect]
  );

  const handleNewChat = useCallback(() => {
    setChatId(null);
    setThreadId(null);
    setMessages([]);
    localStorage.removeItem("chatId");
    localStorage.removeItem("threadId");
    setShowSuggestions(true);
  }, []);

  const sendUserMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;
      setLoading(true);
      setAssistantTyping(true);

      setMessages((prev) => [...prev, { role: "INVESTOR", content: message }]);

      try {
        if (!company) {
          console.error("Company configuration not found!");
          return;
        }

        const res = await fetch("/api/assistantChat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userMessage: message,
            userId,
            chatId,
            threadId,
            openaiApiKey: company.openai_api_key,
            assistantId: company.assistant_id,
          }),
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
        setShowSuggestions(false);
      }
    },
    [company, userId, chatId, threadId]
  );

  const fetchExistingConversation = useCallback(
    async (chatId: number, threadId: string) => {
      try {
        if (!company) {
          console.error("Company configuration not found!");
          return;
        }

        setLoading(true);
        const res = await fetch("/api/assistantChat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userMessage: "",
            chatId,
            threadId,
            openaiApiKey: company.openai_api_key,
            assistantId: company.assistant_id,
          }),
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
    },
    [company]
  );

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
  }, [fetchUserChats]);

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

  useEffect(() => {
    const storedChatId = localStorage.getItem("chatId");
    const storedThreadId = localStorage.getItem("threadId");
    if (storedChatId) setChatId(Number(storedChatId));
    if (storedThreadId) setThreadId(storedThreadId);
  }, []);

  useEffect(() => {
    if (chatId && threadId) {
      fetchExistingConversation(chatId, threadId);
    }
  }, [chatId, threadId, fetchExistingConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleCloseChat() {
    window.parent.postMessage({ type: "closeChat" }, "*");
  }

  async function handleSend(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!userMessage.trim()) return;
    await sendUserMessage(userMessage);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setUserMessage(value);

    if (value.trim().length > 0) {
      setShowSuggestions(false);
    } else {
      if (messages.length === 0) {
        setShowSuggestions(true);
      }
    }
  }

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
      {/* Fixed Header */}
      <div
        className={styles.header}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <h1 className="text-lg font-semibold text-gray-800">AI IR Agent</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleNewChat}>
            New Chat
          </Button>
          <Button variant="ghost" onClick={handleCloseChat}>
            X
          </Button>
        </div>
      </div>

      {/* Chat Area (with top and bottom margins to avoid fixed header/footer) */}
      <div
        onScroll={handleScroll}
        className={styles.chatArea}
        style={{ marginTop: "60px", marginBottom: "120px" }}
      >
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} role={msg.role} content={msg.content} />
        ))}
        {assistantTyping && (
          <ChatBubble role="AI AGENT" content={<TypingIndicator />} />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Fixed Footer */}
      <div
        className={styles.footer}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        {/* Suggestions */}
        {showSuggestions && suggestionsToShow.length > 0 && (
          <div className={styles.suggestions}>
            <AutoSuggestions
              suggestions={suggestionsToShow}
              onSelect={handleSuggestionClick}
            />
          </div>
        )}

        {/* Disclaimer */}
        <div className={styles.disclaimer}>
          <p>
            This is not financial advice. Do your own due diligence.
          </p>
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className={styles.inputArea}>
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
          <Button type="submit" disabled={loading} className={styles.sendButton}>
            {loading ? "Sending..." : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}
