"use client";
import { useState, useEffect, useRef } from "react";
import { Paperclip, MessageSquare } from "lucide-react";
import { UserCircle2 } from "lucide-react";

interface ConversationItemProps {
  name: string;
  avatar?: string;
  roomId: string;
  active: boolean;
  online: boolean;
  lastMessage?: string;
  unread: number;
  onClick: () => void;
  highlight?: string;
  onClearChat?: (roomId: string) => void;
  clearedAt?: string;  // Timestamp when chat was cleared
  updatedAt?: string;  // Timestamp of latest message
  otherUserId?: string;  // User ID of the other user
  onViewProfile?: (userId: string) => void;  // Callback to view profile
}

function highlightText(text: string, keyword?: string) {
  if (!keyword) return text;
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const index = lowerText.indexOf(lowerKeyword);
  if (index !== 0) return text;

  return (
    <>
      <span className="text-amber-500 font-semibold text-shadow-sm">
        {text.slice(0, keyword.length)}
      </span>
      {text.slice(keyword.length)}
    </>
  );
}

// Convert Vietnamese call messages to English for display
function formatLastMessage(message?: string): React.ReactNode {
  if (!message) return <span className="text-muted-foreground italic">No messages yet</span>;

  // Map Vietnamese to English
  const translations: Record<string, string> = {
    "📞 Cuộc gọi nhỡ": "📞 Missed Call",
    "📞 Cuộc gọi thoại": "📞 Video Call",
    "📞 Cuộc gọi bị từ chối": "📞 Call Rejected",
    "Cuộc gọi nhỡ": "Missed Call",
    "Cuộc gọi thoại": "Video Call",
    "Cuộc gọi bị từ chối": "Call Rejected",
    "Tin nhắn đã bị thu hồi": "Message recalled",
  };

  if (message === "📎 File" || message === "File") {
    return (
      <span className="flex items-center gap-1">
        <Paperclip className="w-3 h-3" /> File
      </span>
    );
  }

  if (message.includes("(đã chỉnh sửa)")) {
    return message.replace("(đã chỉnh sửa)", "(edited)");
  }

  return translations[message] || message;
}


export default function ConversationItem({
  name,
  avatar,
  roomId,
  active,
  online,
  lastMessage,
  unread,
  onClick,
  highlight,
  onClearChat,
  clearedAt,
  updatedAt,
  otherUserId,
  onViewProfile,
}: ConversationItemProps) {
  const [openMenu, setOpenMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

  return (
    <div
      onClick={onClick}
      className={`
        group relative flex items-center justify-between
        px-3 py-3 mx-2 rounded-xl cursor-pointer
        transition-all duration-200
        ${active ? "bg-amber-500/15 text-foreground shadow-sm" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"}
      `}
    >

      <div className="flex items-center gap-3 overflow-hidden">
        {/* AVATAR */}
        <div className="relative flex-shrink-0 h-11 w-11">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-full w-full rounded-full object-cover border border-border/10"
            />
          ) : (
            <div className="h-full w-full rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <UserCircle2 className="w-6 h-6" />
            </div>
          )}

          {online && (
            <span className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-[3px] border-background" />
          )}
        </div>

        {/* INFO */}
        <div className="flex flex-col min-w-0">
          <span className={`text-sm font-semibold truncate ${active ? 'text-amber-500' : 'text-foreground'}`}>
            {highlightText(name, highlight)}
          </span>
          <span
            className={`
              text-xs truncate max-w-[120px]
              ${unread > 0 && !active ? "font-bold text-foreground" : "text-muted-foreground"}
            `}
          >
            {clearedAt && updatedAt && new Date(clearedAt) >= new Date(updatedAt)
              ? <span className="italic opacity-50">History cleared</span>
              : formatLastMessage(lastMessage)
            }
          </span>
        </div>
      </div>

      {/* UNREAD BADGE */}
      {unread > 0 && (
        <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-black text-[10px] font-bold shadow-sm">
          {unread > 99 ? "99+" : unread}
        </span>
      )}

      {/* ⋯ ACTION MENU BUTTON (Only show on hover or active) */}
      <button
        className={`
          absolute right-2 opacity-0 group-hover:opacity-100 ${active ? "opacity-100" : ""}
          transition-opacity duration-200 p-1.5 rounded-full hover:bg-background/20
          text-muted-foreground hover:text-foreground
        `}
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenu((prev) => !prev);
        }}
      >
        <span className="text-lg leading-none mb-2">...</span>
      </button>

      {/* MENU DROPDOWN */}
      {openMenu && (
        <div
          ref={menuRef}
          className="
            absolute right-[-10px] top-8
            w-40 rounded-lg
            bg-popover border border-border shadow-xl
            text-sm text-popover-foreground
            z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100
          "
          onClick={(e) => e.stopPropagation()}
        >
          {otherUserId && onViewProfile && (
            <button
              className="w-full px-4 py-2.5 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors"
              onClick={() => {
                setOpenMenu(false);
                onViewProfile(otherUserId);
              }}
            >
              <UserCircle2 className="w-4 h-4" /> View Profile
            </button>
          )}

          <button
            className="w-full px-4 py-2.5 text-left text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 transition-colors"
            onClick={() => {
              setOpenMenu(false);
              setShowClearConfirm(true);
            }}
          >
            <MessageSquare className="w-4 h-4" /> Delete chat
          </button>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-card border border-border p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-card-foreground mb-2 text-center">
              Clear conversation?
            </h3>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              This will only delete the message history for you.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-colors"
                onClick={(e) => {
                  e.stopPropagation(); // Stop propagation to parent
                  setShowClearConfirm(false)
                }}
              >
                Cancel
              </button>

              <button
                className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClearChat) {
                    onClearChat(roomId);
                  }
                  setShowClearConfirm(false);
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
