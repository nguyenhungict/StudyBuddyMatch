"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/hooks/useChat";
import { useConversations } from "@/hooks/useConversations";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import UserProfileModal from "./UserProfileModal";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ChatPageContent() {
    const { user, loading } = useAuth();
    const searchParams = useSearchParams();
    const initialRoomId = searchParams.get("roomId");

    const [activeRoom, setActiveRoom] = useState<string | null>(initialRoomId);
    const [profileUserId, setProfileUserId] = useState<string | null>(null);

    const userId = user?.id || null;
    const chat = useChat(userId);
    const { conversations, setConversations } = useConversations(userId || "", activeRoom);

    useEffect(() => {
        if (initialRoomId) {
            setActiveRoom(initialRoomId);
        }
    }, [initialRoomId]);

    const activeConversation = conversations.find(
        (c) => c.roomId === activeRoom
    );

    // Handler to update conversation after clear chat
    const handleConversationUpdate = (roomId: string, updates: Partial<typeof conversations[0]>) => {
        setConversations(prev =>
            prev.map(c => c.roomId === roomId ? { ...c, ...updates } : c)
        );
    };

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        // ❌ khóa scroll toàn trang khi ở chat để trải nghiệm app native hơn
        document.body.style.overflow = "hidden";
        return () => {
            // ✅ trả lại scroll khi rời chat
            document.body.style.overflow = originalOverflow || "auto";
        };
    }, []);

    // ✅ Leave room when leaving chat page
    useEffect(() => {
        const handleBeforeUnload = () => {
            chat.leaveRoom();
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            chat.leaveRoom();
        };
    }, []);


    if (loading) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-transparent text-muted-foreground">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <p>Loading chat...</p>
                </div>
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-transparent text-muted-foreground">
                Please login to use chat.
            </div>
        );
    }


    return (
        <div
            className="
            fixed
            top-16
            left-0
            right-0
            bottom-0
            flex
            bg-transparent
            text-foreground
            overflow-hidden
            "
        >
            <Sidebar
                currentUser={userId}
                activeRoom={activeRoom}
                conversations={conversations}
                onSelectRoom={setActiveRoom}
                onConversationUpdate={handleConversationUpdate}
                onViewProfile={setProfileUserId}
            />


            <ChatWindow
                roomId={activeRoom}
                userId={userId}
                messages={chat.messages}
                joinRoom={chat.joinRoom}
                sendMessage={chat.sendMessage}
                uploadFile={chat.uploadFile}
                sendReaction={chat.sendReaction}
                conversation={activeConversation}
                initiateVideoCall={chat.initiateVideoCall}
                currentUserName={user?.name || user?.email || "You"}
            />



            {/* 👤 USER PROFILE MODAL */}
            <UserProfileModal
                userId={profileUserId || ""}
                isOpen={!!profileUserId}
                onClose={() => setProfileUserId(null)}
            />
        </div>
    );
}