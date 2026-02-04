"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { getSocket } from "@/utils/socketSingleton";
import { useAuth } from "@/context/AuthContext";

export function useTotalUnreadMessages() {
    const [conversations, setConversations] = useState<any[]>([]);
    const { user } = useAuth();
    const userId = user?.id;

    // Function to fetch conversations
    const fetchConversations = useCallback(async () => {
        if (!userId) {
            setConversations([]);
            return;
        }

        try {
            const ACTIONS_URL = process.env.NEXT_PUBLIC_ACTIONS_URL!;
            const res = await fetch(`${ACTIONS_URL}/api/conversations?userId=${userId}`);
            if (!res.ok) throw new Error("API error");
            const data = await res.json();
            setConversations(data);
        } catch (err) {
            console.error("❌ Failed to fetch conversations:", err);
        }
    }, [userId]);

    // Fetch initial conversations
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Listen for realtime updates via socket
    useEffect(() => {
        if (!userId) return;

        const socket = getSocket();

        // Function to register user
        const registerUser = () => {
            console.log("📡 Registering user for unread updates:", userId);
            socket.emit("registerUser", userId);
        };

        // Register user when socket connects or is already connected
        if (socket.connected) {
            registerUser();
        }
        socket.on("connect", registerUser);

        const handleConversationUpdate = (data: any) => {
            console.log("📩 Received conversationUpdated:", data);
            setConversations((prev) => {
                const index = prev.findIndex((c) => c.roomId === data.roomId);
                if (index === -1) {
                    // New conversation - add it
                    return [...prev, { ...data, unreadCount: data.unreadCount ?? 0 }];
                }
                // Update existing conversation
                return prev.map((c) =>
                    c.roomId === data.roomId
                        ? { ...c, unreadCount: data.unreadCount ?? c.unreadCount }
                        : c
                );
            });
        };

        socket.on("conversationUpdated", handleConversationUpdate);

        return () => {
            socket.off("connect", registerUser);
            socket.off("conversationUpdated", handleConversationUpdate);
        };
    }, [userId]);

    // Also poll every 30 seconds as backup (in case socket events are missed)
    useEffect(() => {
        if (!userId) return;

        const interval = setInterval(() => {
            fetchConversations();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [userId, fetchConversations]);

    // Calculate total unread
    const totalUnread = useMemo(() => {
        const total = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        console.log("📬 Total unread messages:", total, "from", conversations.length, "conversations");
        return total;
    }, [conversations]);

    return totalUnread;
}
