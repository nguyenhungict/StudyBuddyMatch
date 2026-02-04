"use client";

import { createContext, useContext, useState } from "react";

interface ChatContextValue {
  userId: string | null;
  setUserId: (id: string) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  return (
    <ChatContext.Provider value={{ userId, setUserId }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext must be used inside <ChatProvider>");
  }
  return ctx;
}
