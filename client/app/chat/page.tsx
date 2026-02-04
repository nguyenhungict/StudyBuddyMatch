"use client";

import { ChatProvider } from "@/hooks/ChatContext";
import ChatPageContent from "@/components/chat/ChatPageContent";

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  );
}
