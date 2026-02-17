"use client";

import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  senderName?: string;
  body: string;
  timestamp: string;
  isMe: boolean;
}

export function MessageBubble({
  senderName,
  body,
  timestamp,
  isMe,
}: MessageBubbleProps) {
  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn("flex flex-col gap-1 max-w-[75%]", isMe ? "self-end items-end" : "self-start items-start")}
    >
      <div
        className={cn(
          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words",
          isMe
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        {body}
      </div>
      <span className="text-[10px] text-muted-foreground px-1">{time}</span>
    </div>
  );
}
