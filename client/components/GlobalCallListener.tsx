"use client";

import { useAuth } from "@/context/AuthContext";
import { useIncomingCall } from "@/hooks/useIncomingCall";
import { useConversations } from "@/hooks/useConversations";
import IncomingVideoCallPopup from "@/components/IncomingVideoCallPopup";
import { usePathname } from "next/navigation";

export default function GlobalCallListener() {
    const { user } = useAuth();
    const userId = user?.id || null;
    const pathname = usePathname();

    // Use separate hook ONLY for incoming calls - doesn't interfere with other socket listeners
    const { incomingVideoCall, acceptVideoCall, rejectVideoCall } = useIncomingCall(userId);

    // Use useConversations to get caller info
    const { conversations } = useConversations(userId || "", null);

    // Don't render on chat page - ChatPageContent already handles it there
    if (pathname === "/chat") {
        return null;
    }

    // Don't render if no incoming call
    if (!incomingVideoCall) {
        return null;
    }

    // Find caller info from conversations
    const callerConversation = conversations.find(
        (c) => c.otherUserId === incomingVideoCall.from
    );

    return (
        <IncomingVideoCallPopup
            from={incomingVideoCall.from}
            callerName={callerConversation?.otherUserName || "Người dùng"}
            callerAvatar={callerConversation?.otherUserAvatar}
            onAccept={() =>
                acceptVideoCall(
                    incomingVideoCall.videoRoomId,
                    incomingVideoCall.from,
                    incomingVideoCall.callId
                )
            }
            onReject={() => rejectVideoCall(incomingVideoCall.from)}
        />
    );
}
