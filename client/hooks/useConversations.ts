"use client";

import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "@/utils/socketSingleton";

export interface Conversation {
  _id?: string;
  roomId: string;
  members: string[];
  lastMessage?: string;
  updatedAt: string;
  unreadCount: number;
  clearedAt?: string;  // Timestamp when user cleared chat
  lastSenderId?: string;
  otherUserName?: string;
  otherUserId?: string;
  otherUserAvatar?: string;
}

export function useConversations(
  currentUser: string,
  activeRoom: string | null
) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const socket: Socket = getSocket();

  /*  REGISTER USER */
  useEffect(() => {
    if (!currentUser) return;
    socket.emit("registerUser", currentUser);
  }, [currentUser, socket]);

  /* LOAD TỪ BACKEND */
  useEffect(() => {
    if (!currentUser) return;

    const ACTIONS_URL = process.env.NEXT_PUBLIC_ACTIONS_URL!;
    let cancelled = false;

    fetch(`${ACTIONS_URL}/api/conversations?userId=${currentUser}`)
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;

        const mapped: Conversation[] = data.map((c: any) => ({
          ...c,
          unreadCount: c.unreadCount ?? 0,
        }));

        setConversations(
          mapped.sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() -
              new Date(a.updatedAt).getTime()
          )
        );
      })
      .catch((err) => {
        console.error("❌ load conversations failed", err);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  /* REALTIME UPDATE */
  useEffect(() => {
    const handleUpdate = (data: any) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.roomId === data.roomId);
        if (index === -1) return prev;

        const target = prev[index];

        const nextUpdatedAt = data.updatedAt ?? target.updatedAt;
        const nextLastMessage = data.lastMessage ?? target.lastMessage;

        const lastMessageChanged = nextLastMessage !== target.lastMessage;
        const shouldMoveToTop = lastMessageChanged;

        const updatedConversation: Conversation = {
          ...target,
          lastMessage: nextLastMessage,
          lastSenderId: data.lastSenderId ?? target.lastSenderId,
          updatedAt: nextUpdatedAt,
          unreadCount: activeRoom === data.roomId ? 0 : (data.unreadCount ?? target.unreadCount),
        };

        if (shouldMoveToTop) {
          return [
            updatedConversation,
            ...prev.filter((c) => c.roomId !== data.roomId),
          ];
        }
        return prev.map((c) => (c.roomId === data.roomId ? updatedConversation : c));
      });
    };



    const handleUserUpdate = (userData: any) => {
      if (!userData || !userData.userId) return;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.otherUserId === userData.userId) {
            return {
              ...c,
              otherUserName: userData.fullName || c.otherUserName,
              otherUserAvatar: userData.avatar || c.otherUserAvatar,
            };
          }
          return c;
        })
      );
    };

    socket.on("conversationUpdated", handleUpdate);
    socket.on("chatUserUpdated", handleUserUpdate);

    return () => {
      socket.off("conversationUpdated", handleUpdate);
      socket.off("chatUserUpdated", handleUserUpdate);
    };
  }, [activeRoom, currentUser, socket]);

  useEffect(() => {
    if (!activeRoom) return;

    socket.emit("markAsRead", {
      roomId: activeRoom,
      userId: currentUser,
    });
  }, [activeRoom, currentUser, socket]);


  return {
    conversations,
    setConversations,
  };
}
