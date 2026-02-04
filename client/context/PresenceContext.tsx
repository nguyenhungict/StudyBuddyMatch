"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSocket } from "@/utils/socketSingleton";

const PresenceContext = createContext<string[]>([]);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    const socket = getSocket();

    const handler = (users: string[]) => {
      setOnlineUsers(users);
    };

    socket.on("onlineUsers", handler);

    return () => {
      socket.off("onlineUsers", handler);
    };
  }, []);

  return (
    <PresenceContext.Provider value={onlineUsers}>
      {children}
    </PresenceContext.Provider>
  );
}

export function useOnlineUsers() {
  return useContext(PresenceContext);
}
