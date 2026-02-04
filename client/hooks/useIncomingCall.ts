"use client";

import { useEffect, useState, useCallback } from "react";
import { getSocket } from "@/utils/socketSingleton";

// Hook riêng CHỈ để listen incoming call - không ảnh hưởng đến các socket listeners khác
export function useIncomingCall(userId: string | null) {
    const [incomingVideoCall, setIncomingVideoCall] = useState<{
        from: string;
        roomId: string;
        videoRoomId: string;
        callId?: string;
    } | null>(null);

    useEffect(() => {
        if (!userId) return;

        const socket = getSocket();
        if (!socket) return;

        // Handler cho incoming call
        const handleIncomingCall = (data: any) => {
            console.log("📹 [GlobalListener] Incoming video call:", data);
            setIncomingVideoCall(data);
        };

        // Handler khi call bị missed - đóng popup
        const handleCallMissed = () => {
            console.log("📹 [GlobalListener] videoCallMissed received, hiding popup");
            setIncomingVideoCall(null);
        };

        // Handler khi call bị rejected - đóng popup
        const handleCallRejected = () => {
            console.log("📹 [GlobalListener] videoCallRejected received, hiding popup");
            setIncomingVideoCall(null);
        };

        // Handler khi call ended - đóng popup
        const handleCallEnded = () => {
            console.log("📹 [GlobalListener] call-ended received, hiding popup");
            setIncomingVideoCall(null);
        };

        // 🔥 CRITICAL: Listen receiveMessage và check nếu là tin nhắn missed/rejected call
        // Giống như useChat làm - đây là backup nếu event trực tiếp không nhận được
        const handleReceiveMessage = (msg: any) => {
            const isMissedOrRejected =
                (msg.call?.status === "missed") ||
                (msg.call?.status === "rejected") ||
                (typeof msg.content === 'string' && (
                    msg.content.includes("Cuộc gọi nhỡ") ||
                    msg.content.includes("Missed Call") ||
                    msg.content.includes("Cuộc gọi bị từ chối")
                ));

            if (isMissedOrRejected) {
                console.log("📹 [GlobalListener] Received missed/rejected call message, hiding popup:", msg);
                setIncomingVideoCall(null);
            }
        };

        // Function to setup listeners
        const setupListeners = () => {
            console.log("📹 [GlobalListener] Setting up listeners for user:", userId, "Socket ID:", socket.id);

            // Register user để nhận được cuộc gọi
            socket.emit("registerUser", userId);

            // Listen các events
            socket.on("incomingVideoCall", handleIncomingCall);
            socket.on("videoCallMissed", handleCallMissed);
            socket.on("videoCallRejected", handleCallRejected);
            socket.on("call-ended", handleCallEnded);
            socket.on("receiveMessage", handleReceiveMessage); // 🔥 Backup listener
        };

        // If socket is already connected, setup immediately
        if (socket.connected) {
            setupListeners();
        } else {
            // Wait for connection then setup
            socket.on("connect", setupListeners);
        }

        // Also re-register on reconnect
        const handleReconnect = () => {
            console.log("📹 [GlobalListener] Socket reconnected, re-registering...");
            socket.emit("registerUser", userId);
        };
        socket.on("reconnect", handleReconnect);

        return () => {
            // Cleanup CHỈ các handlers của hook này
            socket.off("connect", setupListeners);
            socket.off("reconnect", handleReconnect);
            socket.off("incomingVideoCall", handleIncomingCall);
            socket.off("videoCallMissed", handleCallMissed);
            socket.off("videoCallRejected", handleCallRejected);
            socket.off("call-ended", handleCallEnded);
            socket.off("receiveMessage", handleReceiveMessage);
        };
    }, [userId]);

    const acceptVideoCall = useCallback(async (videoRoomId: string, to: string, callId?: string) => {
        const socket = getSocket();
        if (!socket) return;

        const chatRoomId = incomingVideoCall?.roomId || "";

        // UPDATE DB: Mark as ACCEPTED
        if (callId) {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888";
                const token = typeof window !== 'undefined'
                    ? (localStorage.getItem("accessToken") || localStorage.getItem("token"))
                    : null;

                await fetch(`${API_URL}/calls/${callId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        status: 'ACCEPTED',
                        acceptedAt: new Date().toISOString(),
                    }),
                });
            } catch (error) {
                console.error("❌ Failed to update call status:", error);
            }
        }

        socket.emit("acceptVideoCall", { videoRoomId, to, roomId: chatRoomId });

        // 🔥 Dispatch custom event to open floating video call instead of redirect
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('startFloatingVideoCall', {
                detail: {
                    videoRoomId,
                    chatRoomId,
                    otherUserId: to,
                    callerId: to,
                    callId: callId || ''
                }
            }));
        }

        // Clear incoming call popup
        setIncomingVideoCall(null);
    }, [incomingVideoCall]);

    const rejectVideoCall = useCallback((to: string) => {
        const socket = getSocket();
        if (!socket) return;

        const roomId = incomingVideoCall?.roomId || "";

        console.log("❌ Rejecting video call, roomId:", roomId);
        socket.emit("rejectVideoCall", { to, roomId });
        setIncomingVideoCall(null);
    }, [incomingVideoCall]);

    return {
        incomingVideoCall,
        acceptVideoCall,
        rejectVideoCall,
    };
}
