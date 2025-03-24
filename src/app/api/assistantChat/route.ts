// src/app/api/assistantChat/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

export type MappedMessage = {
  role: "user" | "assistant";
  content: string;
};

// Function to handle POST requests
export async function POST(request: Request) {
  try {
    // Extract the request data
    const { userMessage, threadId, chatId: incomingChatId, userId, openaiApiKey, assistantId } = await request.json();

    // Validate if both API Key and Assistant ID are present in the request
    if (!openaiApiKey || !assistantId) {
      return NextResponse.json({ error: 'Missing OpenAI API Key or Assistant ID' }, { status: 400 });
    }

    // Initialize OpenAI client with the dynamic API key from request
    const openai = new OpenAI({
      apiKey: openaiApiKey, // Use the API key from the request
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let activeThreadId = threadId;
    let chatId = incomingChatId;

    // If no threadId, create a new thread
    if (!activeThreadId) {
      const newThread = await openai.beta.threads.create();
      activeThreadId = newThread.id;
    }

    // If no chat exists, create a new chat row with the user ID and first message as the title
    if (!chatId && userMessage) {
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert([{ title: userMessage, user_id: userId }])
        .select('*')
        .single();
      if (chatError) throw chatError;
      chatId = newChat.id;
    }

    // 1) If userMessage is empty, just load the conversation
    if (!userMessage) {
      const threadMessages = await openai.beta.threads.messages.list(activeThreadId);
      let messages: MappedMessage[] = threadMessages.data.map((msg) => {
        // Your existing logic to map roles and extract content
        return { role: mapRole(msg.role), content: extractText(msg.content) };
      });
      messages = messages.reverse();
      messages = mergeConsecutiveAssistantMessages(messages);

      return NextResponse.json(
        {
          chatId,
          threadId: activeThreadId,
          messages,
          suggestions: [], // or a default set of suggestions
        },
        { status: 200 }
      );
    }

    // 2) Otherwise, append the user message
    await openai.beta.threads.messages.create(activeThreadId, {
      role: "user",
      content: userMessage,
    });

    // Insert user message into Supabase
    const { error: userMsgError } = await supabase.from('messages').insert({
      chat_id: chatId,
      thread_id: activeThreadId,
      role: "user",
      content: userMessage,
    });
    if (userMsgError) throw userMsgError;

    // Run the assistant
    await openai.beta.threads.runs.createAndPoll(activeThreadId, {
      assistant_id: assistantId, // Use the assistant ID from the request
    });

    // 3) Fetch updated conversation
    const threadMessages = await openai.beta.threads.messages.list(activeThreadId);
    let messages: MappedMessage[] = threadMessages.data.map((msg) => {
      return { role: mapRole(msg.role), content: extractText(msg.content) };
    });

    // Insert new assistant messages into Supabase
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    const { error: assistantMsgError } = await supabase.from('messages').insert(
      assistantMessages.map((m) => ({
        chat_id: chatId,
        thread_id: activeThreadId,
        role: m.role,
        content: m.content,
      }))
    );
    if (assistantMsgError) throw assistantMsgError;

    // Reverse, merge consecutive assistant messages
    messages = messages.reverse();
    messages = mergeConsecutiveAssistantMessages(messages);

    // 4) Provide suggestions
    const suggestions = [
      "Ask about the company's next earnings call",
      "Ask about recent analyst ratings",
      "Ask about upcoming product launches"
    ];

    return NextResponse.json(
      {
        chatId,
        threadId: activeThreadId,
        messages,
        suggestions, // <--- send to client
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Assistants API error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      console.error("Assistants API error:", error);

      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }
}

// Helper function to extract text from blocks
function extractText(blocks: unknown): string {
  if (Array.isArray(blocks) && blocks.length > 0) {
    const firstBlock = blocks[0];
    if (
      firstBlock &&
      typeof firstBlock === "object" &&
      "text" in firstBlock
    ) {
      const block = firstBlock as Block;
      if (block.text && typeof block.text.value === "string") {
        return block.text.value;
      }
    }
    return JSON.stringify(firstBlock);

  }
  return "";
}

// Helper to map any role to either "user" or "assistant"
function mapRole(role: string): "user" | "assistant" {
  // Adjust logic if your roles differ
  return role === "user" ? "user" : "assistant";
}

// Helper to merge consecutive assistant messages into one
function mergeConsecutiveAssistantMessages(messages: MappedMessage[]): MappedMessage[] {
  const merged: MappedMessage[] = [];
  let lastRole: "user" | "assistant" | null = null;

  for (const msg of messages) {
    if (msg.role === "assistant") {
      if (lastRole === "assistant") {
        // If the last message was also from assistant, merge content
        merged[merged.length - 1].content += "\n" + msg.content;
      } else {
        merged.push({ ...msg });
        lastRole = "assistant";
      }
    } else {
      // If it's user, push it directly
      merged.push({ ...msg });
      lastRole = msg.role;
    }
  }

  return merged;
}

// Block type for handling extracted text
interface Block {
  text?: {
    value?: string;
  };
  [key: string]: unknown;
}
