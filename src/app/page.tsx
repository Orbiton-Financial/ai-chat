"use client";

import { useState } from "react";
import Image from "next/image";
import ChatButton from "../components/ChatButton";
import ChatOverlay from "../components/ChatOverlay";

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState("");

  const presetQuestions = [
    "What are the company's key financial metrics?",
    "Can you provide an overview?",
    "What recent news has the company been involved in?",
    "What are the company's future plans?",
  ];

  function toggleChat() {
    setIsChatOpen((prev) => !prev);
  }

  function handleQuestionClick(question: string) {
    setSelectedQuestion(question); // Set the selected question
    toggleChat(); // Open the chat overlay
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center p-8 text-white">
      {/* Orbiton Logo */}
      <Image
        src="/orbiton.png"
        alt="Orbiton logo"
        width={200}
        height={50}
        priority
        className="mb-8"
      />

      <p className="mt-4 text-lg sm:text-xl text-gray-300 text-center max-w-md">
        Building the next generation of AI experiences
      </p>

      {/* Fixed Container for Preset Questions and Chat Button */}
      <div className="fixed bottom-20 left-4 sm:left-auto sm:right-4 flex flex-col items-end gap-2 z-50">
        {/* Preset Questions Chips */}
        {!isChatOpen && (
          <div className="flex flex-wrap justify-end gap-2 max-w-md">
            {presetQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuestionClick(question)}
                className="px-2 py-1 bg-gray-800 text-white rounded-full hover:bg-gray-600 transition-colors text-sm sm:text-base"
              >
                {question}
              </button>
            ))}
          </div>
        )}

        {/* Floating Chat Button */}
        {!isChatOpen && <ChatButton isOpen={isChatOpen} onClick={toggleChat} />}
      </div>

      {/* Chat Overlay (full-screen on mobile, modal on desktop) */}
      {isChatOpen && (
        <ChatOverlay
          onClose={toggleChat}
          initialQuestion={selectedQuestion} // Pass the selected question
        />
      )}
    </div>
  );
}