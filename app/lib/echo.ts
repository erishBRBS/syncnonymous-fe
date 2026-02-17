import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Pusher must be available globally for Laravel Echo
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).Pusher = Pusher;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export function createEchoInstance(token: string): Echo<"pusher"> {
  return new Echo({
    broadcaster: "pusher",
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || "",
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
    wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST || "localhost",
    wsPort: Number(process.env.NEXT_PUBLIC_PUSHER_PORT) || 8080,
    wssPort: Number(process.env.NEXT_PUBLIC_PUSHER_PORT) || 8080,
    forceTLS: process.env.NEXT_PUBLIC_PUSHER_SCHEME === "https",
    disableStats: true,
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${API_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  });
}
