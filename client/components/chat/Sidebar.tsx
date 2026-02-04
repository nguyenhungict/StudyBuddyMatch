"use client";

import { useEffect, useMemo, useState } from "react";
import ConversationItem from "./ConversationItem";
import type { Conversation } from "@/hooks/useConversations";
import { useOnlineUsers } from "@/context/PresenceContext";

interface SidebarProps {
  currentUser: string;
  activeRoom: string | null;
  onSelectRoom: (roomId: string) => void;
  conversations: Conversation[];
  onConversationUpdate?: (roomId: string, updates: Partial<Conversation>) => void;
  onViewProfile?: (userId: string) => void;
}

// 🔤 normalize: lowercase + bỏ dấu
function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const RECENT_KEY = "recent_chat_searches";

export default function Sidebar({
  currentUser,
  activeRoom,
  onSelectRoom,
  conversations,
  onConversationUpdate,
  onViewProfile,
}: SidebarProps) {

  const onlineUsers = useOnlineUsers();
  const [search, setSearch] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // 🔁 LOAD RECENT SEARCH
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_KEY);
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // 💾 SAVE RECENT SEARCH
  const saveRecent = (name: string) => {
    if (!name) return;
    if (name === currentUser) return;
    setRecentSearches((prev) => {
      const updated = [
        name,
        ...prev.filter((n) => n !== name),
      ].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // 🔍 FILTER CONVERSATIONS
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const keyword = normalize(search);
    return conversations.filter((convo) => {
      return normalize(convo.otherUserName || "").includes(keyword);
    });
  }, [search, conversations]);

  // 🗑️ HANDLE CLEAR CHAT
  const handleClearChat = async (roomId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888";
      const response = await fetch(`${API_URL}/conversations/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          userId: currentUser,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to clear chat');
      }

      const data = await response.json();
      // Update conversation in local state
      if (onConversationUpdate && data.clearedAt) {
        onConversationUpdate(roomId, { clearedAt: data.clearedAt });
      }
    } catch (error) {
      console.error("❌ Failed to clear chat:", error);
    }
  };

  return (
    <div className="w-[300px] flex flex-col h-full min-h-0 bg-background/80 backdrop-blur-md border-r border-white/10 text-foreground shadow-lg">
      {/* HEADER */}
      <div className="px-4 py-4 border-b border-border text-2xl font-bold bg-white/5">
        Messages
      </div>

      {/* 🔍 SEARCH BOX */}
      <div className="px-3 py-3 border-b border-border">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="
            w-full rounded-xl px-4 py-2.5 text-sm
            bg-muted/50 text-foreground
            border border-border
            placeholder:text-muted-foreground
            outline-none
            focus:ring-2 focus:ring-primary/20 focus:border-primary
            transition-all
          "
        />

        {/* 🕘 RECENT SEARCH */}
        {search.trim() && recentSearches.length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              Recent searches
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((name) => (
                <div
                  key={name}
                  className="
                    flex items-center gap-1
                    text-xs px-2.5 py-1 rounded-full
                    bg-secondary/50 text-secondary-foreground
                    hover:bg-secondary
                    border border-border
                    transition-colors
                  "
                >
                  <button
                    className="focus:outline-none"
                    onClick={() => setSearch(name)}
                  >
                    {name}
                  </button>
                  <button
                    className="
                      ml-1 text-muted-foreground hover:text-destructive
                      text-[10px] leading-none
                      transition-colors
                    "
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRecentSearches((prev) => {
                        const updated = prev.filter((n) => n !== name);
                        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
                        return updated;
                      });
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 📜 CONVERSATION LIST */}
      <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-1">
        {filteredConversations.map((convo) => {
          const other = convo.otherUserName;
          const isOnline = convo.otherUserId ? onlineUsers.includes(convo.otherUserId) : false;

          return (
            <ConversationItem
              key={convo.roomId}
              name={other || "Unknown"}
              avatar={convo.otherUserAvatar}
              roomId={convo.roomId}
              active={activeRoom === convo.roomId}
              online={isOnline}
              lastMessage={convo.lastMessage}
              unread={convo.unreadCount || 0}
              highlight={search}
              onClearChat={handleClearChat}
              clearedAt={convo.clearedAt}
              updatedAt={convo.updatedAt}
              otherUserId={convo.otherUserId}
              onViewProfile={onViewProfile}
              onClick={() => {
                if (search.trim() && other && other !== currentUser) {
                  saveRecent(other);
                }
                onSelectRoom(convo.roomId);
                setSearch("");
              }}
            />
          );
        })}

        {search.trim() && filteredConversations.length === 0 && (
          <div className="px-4 py-8 text-sm text-muted-foreground text-center">
            No results found
          </div>
        )}
      </div>
    </div>
  );
}
