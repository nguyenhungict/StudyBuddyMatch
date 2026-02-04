"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "@/utils/socketSingleton";

export interface Message {
    _id?: string;
    content?: string;
    userId: string;
    roomId: string;
    isPinned?: boolean;
    pinnedBy?: string;
    pinnedAt?: string;
    isEdited?: boolean;
    editedAt?: Date;
    images?: string[];
    fileUrl?: string;
    createdAt?: string;

    // New Fields for Call and Reminder
    type?: "text" | "image" | "file" | "call" | "reminder" | "system" | "reminder_cancelled";
    call?: {
        status: "missed" | "rejected" | "ended";
        duration?: number;
    };

    // Reminder fields
    reminder?: {
        reminderId: string;
        content: string;
        scheduledDate: Date | string;
        creatorName: string;
    };

    readBy?: string[];
    reactions?: { userId: string; type: string }[];
    isRevoked?: boolean;
    replyTo?: {
        messageId: string;
        userId: string;
        content?: string;
        images?: string[];
        fileUrl?: string;
    } | null;
}

export interface ReplyPreview {
    messageId: string;
    userId: string;
    content?: string;
    images?: string[];
    fileUrl?: string;
}

export function useChat(userId?: string | null) {
    // 🔑 CACHE MESSAGE THEO ROOM
    const [messagesByRoom, setMessagesByRoom] = useState<
        Record<string, Message[]>
    >({});

    const socketRef = useRef<Socket | null>(null);
    const currentRoom = useRef<string>("");

    // 📹 VIDEO CALL STATE
    const [incomingVideoCall, setIncomingVideoCall] = useState<{
        from: string;
        roomId: string;
        videoRoomId: string;
        callId?: string;  // ✅ THÊM CALLID
    } | null>(null);

    /* SOCKET INIT  */
    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = getSocket();
        }
        const socket = socketRef.current;

        const onConnect = () => {
            console.log("🔌 Socket connected:", socket.id);
        };

        // 🔹 LOAD MESSAGE KHI JOIN ROOM
        const onLoadMessages = (msgs: Message[]) => {
            const roomId = currentRoom.current;
            if (!roomId) return;

            setMessagesByRoom((prev) => ({
                ...prev,
                [roomId]: msgs,
            }));
        };

        // 🔹 RECEIVE MESSAGE REALTIME
        const onReceiveMessage = (msg: Message) => {
            // 🔥 ROBUSTNESS: If receiving "Missed Call", FORCE CLOSE POPUP (Relaxed Check)
            const isMissedCall =
                (msg.call?.status === "missed") ||
                (typeof msg.content === 'string' && (msg.content.includes("Cuộc gọi nhỡ") || msg.content.includes("Missed Call")));

            if (isMissedCall) {
                console.log("⚠️ [Frontend] Received 'Missed Message' -> Force closing popup. Msg:", msg);
                setIncomingVideoCall(null);
            }

            setMessagesByRoom((prev) => {
                const roomMsgs = prev[msg.roomId] || [];
                const exists = roomMsgs.some((m) => m._id === msg._id);
                if (exists) return prev;

                return {
                    ...prev,
                    [msg.roomId]: [...roomMsgs, msg],
                };
            });
        };

        // 🔹 REACTION UPDATE
        const onReactionUpdated = (msg: Message) => {
            setMessagesByRoom((prev) => {
                const roomMsgs = prev[msg.roomId] || [];
                return {
                    ...prev,
                    [msg.roomId]: roomMsgs.map((m) =>
                        m._id === msg._id ? msg : m
                    ),
                };
            });
        };

        // 🔹 PIN / UNPIN
        const onMessagePinned = ({ messageId, pinnedBy, pinnedAt }: any) => {
            const roomId = currentRoom.current;
            if (!roomId) return;

            setMessagesByRoom((prev) => ({
                ...prev,
                [roomId]: (prev[roomId] || []).map((m) =>
                    m._id === messageId
                        ? { ...m, isPinned: true, pinnedBy, pinnedAt }
                        : { ...m, isPinned: false }
                ),
            }));
        };

        const onMessageUnpinned = ({ messageId }: any) => {
            const roomId = currentRoom.current;
            if (!roomId) return;

            setMessagesByRoom((prev) => ({
                ...prev,
                [roomId]: (prev[roomId] || []).map((m) =>
                    m._id === messageId
                        ? { ...m, isPinned: false, pinnedBy: undefined, pinnedAt: undefined }
                        : m
                ),
            }));
        };

        // 🔹 SEEN
        const onMessagesRead = ({ roomId, userId: reader }: any) => {
            setMessagesByRoom((prev) => ({
                ...prev,
                [roomId]: (prev[roomId] || []).map((msg) => ({
                    ...msg,
                    readBy: msg.readBy?.includes(reader)
                        ? msg.readBy
                        : [...(msg.readBy || []), reader],
                })),
            }));
        };


        // 📹 VIDEO CALL EVENTS
        const onIncomingVideoCall = (data: any) => {
            console.log("📹 Incoming video call:", data);
            setIncomingVideoCall(data);
        };

        const onVideoCallAccepted = ({ videoRoomId, roomId }: any) => {
            console.log("✅ Video call accepted by callee. VideoRoomId:", videoRoomId);
            // Caller is already in floating video call - no redirect needed
            // WebRTC connection will be established via user-connected event
        };

        const onVideoCallRejected = () => {
            console.log("❌ Video call rejected");
        };

        const onVideoCallMissed = () => {
            console.log("⚠️ [Frontend] Received videoCallMissed event - closing popup");
            setIncomingVideoCall(null);
        };

        const onCallEnded = () => {
            console.log("⚠️ [Frontend] Received call-ended event - closing popup");
            setIncomingVideoCall(null);
        }

        // 📅 REMINDER UPDATED
        const onReminderUpdated = ({ reminder }: { reminder: any }) => {
            console.log("📅 Reminder updated:", reminder);

            // Update message with this reminder
            setMessagesByRoom((prev) => {
                const updated = { ...prev };

                for (const roomId of Object.keys(updated)) {
                    updated[roomId] = updated[roomId].map((msg): Message => {
                        if (msg.reminder && msg.reminder.reminderId === reminder._id) {
                            return {
                                ...msg,
                                content: reminder.content,
                                reminder: {
                                    reminderId: msg.reminder.reminderId,
                                    creatorName: msg.reminder.creatorName,
                                    content: reminder.content,
                                    scheduledDate: reminder.scheduledDate,
                                },
                                isEdited: true,
                            };
                        }
                        return msg;
                    });
                }

                return updated;
            });
        };

        // 🚫 REMINDER CANCELLED
        const onReminderCancelled = ({ reminderId, content }: { reminderId: string; content: string }) => {
            console.log("🚫 Reminder cancelled:", reminderId, content);

            // Update the reminder message to show cancelled state
            setMessagesByRoom((prev) => {
                const updated = { ...prev };

                for (const roomId of Object.keys(updated)) {
                    updated[roomId] = updated[roomId].map((msg): Message => {
                        if (msg.reminder && msg.reminder.reminderId === reminderId) {
                            return {
                                ...msg,
                                type: "reminder_cancelled",
                                content: `🚫 Reminder "${content}" has been cancelled`,
                            };
                        }
                        return msg;
                    });
                }

                return updated;
            });
        };

        // REGISTER HANDLERS
        socket.on("connect", onConnect);
        socket.on("loadMessages", onLoadMessages);
        socket.on("receiveMessage", onReceiveMessage);
        socket.on("reactionUpdated", onReactionUpdated);
        socket.on("messagePinned", onMessagePinned);
        socket.on("messageUnpinned", onMessageUnpinned);
        socket.on("messagesRead", onMessagesRead);
        socket.on("incomingVideoCall", onIncomingVideoCall);
        socket.on("videoCallAccepted", onVideoCallAccepted);
        socket.on("videoCallRejected", onVideoCallRejected);
        socket.on("videoCallMissed", onVideoCallMissed);
        socket.on("call-ended", onCallEnded);
        socket.on("reminderUpdated", onReminderUpdated);
        socket.on("reminderCancelled", onReminderCancelled);

        return () => {
            // CLEANUP SPECIFIC HANDLERS
            socket.off("connect", onConnect);
            socket.off("loadMessages", onLoadMessages);
            socket.off("receiveMessage", onReceiveMessage);
            socket.off("reactionUpdated", onReactionUpdated);
            socket.off("messagePinned", onMessagePinned);
            socket.off("messageUnpinned", onMessageUnpinned);
            socket.off("messagesRead", onMessagesRead);
            socket.off("incomingVideoCall", onIncomingVideoCall);
            socket.off("videoCallAccepted", onVideoCallAccepted);
            socket.off("videoCallRejected", onVideoCallRejected);
            socket.off("videoCallMissed", onVideoCallMissed);
            socket.off("call-ended", onCallEnded);
            socket.off("reminderUpdated", onReminderUpdated);
            socket.off("reminderCancelled", onReminderCancelled);
        };
    }, []);


    /* JOIN ROOM  */
    const joinRoom = useCallback((roomId: string) => {
        const socket = socketRef.current;
        if (!socket || !roomId) return;

        if (currentRoom.current && currentRoom.current !== roomId) {
            socket.emit("leaveRoom", currentRoom.current);
        }

        currentRoom.current = roomId;
        socket.emit("joinRoom", roomId);
    }, []);

    /* LEAVE ROOM */
    const leaveRoom = useCallback(() => {
        const socket = socketRef.current;
        if (!socket) return;

        socket.emit("leaveRoom");
        currentRoom.current = "";
    }, []);

    /* SEND MESSAGE */
    const sendMessage = useCallback(
        (
            content: string,
            images?: string[],
            fileUrl?: string,
            replyTo?: ReplyPreview | null
        ) => {
            const socket = socketRef.current;
            if (!socket || !currentRoom.current || !userId) return;
            if (!content && !images?.length && !fileUrl) return;

            socket.emit("sendMessage", {
                content,
                images: images || [],
                fileUrl: fileUrl || "",
                userId,
                roomId: currentRoom.current,
                replyTo: replyTo ?? null,
            });

            socket.emit("stopTyping", {
                roomId: currentRoom.current,
                userId,
            });
        },
        [userId]
    );

    /* REACTION */
    const sendReaction = useCallback(
        (messageId: string, type: string) => {
            const socket = socketRef.current;
            if (!socket || !userId) return;

            socket.emit("sendReaction", {
                messageId,
                userId,
                type,
            });
        },
        [userId]
    );

    /*  TYPING */
    const sendTyping = useCallback(
        (roomId: string) => {
            const socket = socketRef.current;
            if (!socket || !userId) return;

            socket.emit("typing", { roomId, userId });
        },
        [userId]
    );

    const sendStopTyping = useCallback(
        (roomId: string) => {
            const socket = socketRef.current;
            if (!socket || !userId) return;

            socket.emit("stopTyping", { roomId, userId });
        },
        [userId]
    );



    /* VIDEO CALL FUNCTIONS */
    const acceptVideoCall = useCallback(async (videoRoomId: string, to: string, callId?: string) => {
        const socket = socketRef.current;
        if (!socket) return;

        // Use incomingVideoCall roomId if available
        const chatRoomId = incomingVideoCall?.roomId || "";

        console.log("✅ Accepting video call, room:", videoRoomId);

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
        const socket = socketRef.current;
        if (!socket) return;

        // Use current incomingVideoCall state to get roomId if available
        const roomId = incomingVideoCall?.roomId || currentRoom.current;

        console.log("❌ Rejecting video call, roomId:", roomId);
        socket.emit("rejectVideoCall", { to, roomId });
        setIncomingVideoCall(null);
    }, [incomingVideoCall]);

    const endVideoCall = useCallback((to: string, roomId: string, duration: number) => {
        const socket = socketRef.current;
        if (!socket) return;

        console.log("📞 Ending video call", { to, roomId, duration });
        socket.emit("endVideoCall", { to, roomId, duration });
    }, []);

    /*  INITIATE VIDEO CALL (GỌI API TRƯỚC) */
    const initiateVideoCall = useCallback(async (otherUserId: string, roomId: string) => {
        const socket = socketRef.current;
        if (!socket || !userId) return;

        try {
            console.log("📹 Initiating video call...");

            // GỌI API TẠO CALL RECORD
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888";
            const token = typeof window !== 'undefined'
                ? (localStorage.getItem("accessToken") || localStorage.getItem("token"))
                : null;

            const response = await fetch(`${API_URL}/calls/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    callerId: userId,
                    recipientId: otherUserId,
                    callType: 'VIDEO',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to initiate call');
            }

            const data = await response.json();
            console.log("✅ Call created:", data);

            // SAU KHI CÓ CALLID, EMIT SOCKET
            socket.emit("startVideoCall", {
                roomId: roomId,
                from: userId,
                to: otherUserId,
                callId: data.callId,
                videoRoomId: data.videoRoomId,
            });

            // 🔥 Dispatch custom event to open floating video call instead of redirect
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('startFloatingVideoCall', {
                    detail: {
                        videoRoomId: data.videoRoomId,
                        chatRoomId: roomId,
                        otherUserId: otherUserId,
                        callerId: userId,
                        callId: data.callId
                    }
                }));
            }

        } catch (error) {
            console.error("❌ Failed to initiate video call:", error);
            alert("Không thể khởi tạo cuộc gọi. Vui lòng thử lại.");
        }
    }, [userId]);


    /*  UPLOAD FILE */
    const uploadFile = useCallback(async (file: File): Promise<string> => {
        const ACTIONS_URL = process.env.NEXT_PUBLIC_ACTIONS_URL!;
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${ACTIONS_URL}/api/upload`, {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data?.url) {
            throw new Error(data?.error || "Upload failed");
        }

        return `${ACTIONS_URL}${data.url}`;
    }, []);

    /*  MESSAGE HIỆN TẠI (THEO ROOM) */
    const messages = currentRoom.current
        ? messagesByRoom[currentRoom.current] || []
        : [];

    return {
        messages,
        joinRoom,
        leaveRoom,
        sendMessage,
        sendReaction,
        uploadFile,
        sendTyping,
        sendStopTyping,
        incomingVideoCall,
        acceptVideoCall,
        rejectVideoCall,
        initiateVideoCall,
        endVideoCall,
    };
}
