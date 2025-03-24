import { useEffect, useState } from "react";

export function TypingIndicator() {
    const texts = [
      "Gathering the latest data...",
      "Crunching the numbers...",
      "Analyzing recent filings...",
      "Reviewing company updates...",
      "Preparing your answer...",
    ];
  
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
        setIndex((prevIndex) => (prevIndex + 1) % texts.length);
        }, 3000);

        return () => clearInterval(intervalId);
    }, [texts.length]);

    return (
        <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">{texts[index]}</span>
        </div>
    );
}