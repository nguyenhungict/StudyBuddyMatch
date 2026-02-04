"use client";

import { useEffect, useMemo } from "react";
import ChatContainer from "../ui/ChatContainer";
import type { Message } from "@/hooks/useChat";
import type { Conversation } from "@/hooks/useConversations";
import { MessageSquare } from "lucide-react";


interface ChatWindowProps {
  roomId: string | null;
  userId: string;
  messages: Message[];
  joinRoom: (roomId: string) => void;
  sendMessage: (content: string, images?: string[], fileUrl?: string) => void;
  uploadFile: (file: File) => Promise<string>;
  sendReaction: (messageId: string, type: string) => void;
  conversation?: Conversation;
  initiateVideoCall?: (otherUserId: string, roomId: string) => Promise<void>;
  currentUserName?: string;
}

export default function ChatWindow({
  roomId,
  userId,
  messages,
  joinRoom,
  sendMessage,
  uploadFile,
  sendReaction,
  conversation,
  initiateVideoCall,
  currentUserName,
}: ChatWindowProps) {
  useEffect(() => {
    if (!roomId) return;
    joinRoom(roomId);
  }, [roomId, joinRoom]);

  // Filter messages based on clearedAt timestamp
  const filteredMessages = useMemo(() => {
    if (!conversation?.clearedAt) {
      return messages;
    }

    const clearedTime = new Date(conversation.clearedAt).getTime();
    return messages.filter((msg) => {
      if (!msg.createdAt) return true;
      return new Date(msg.createdAt).getTime() > clearedTime;
    });
  }, [messages, conversation?.clearedAt]);

  if (!roomId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-transparent text-muted-foreground p-8">
        <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mb-6">
          <MessageSquare className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-foreground">Select a conversation</h3>
        <p className="text-sm max-w-sm text-center">Choose a match from the sidebar to start chatting or find new study buddies.</p>
      </div>
    );
  }

  //const otherUser = roomId.split("_").find((x) => x !== userId) ?? "";

  return (
    <div className="flex-1 bg-transparent text-foreground flex flex-col min-w-0">
      <ChatContainer
        userId={userId}
        otherUserId={conversation?.otherUserId || ""}
        otherUserName={conversation?.otherUserName || "Chat"}
        otherUserAvatar={conversation?.otherUserAvatar}
        roomId={roomId}
        messages={filteredMessages}
        onSendMessage={sendMessage}
        uploadFile={uploadFile}
        onSendReaction={sendReaction}
        initiateVideoCall={initiateVideoCall}
        currentUserName={currentUserName}
      />
    </div>
  );
}
