import { getDisplayRole } from "../utils/getDisplayRole";
import { isRichContent } from "../utils/isRichContent";
import { parseBold } from "../utils/parseBold";
import { removeCitations } from "../utils/removeCitations";
import { cn } from "@/lib/utils";
import { RichResponse } from "./RichResponse";

export function ChatBubble({
    role,
    content,
  }: {
    role: string;
    content: string | React.ReactNode;
  }) {
    const displayRole = getDisplayRole(role);
    const isUser = displayRole === "INVESTOR";
  
    let bubbleContent: React.ReactNode;
    if (typeof content === "string") {
      const cleanedText = removeCitations(content);
      bubbleContent = parseBold(cleanedText);
    } else if (isRichContent(content)) {
      bubbleContent = <RichResponse data={content} />;
    } else {
      bubbleContent = content;
    }
  
    return (
      <div
        className={cn(
          "max-w-[75%] rounded-md px-3 py-2 whitespace-pre-wrap break-words shadow-sm",
          isUser
            ? "bg-blue-100 self-end text-right"
            : "bg-gray-100 self-start text-left"
        )}
      >
        <p className="text-xs mb-1 text-gray-500">{displayRole}</p>
        {bubbleContent}
      </div>
    );
}