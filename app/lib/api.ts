const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `API error: ${res.status}`);
  }

  return res.json();
}

export interface SessionResponse {
  token: string;
  guest: {
    id: number;
    public_id: string;
    display_name: string;
  };
}

export interface QueueResponse {
  status: "waiting" | "matched";
  room?: {
    public_id: string;
    status?: string;
    participants?: Array<{ guest_id: number; left_at: string | null }>;
    closed_at?: string | null;
    closed_reason?: string | null;
  };
}


export interface Message {
  id: number;
  room_public_id: string;
  sender_guest_id: number;
  type: "text" | "system";
  content: string;
  created_at: string;
  sender?: {
    id: number;
    display_name: string;
  };
}



export interface MessagesResponse {
  data: Message[];
}

export interface SendMessageResponse {
  data: Message;
}

export function createSession(displayName: string) {
  return request<SessionResponse>("/session", {
    method: "POST",
    body: JSON.stringify({ display_name: displayName }),
  });
}

export function joinQueue(token: string) {
  return request<QueueResponse>("/queue/join", { method: "POST" }, token);
}

export function heartbeat(token: string) {
  return request<{ status: "waiting" | "matched"; room_public_id?: string }>(
    "/heartbeat",
    { method: "POST" },
    token,
  );
}

export function getMessages(token: string, roomId: string) {
  return request<MessagesResponse>(
    `/rooms/${roomId}/messages`,
    { method: "GET" },
    token,
  );
}

export function sendMessage(token: string, roomId: string, content: string) {
  return request<SendMessageResponse>(
    `/rooms/${roomId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    },
    token
  );
}


export function leaveRoom(token: string, roomId: string) {
  return request<{ status: string }>(
    `/rooms/${roomId}/leave`,
    { method: "POST" },
    token,
  );
}
