"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
// import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NameEntry } from "@/components/chat/name-entry";
import { WaitingRoom } from "@/components/chat/waiting-room";
import { ChatRoom } from "@/components/chat/chat-room";
import {
  createSession,
  joinQueue,
  heartbeat,
  leaveRoom,
  type Message,
} from "@/lib/api";
import { createEchoInstance } from "@/lib/echo";
import type Echo from "laravel-echo";

type Phase = "name-entry" | "waiting" | "chatting" | "ended";

interface AppState {
  phase: Phase;
  displayName: string;
  token: string;
  guestId: string; // numeric string (Guest.id)
  roomId: string; // room public_id (uuid)
  partnerName: string;
  partnerLeft: boolean;
}

const initialState: AppState = {
  phase: "name-entry",
  displayName: "",
  token: "",
  guestId: "",
  roomId: "",
  partnerName: "",
  partnerLeft: false,
};

export default function ChatApp() {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoading, setIsLoading] = useState(false);

  const echoRef = useRef<Echo<"pusher"> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopHeartbeat();
    if (echoRef.current) {
      echoRef.current.disconnect();
      echoRef.current = null;
    }
  }, [stopHeartbeat]);

  // ✅ Start heartbeat polling only while WAITING
  useEffect(() => {
    if (state.phase !== "waiting" || !state.token) return;

    let cancelled = false;

    const check = async () => {
      try {
        const hb = await heartbeat(state.token);

        if (cancelled) return;

        // expected: { status: "matched", room_public_id: "uuid" }
        if ((hb as any).status === "matched" && (hb as any).room_public_id) {
          const roomId = (hb as any).room_public_id as string;

          setState((prev) => ({
            ...prev,
            roomId,
            partnerName: (hb as any).partner_name ?? "Anonymous",
            partnerLeft: false,
            phase: "chatting",
          }));

          stopHeartbeat();
        }
      } catch {
        // ignore polling errors
      }
    };

    // run immediately then interval
    check();
    heartbeatRef.current = setInterval(check, 1500);

    return () => {
      cancelled = true;
      stopHeartbeat();
    };
  }, [state.phase, state.token, stopHeartbeat]);

  // ✅ Handle name submit
  const handleNameSubmit = async (displayName: string) => {
    setIsLoading(true);

    try {
      // 1) Create session
      const session = await createSession(displayName);
      const token = session.token;
      const guestId = String(session.guest.id);

      // 2) Move to waiting immediately
      setState((prev) => ({
        ...prev,
        displayName,
        token,
        guestId,
        phase: "waiting",
        roomId: "",
        partnerName: "",
        partnerLeft: false,
      }));

      // 3) Setup Echo (so user1 can receive updates ASAP)
      const echo = createEchoInstance(token);
      echoRef.current = echo;

      // 4) Join queue
      const q = await joinQueue(token);

      // If backend returns matched immediately (user2 case)
      if ((q as any).status === "matched") {
        const roomId =
          (q as any).room?.public_id ??
          (q as any).room_public_id ??
          (q as any).room_id;
        const partnerNameFromApi = (q as any).partner_name;

        if (!roomId) {
          // matched but missing room id → treat as error
          toast.error("Matched but no room id returned.");
          return;
        }

        setState((prev) => ({
          ...prev,
          roomId,
          partnerName: partnerNameFromApi ?? "Anonymous",
          partnerLeft: false,
          phase: "chatting",
        }));

        stopHeartbeat();
      }

      // If waiting, heartbeat effect above will handle advancing to chatting
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to connect. Please try again.",
      );
      cleanup();
      setState(initialState);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = useCallback(() => {
    cleanup();
    setState(initialState);
  }, [cleanup]);

  const handleStop = useCallback(async () => {
    try {
      if (state.token && state.roomId) {
        await leaveRoom(state.token, state.roomId);
      }
    } catch {
      // ignore
    } finally {
      cleanup();
      setState(initialState);
      toast.info("Chat ended. You can start a new one.");
    }
  }, [state.token, state.roomId, cleanup]);

  // ✅ Listen to room events only when CHATTING + have roomId
  useEffect(() => {
    if (state.phase !== "chatting") return;
    if (!echoRef.current) return;
    if (!state.roomId) return;

    const echo = echoRef.current;

    const channel = echo
      .private(`room.${state.roomId}`)
      .listen(".message.sent", (data: any) => {
        // backend may send flat payload or wrapped
        const msg: Message = data?.message ?? data;

        if (!msg?.id) return;

        // ignore own messages
        if (msg.sender_guest_id === Number(state.guestId)) return;

        window.dispatchEvent(
          new CustomEvent("chat-new-message", { detail: msg }),
        );
      })
      .listen(".room.closed", () => {
        setState((prev) => ({ ...prev, partnerLeft: true, phase: "ended" }));
        toast.info("Your partner has left the chat.");
      });

    return () => {
      channel.stopListening(".message.sent");
      channel.stopListening(".room.closed");
    };
  }, [state.phase, state.roomId, state.guestId]);

  // cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return (
    <main className="relative min-h-screen bg-background">
      {/* <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div> */}

      {state.phase === "name-entry" && (
        <NameEntry onSubmit={handleNameSubmit} isLoading={isLoading} />
      )}

      {state.phase === "waiting" && (
        <WaitingRoom displayName={state.displayName} onCancel={handleCancel} />
      )}

      {(state.phase === "chatting" || state.phase === "ended") &&
        state.roomId && (
          <ChatRoom
            token={state.token}
            roomId={state.roomId}
            myGuestId={state.guestId}
            partnerName={state.partnerName}
            onStop={handleStop}
            partnerLeft={state.partnerLeft}
          />
        )}
    </main>
  );
}
