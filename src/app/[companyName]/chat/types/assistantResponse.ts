import { Message } from "./message";

export interface AssistantResponse {
    messages: Message[];
    suggestions?: string[];
    chatId?: number;
    threadId?: string;
    error?: string;
  }