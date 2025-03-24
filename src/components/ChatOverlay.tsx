"use client";

import ChatWidget from "./ChatWidget";

interface ChatOverlayProps {
  onClose: () => void;
  initialQuestion: string
}

export default function ChatOverlay({ onClose, initialQuestion }: ChatOverlayProps) {
  return (
    <div className="fixed inset-0 z-40">
      {/* Dark semi-transparent backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>

      {/* Full-screen on mobile; smaller modal on desktop */}
      <div
        className="
          absolute bottom-0 left-0
          w-full h-full
          sm:w-[400px] sm:h-[600px]
          sm:bottom-4 sm:right-4 sm:left-auto
          bg-[#27272A]/60 backdrop-blur-md
          border border-[#3f3f46] rounded-t-xl sm:rounded-xl
          p-4 flex flex-col shadow-2xl
          z-50
        "
      >
        <ChatWidget onClose={onClose} initialQuestion={initialQuestion} />
      </div>
    </div>
  );
}
