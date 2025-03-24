"use client";

import { MessageCircle } from "lucide-react";

interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function ChatButton({ isOpen, onClick }: ChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-4
        left-4 sm:left-auto sm:right-4
        bg-blue-600 hover:bg-blue-500
        text-white font-semibold text-lg
        px-4 py-3 rounded-full
        transition-colors z-50
        flex items-center justify-center
      "
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}
