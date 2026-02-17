"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Square, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "@/components/chat/message-bubble";
import {
  sendMessage as sendMessageApi,
  getMessages,
  type Message,
} from "@/lib/api";

interface ChatMessage {
  id: number;
  // senderName: string;
  body: string;
  isMe: boolean;
  timestamp: string;
}

interface ChatRoomProps {
  token: string;
  roomId: string;
  myGuestId: string; // numeric string (ex: "44")
  partnerName: string;
  onStop: () => void;
  partnerLeft: boolean;
}

export function ChatRoom({
  token,
  roomId,
  myGuestId,
  partnerName,
  onStop,
  partnerLeft,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ Transform API/broadcast message to local format
  // Backend fields:
  // - content
  // - sender_guest_id
  // - sender?.display_name (optional)
  const transformMessage = (msg: Message): ChatMessage => {
    const isMe = Number(msg.sender_guest_id) === Number(myGuestId);

    return {
      id: msg.id,
      // senderName:
      //   msg.sender?.display_name ?? (isMe ? "You" : partnerName || "Anonymous"),
      body: msg.content, // ✅ backend uses content
      isMe,
      timestamp: msg.created_at,
    };
  };

  // Load existing messages
  useEffect(() => {
    getMessages(token, roomId)
      .then((res) => {
        const transformed = res.data.map((m) => transformMessage(m));
        setMessages(transformed);
      })
      .catch(() => {
        // silently fail, messages will come through websocket
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, roomId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending || partnerLeft) return;

    setSending(true);
    setInput("");

    try {
      // NOTE: make sure api.ts sends { content: trimmed } not { body: trimmed }
      const res = await sendMessageApi(token, roomId, trimmed);
      const msg = transformMessage(res.data);

      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } catch {
      setInput(trimmed);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Incoming messages from Echo (page.tsx dispatches "chat-new-message")
  useEffect(() => {
    const handler = (e: CustomEvent<Message>) => {
      const msg = transformMessage(e.detail);
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    window.addEventListener("chat-new-message" as any, handler as any);
    return () =>
      window.removeEventListener("chat-new-message" as any, handler as any);
  }, [myGuestId, partnerName]);

  return (
    <div className="flex h-screen flex-col w-full md:mx-auto md:max-w-4xl">
      <header className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-muted">
            <User className="size-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {partnerName || "Anonymous"}
            </span>
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground ">
                {partnerLeft ? "Disconnected" : "Active now"}
              </span>

              {!partnerLeft && (
                <span
                  className="ml-2 h-2 w-2 rounded-full bg-green-500"
                  aria-label="online"
                  title="Online"
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: ThemeToggle + Stop */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Button
            variant="destructive"
            size="sm"
            onClick={onStop}
            className="gap-1.5"
          >
            <Square className="size-3.5" />
            End
          </Button>
        </div>
      </header>

      {/* Partner left notice */}
      {partnerLeft && (
        <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive-foreground">
          Your partner has left the chat.
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="scrollbar-messenger flex flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Say hello to{" "}
              <span className="font-medium">{partnerName || "Stranger"}</span>!
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            body={msg.body}
            timestamp={msg.timestamp}
            isMe={msg.isMe}
          />
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card/80 p-4 backdrop-blur-sm">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder={partnerLeft ? "Chat ended" : "Type a message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={partnerLeft}
            className="h-11 flex-1"
            maxLength={1000}
          />
          <Button
            type="submit"
            size="icon-lg"
            disabled={input.trim().length === 0 || sending || partnerLeft}
          >
            <Send className="size-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
