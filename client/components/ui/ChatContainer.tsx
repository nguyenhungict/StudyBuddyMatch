"use client";

import { useEffect, useRef, useState } from "react";
import ChatInput from "./ChatInput";
import type { Message } from "@/hooks/useChat";
import { getSocket } from "@/utils/socketSingleton";
import MessageSearchPanel from "../chat/MessageSearchPanel";
import CreateReminderModal from "../chat/CreateReminderModal";
import ReminderDetailModal from "../chat/ReminderDetailModal";
import { Video, Search, Clock, Paperclip, FileText } from "lucide-react";
import { useOnlineUsers } from "@/context/PresenceContext";
import { ReportModal, ReportTargetType } from "@/components/report-modal";


interface ChatContainerProps {
  userId: string;
  otherUserId: string;
  otherUserAvatar?: string;
  roomId: string;
  messages: Message[];
  onSendMessage: (content: string, images?: string[], fileUrl?: string) => void;
  uploadFile: (file: File) => Promise<string>;
  onSendReaction: (messageId: string, type: string) => void;
  otherUserName: string;
  initiateVideoCall?: (otherUserId: string, roomId: string) => Promise<void>;
  currentUserName?: string;
}

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export default function ChatContainer({
  userId,
  otherUserId,
  otherUserAvatar,
  roomId,
  messages,
  onSendMessage,
  uploadFile,
  onSendReaction,
  otherUserName,
  initiateVideoCall,
  currentUserName,
}: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [openReactionFor, setOpenReactionFor] = useState<string | null>(null);
  const [openActionFor, setOpenActionFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const [replyingMessage, setReplyingMessage] = useState<{
    messageId: string;
    userId: string;
    content?: string;
    images?: string[];
    fileUrl?: string;
  } | null>(null);

  // REMINDER STATES
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showReminderDetail, setShowReminderDetail] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<{
    reminderId: string;
    content: string;
    scheduledDate: Date | string;
    creatorName: string;
    creatorId: string;
    createdAt?: Date | string;
  } | null>(null);
  const [cancelledReminders, setCancelledReminders] = useState<Set<string>>(new Set());
  const [showCancelledToast, setShowCancelledToast] = useState(false);

  // LOCAL EDIT CACHE 
  const [editedCache, setEditedCache] = useState<Record<string, string>>({});

  const messageListRef = useRef<HTMLDivElement | null>(null);
  const [showNewMsgBtn, setShowNewMsgBtn] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastMsgIdRef = useRef<string | null>(null);
  const [hasUnreadNewMsg, setHasUnreadNewMsg] = useState(false);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const [reportingMessage, setReportingMessage] = useState<{ messageId: string; content: string; userId: string } | null>(null);


  const CHATSERVER_URL = process.env.NEXT_PUBLIC_CHATSERVER_URL!;


  const resolveImageUrl = (img: string) => {
    if (!img) return "";

    if (img.startsWith("http://") || img.startsWith("https://")) {
      return img;
    }

    return `${CHATSERVER_URL}${img}`;
  };

  // Helper function to get original filename (remove timestamp prefix)
  const getOriginalFileName = (fileUrl: string) => {
    const fileName = fileUrl.split("/").pop() || "";
    // Pattern: timestamp-originalname (e.g., 1768030565587-all_matches.json)
    const match = fileName.match(/^\d+-(.+)$/);
    return match ? match[1] : fileName;
  };


  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);


  //  DELETE MENU STATE 
  const [openDeleteFor, setOpenDeleteFor] = useState<{
    messageId: string;
    isMine: boolean;
  } | null>(null);

  // HIDDEN MESSAGES (REMOVE FOR ME)
  const [hiddenMessages, setHiddenMessages] = useState<string[]>([]);
  useEffect(() => {
    const key = `hiddenMessages_${userId}_${roomId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setHiddenMessages(JSON.parse(stored));
    } else {
      setHiddenMessages([]);
    }
  }, [userId, roomId]);

  // LISTEN FOR REMINDER CANCELLED
  useEffect(() => {
    const handleReminderCancelled = ({ reminderId, content }: { reminderId: string; content: string }) => {
      console.log("🚫 Reminder cancelled received:", reminderId, content);
      setCancelledReminders(prev => new Set(prev).add(reminderId));
    };

    socket.on("reminderCancelled", handleReminderCancelled);

    return () => {
      socket.off("reminderCancelled", handleReminderCancelled);
    };
  }, []);

  //  REVOKED MESSAGES 
  const [revokedMessages, setRevokedMessages] = useState<string[]>([]);

  //  SCROLL + HIGHLIGHT REPLY TARGET
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);

  //  TYPING STATE
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const socket = getSocket();

  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  const [openSearch, setOpenSearch] = useState(false);
  const [extraMessages, setExtraMessages] = useState<Message[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL!;

  const onlineUsers = useOnlineUsers() ?? [];
  const isOtherOnline = onlineUsers.includes(otherUserId);



  const handleRightClick = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    setOpenReactionFor(messageId);
  };

  // scroll khi có tin mới
  useEffect(() => {
    if (!messages.length) return;

    const last = messages[messages.length - 1];
    if (!last?._id) return;

    if (lastMsgIdRef.current === last._id) return;
    lastMsgIdRef.current = last._id;

    //  MÌNH GỬI LUÔN SCROLL
    if (last.userId === userId) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      });
      setHasUnreadNewMsg(false);
      return;
    }

    if (isAtBottom) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    } else {
      setHasUnreadNewMsg(true);
    }
  }, [messages, isAtBottom, userId]);

  useEffect(() => {
    if (!openSearch) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchPanelRef.current &&
        !searchPanelRef.current.contains(e.target as Node)
      ) {
        setOpenSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openSearch]);


  // SCROLL LISTENER
  useEffect(() => {
    const el = messageListRef.current;
    if (!el) return;

    const handleScroll = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;

      const atBottom = distanceFromBottom < 80;
      setIsAtBottom(atBottom);

      if (atBottom) {
        setHasUnreadNewMsg(false);
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);


  // Close reaction bar
  useEffect(() => {
    const close = () => setOpenReactionFor(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const roomMessages = [
    ...extraMessages,
    ...messages.filter((m) => m.roomId === roomId),
  ].filter(
    (msg, index, self) =>
      index === self.findIndex((m) => m._id === msg._id)
  );

  const visibleMessages = roomMessages.filter(
    (m) => !hiddenMessages.includes(m._id!)
  );
  const lastMessage = visibleMessages[visibleMessages.length - 1];

  const isLastMine = lastMessage?.userId === userId;
  const isSeen = isLastMine && lastMessage?.readBy?.includes(otherUserId);
  const pinnedMessage = [...roomMessages]
    .reverse()
    .find(
      (m) =>
        m.isPinned &&
        !m.isRevoked &&
        !revokedMessages.includes(m._id!)
    );


  const pinnedByName =
    pinnedMessage?.pinnedBy === userId
      ? "You"
      : pinnedMessage?.pinnedBy === otherUserId
        ? otherUserName
        : "Someone";


  //  PREVIEW TEXT FOR PINNED MESSAGE
  const getPinnedPreview = (msg: Message) => {
    if (msg.images && msg.images.length > 0) {
      return "Ảnh";
    }

    if (msg.fileUrl) {
      return "File";
    }

    return msg.content || "Tin nhắn";
  };

  useEffect(() => {
    if (!pendingScrollId) return;

    if (messageRefs.current[pendingScrollId]) return;

    const fetchMessage = async () => {
      try {
        const res = await fetch(
          `http://localhost:8888/messages/${pendingScrollId}`
        );
        const msg = await res.json();

        if (msg && msg._id && msg.roomId === roomId) {
          setExtraMessages((prev) => [msg, ...prev]);
        }

      } catch (e) {
        console.error("Load message failed", e);
      }
    };

    fetchMessage();
  }, [pendingScrollId]);


  useEffect(() => {
    if (!pendingScrollId) return;

    const raf = requestAnimationFrame(() => {
      const el = messageRefs.current[pendingScrollId];
      if (!el) return;

      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      setHighlightMessageId(pendingScrollId);

      setTimeout(() => {
        setHighlightMessageId(null);
      }, 1500);

      setPendingScrollId(null);
    });

    return () => cancelAnimationFrame(raf);
  }, [pendingScrollId, extraMessages]);




  //  REALTIME SEEN
  useEffect(() => {
    const handler = ({
      roomId: rId,
      userId: reader,
    }: {
      roomId: string;
      userId: string;
    }) => {
      if (rId !== roomId) return;

      roomMessages.forEach((m) => {
        if (!m.readBy) m.readBy = [];
        if (!m.readBy.includes(reader)) {
          m.readBy.push(reader);
        }
      });
    };

    socket.on("messagesRead", handler);
    return () => { socket.off("messagesRead", handler); };
  }, [messages, roomId]);


  //  REALTIME REVOKE MESSAGE 
  useEffect(() => {
    const handler = ({ messageId }: { messageId: string }) => {
      setRevokedMessages((prev) =>
        prev.includes(messageId) ? prev : [...prev, messageId]
      );
    };

    socket.on("messageRevoked", handler);
    return () => { socket.off("messageRevoked", handler); };
  }, []);



  //  HỦY EDIT
  useEffect(() => {
    if (!editingId) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        editInputRef.current &&
        !editInputRef.current.contains(e.target as Node)
      ) {
        setEditingId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingId]);


  // REALTIME EDIT MESSAGE 
  useEffect(() => {
    const handler = (payload: any) => {
      // Case 1: server emit { messageId, content }
      const messageId: string | undefined = payload?.messageId || payload?._id;
      const content: string | undefined = payload?.content;

      if (!messageId || typeof content !== "string") return;

      setEditedCache((prev) => ({ ...prev, [messageId]: content }));

      if (editingId === messageId) {
        setEditingId(null);
      }
    };

    socket.on("messageEdited", handler);
    return () => { socket.off("messageEdited", handler); };
  }, [socket, editingId]);

  useEffect(() => {
    setEditedCache({});
    setEditingId(null);
    setEditText("");
  }, [roomId]);

  //  CLOSE ACTION MENU
  useEffect(() => {
    if (!openActionFor) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(e.target as Node)
      ) {
        setOpenActionFor(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openActionFor]);

  //  AUTO SCROLL KHI ĐỔI ROOM
  useEffect(() => {
    lastMsgIdRef.current = null;
    setHasUnreadNewMsg(false);

    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    });
  }, [roomId]);



  //  REALTIME TYPING
  useEffect(() => {
    const handleTyping = ({
      roomId: r,
      userId: typingUser,
    }: {
      roomId: string;
      userId: string;
    }) => {
      if (r !== roomId) return;
      if (typingUser !== otherUserId) return;

      setIsTyping(true);

      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setIsTyping(false), 1800);
    };

    const handleStopTyping = ({
      roomId: r,
      userId: typingUser,
    }: {
      roomId: string;
      userId: string;
    }) => {
      if (r !== roomId) return;
      if (typingUser !== otherUserId) return;

      setIsTyping(false);
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [roomId, otherUserId]);

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 py-3 relative z-10 text-foreground">
        {/*  AVATAR  */}
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12">
            {otherUserAvatar ? (
              <img
                src={otherUserAvatar.startsWith("/uploads") ? `http://localhost:8888${otherUserAvatar}` : otherUserAvatar}
                alt={otherUserName}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-black font-bold">
                {otherUserName?.[0]?.toUpperCase()}
              </div>
            )}

            {isOtherOnline && (
              <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-[#242526]" />
            )}
          </div>


          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-foreground">
              {otherUserName}
            </h3>



            {isTyping ? (
              <span className="text-xs text-blue-400">Entering...</span>
            ) : (
              <div className="flex items-center gap-1">
                {isOtherOnline ? (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs text-green-400">Online</span>
                  </>
                ) : (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
                    <span className="text-xs text-gray-400">Offline</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>


        {/* ACTION ICONS */}
        <div className="flex items-center gap-2">
          {/* 📹 VIDEO CALL */}
          <button
            type="button"
            className="
    flex h-10 w-10 items-center justify-center
    rounded-full
    text-primary
    hover:bg-muted
    transition-colors
  "            title="Video call"
            onClick={async () => {
              if (initiateVideoCall) {
                // Sử DỤNG API MỚI
                await initiateVideoCall(otherUserId, roomId);
              } else {
                // FALLBACK: emit trực tiếp (backward compatible)
                socket.emit("startVideoCall", {
                  roomId,
                  from: userId,
                  to: otherUserId,
                });
              }
            }}
          >
            <Video size={20} className="w-5 h-5" />
          </button>

          {/* SEARCH */}
          <button
            type="button"
            className="
    flex h-10 w-10 items-center justify-center
    rounded-full
    text-primary
    hover:bg-muted
    transition-colors
  "
            title="Search in chat"
            onClick={() => setOpenSearch((prev) => !prev)}
          >
            <Search size={20} className="w-5 h-5" />
          </button>

        </div>
      </div>



      {/*  PINNED MESSAGE BAR */}
      {pinnedMessage && (
        <div className="
  flex items-center justify-between
  bg-gray-100
  px-4 py-2
  text-sm
  text-black
  border-b border-gray-200
">
          <div className="flex items-center gap-2 truncate font-semibold ">
            📌
            <span className="truncate">
              {getPinnedPreview(pinnedMessage)}
            </span>

            <span className="text-xs text-gray-500">
              – {pinnedByName} pinned
            </span>
          </div>

          <button
            className="text-xs text-gray-600 hover:text-black hover:font-semibold"
            onClick={() => {
              if (!pinnedMessage._id) return;

              const el = messageRefs.current[pinnedMessage._id];
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
              setHighlightMessageId(pinnedMessage._id);
              setTimeout(() => setHighlightMessageId(null), 1500);
            }}
          >
            View
          </button>
        </div>
      )}

      {openSearch && (
        <div ref={searchPanelRef}>
          <MessageSearchPanel
            roomId={roomId}
            hiddenMessageIds={hiddenMessages}
            onSelect={(messageId) => {
              setPendingScrollId(messageId);
              setOpenSearch(false);
            }}
          />
        </div>
      )}


      {/* MESSAGE LIST */}
      <div
        ref={messageListRef}
        className="flex-1 space-y-4 overflow-y-auto bg-transparent p-4 text-foreground"
      >

        {roomMessages
          .filter((msg) => !hiddenMessages.includes(msg._id!))
          .map((msg, idx, arr) => {
            const isMe = msg.userId === userId;
            const nextMsg = arr[idx + 1];

            //  RELOAD REVOKE
            const isRevoked = !!msg.isRevoked || revokedMessages.includes(msg._id!);

            const showAvatar =
              !isMe && (!nextMsg || nextMsg.userId !== msg.userId);

            const reactions = msg.reactions ?? [];

            // content hiển thị 
            const displayContent =
              (msg._id && editedCache[msg._id]) ? editedCache[msg._id] : msg.content;

            // edited
            const showEditedTag = !!(msg.isEdited || (msg._id && editedCache[msg._id]));

            // 📞 RENDER CALL BUBBLE
            // Check if it's a call message by type OR by content (for backward compatibility)
            const isCallMessage = msg.type === "call" ||
              (msg.content && (
                msg.content.includes("Cuộc gọi") ||
                msg.content === "Video Call" ||
                msg.content === "Missed Call" ||
                msg.content === "Call Rejected"
              ));

            if (isCallMessage) {
              // Parse call data - either from msg.call or infer from content
              let status = msg.call?.status || 'ended';
              let duration = msg.call?.duration || 0;

              // Fallback: infer status from content if call object is missing
              if (!msg.call && msg.content) {
                if (msg.content.includes("nhỡ") || msg.content.includes("Missed")) {
                  status = 'missed';
                } else if (msg.content.includes("từ chối") || msg.content.includes("Rejected")) {
                  status = 'rejected';
                } else {
                  status = 'ended';
                }
              }

              // DEBUG: Log call data to check duration
              console.log('📞 Call Message:', {
                messageId: msg._id,
                type: msg.type,
                call: msg.call,
                status,
                duration,
                content: msg.content
              });

              const isMissed = status === 'missed' || status === 'rejected';
              // Format duration - always format for ended calls, even if 0
              const mins = Math.floor((duration || 0) / 60);
              const secs = (duration || 0) % 60;

              // Show duration text for ended calls (even if 0), or if duration exists
              let durationText = '';
              if (duration > 0) {
                durationText = `${mins > 0 ? `${mins} phút ` : ''}${secs} giây`;
              } else if (status === 'ended') {
                // For ended calls with no duration, show a placeholder
                durationText = '0 giây';
              }

              // Get time string like "19:02"
              const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

              return (
                <div
                  key={msg._id ?? idx}
                  className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"} mb-4`}
                >
                  {!isMe ? (
                    showAvatar ? (
                      <div className="h-6 w-6 self-end mb-1">
                        {otherUserAvatar ? (
                          <img
                            src={otherUserAvatar.startsWith("/uploads") ? `http://localhost:8888${otherUserAvatar}` : otherUserAvatar}
                            alt={otherUserName}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-black text-xs font-bold">
                            {otherUserName?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-6 w-6" />
                    )
                  ) : (
                    <div className="h-6 w-6" />
                  )}

                  <div className={`p-4 rounded-xl flex flex-col gap-3 min-w-[220px] shadow-sm border ${isMe ? 'bg-[#505050] text-white border-transparent' : 'bg-[#3A3B3C] text-white border-gray-600'}`}>

                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isMissed ? 'bg-[#3A3B3C] border border-red-500' : 'bg-[#4E4F50]'}`}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20" height="20" viewBox="0 0 24 24"
                          fill="none" stroke={isMissed ? "#EF4444" : "white"}
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        >
                          {isMissed ? (
                            <>
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              <line x1="10" x2="23" y1="14" y2="1" />
                            </>
                          ) : (
                            <>
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              <polyline points="1 2 5 6 9 2" />
                            </>
                          )}
                        </svg>
                      </div>

                      <div className="flex flex-col">
                        <span className="font-bold text-sm">
                          {status === 'missed' ? 'Missed Call' :
                            status === 'rejected' ? 'Call Rejected' : 'Video Call'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {timeStr}
                        </span>
                      </div>
                    </div>

                    {/* Button */}
                    <button
                      onClick={async () => {
                        if (initiateVideoCall) {
                          await initiateVideoCall(otherUserId, roomId);
                        } else {
                          socket.emit("startVideoCall", {
                            roomId,
                            from: userId,
                            to: otherUserId,
                          });
                        }
                      }}
                      className="w-full py-2 bg-[#444546] hover:bg-[#5A5B5C] rounded-lg text-sm font-medium transition-colors text-white"
                    >
                      Call Back
                    </button>
                  </div>
                </div>
              );
            }

            // 🚫 RENDER CANCELLED REMINDER / SYSTEM MESSAGE
            if (msg.type === "system" && msg.content?.includes("Cancelled reminder")) {
              // Extract reminder content from message
              const contentMatch = msg.content.match(/Cancelled reminder: (.+)/);
              const reminderContent = contentMatch ? contentMatch[1] : msg.content;

              return (
                <div key={msg._id ?? idx} className="flex justify-center my-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                    {/* Clock with X icon */}
                    <div className="relative">
                      <Clock className="w-4 h-4 text-red-500" />
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[6px] font-bold">×</span>
                      </div>
                    </div>
                    <span>
                      {isMe ? "You" : otherUserName} cancelled reminder <strong>{reminderContent}</strong>
                      {" . "}
                      <button
                        onClick={() => setShowReminderModal(true)}
                        className="text-blue-600 hover:underline"
                      >
                        Create new
                      </button>
                    </span>
                  </div>
                </div>
              );
            }

            // � RENDER CANCELLED REMINDER CARD (when reminder type changed to reminder_cancelled)
            if (msg.type === "reminder_cancelled") {
              // Extract content from message or reminder
              const contentMatch = msg.content?.match(/Reminder "(.+)" has been cancelled/);
              const reminderContent = contentMatch ? contentMatch[1] : (msg.reminder?.content || "");

              return (
                <div key={msg._id ?? idx} className="flex justify-center my-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                    {/* Clock with X icon */}
                    <div className="relative">
                      <Clock className="w-4 h-4 text-red-500" />
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[6px] font-bold">×</span>
                      </div>
                    </div>
                    <span>
                      {isMe ? "You" : otherUserName} cancelled reminder <strong>{reminderContent}</strong>
                      {" . "}
                      <button
                        onClick={() => setShowReminderModal(true)}
                        className="text-blue-600 hover:underline"
                      >
                        Create new
                      </button>
                    </span>
                  </div>
                </div>
              );
            }

            // 📅 RENDER REMINDER BUBBLE
            if (msg.type === "reminder" && msg.reminder) {
              const reminderDate = new Date(msg.reminder.scheduledDate);
              const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const dayOfWeek = dayNames[reminderDate.getDay()];
              const dateTimeStr = `${dayOfWeek}, ${monthNames[reminderDate.getMonth()]} ${reminderDate.getDate()}, ${reminderDate.getFullYear()}`;

              // Check if reminder is cancelled
              const isCancelled = cancelledReminders.has(msg.reminder.reminderId);

              // Helper function to handle view
              const handleViewReminder = () => {
                if (isCancelled) {
                  setShowCancelledToast(true);
                  setTimeout(() => setShowCancelledToast(false), 2000);
                  return;
                }
                setSelectedReminder({
                  reminderId: msg.reminder!.reminderId,
                  content: msg.reminder!.content,
                  scheduledDate: msg.reminder!.scheduledDate,
                  creatorName: msg.reminder!.creatorName,
                  creatorId: msg.userId,
                  createdAt: msg.createdAt,
                });
                setShowReminderDetail(true);
              };

              return (
                <div key={msg._id ?? idx} className="flex flex-col items-center gap-2 my-4">
                  {/* System notification */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                    <Clock className="w-4 h-4 text-red-500" />
                    <span>
                      {isMe ? "You" : msg.reminder.creatorName} created a new reminder{" "}
                      <strong>{msg.reminder.content}</strong> - {dateTimeStr}
                      {" . "}
                      <button
                        onClick={handleViewReminder}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </button>
                    </span>
                  </div>

                  {/* Reminder Card */}
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 min-w-[280px] max-w-[320px]">
                    <div className="flex flex-col items-center gap-3">
                      {/* Clock Icon */}
                      <div className="w-12 h-12 rounded-full border-2 border-red-500 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-red-500" />
                      </div>

                      {/* Content */}
                      <h4 className="font-bold text-gray-900 text-center">{msg.reminder.content}</h4>

                      {/* DateTime */}
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{dateTimeStr}</span>
                      </div>

                      {/* View Detail Button */}
                      <button
                        onClick={handleViewReminder}
                        className="w-full py-2.5 border border-gray-300 rounded-lg text-blue-600 font-medium hover:bg-gray-50 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg._id ?? idx}
                ref={(el) => {
                  if (msg._id) {
                    messageRefs.current[msg._id] = el;
                  }
                }}
                className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}

              >

                {!isMe ? (
                  showAvatar ? (
                    <div className="h-6 w-6 self-end mb-1">
                      {otherUserAvatar ? (
                        <img
                          src={otherUserAvatar.startsWith("/uploads") ? `http://localhost:8888${otherUserAvatar}` : otherUserAvatar}
                          alt={otherUserName}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-black text-xs font-bold">
                          {otherUserName?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>


                  ) : (
                    <div className="h-6 w-6" />
                  )
                ) : (
                  <div className="h-6 w-6" />
                )}

                <div className={`relative flex max-w-[70%] flex-col group ${isMe ? "pl-10" : "pr-10"}`}>
                  {/* ⋯ ACTION MENU BUTTON */}
                  <button
                    className={`
    absolute top-1/2 -translate-y-1/2
    ${isMe ? "left-2" : "right-2"}
    text-gray-400
    ${openActionFor === msg._id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
    transition
    hover:text-black hover:!opacity-100
  `}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionFor(openActionFor === msg._id ? null : msg._id!);
                    }}
                  >
                    ⋯
                  </button>

                  {/* ACTION MENU */}
                  {openActionFor === msg._id && (
                    <div
                      ref={actionMenuRef}
                      className={`
      absolute z-50
      ${isMe ? "-left-36" : "left-full ml-2"}
      top-1/2 -translate-y-1/2
      w-36
      rounded-lg
      bg-gray-200
      shadow-lg
      border border-gray-300
      text-sm
      rounded-lg
      overflow-hidden
    `}
                    >
                      {/*  REVOKED  */}
                      {!isRevoked && (
                        <>
                          {/* ↩️ REPLY */}
                          <button
                            className="w-full px-3 py-2 text-left hover:bg-gray-300"
                            onClick={() => {
                              setReplyingMessage({
                                messageId: msg._id!,
                                userId: msg.userId,
                                content: msg.content,
                                images: msg.images,
                                fileUrl: msg.fileUrl,
                              });
                              setOpenActionFor(null);
                            }}
                          >
                            Reply
                          </button>

                          {/*  PIN / UNPIN */}
                          <button
                            className="w-full px-3 py-2 text-left hover:bg-gray-300"
                            onClick={() => {
                              if (!msg._id) return;
                              if (msg.isPinned) {
                                socket.emit("unpinMessage", { messageId: msg._id });
                              } else {
                                socket.emit("pinMessage", { messageId: msg._id });
                              }
                              setOpenActionFor(null);
                            }}
                          >
                            {msg.isPinned ? " Unpin" : " Pin"}
                          </button>

                          {/*  EDIT  */}
                          {isMe && msg.content && (
                            <button
                              className="w-full px-3 py-2 text-left hover:bg-gray-300"
                              onClick={() => {
                                setEditingId(msg._id!);
                                setEditText(displayContent || "");
                                setOpenActionFor(null);
                              }}
                            >
                              Edit
                            </button>
                          )}

                          {/*  REPORT  */}
                          {!isMe && (
                            <button
                              className="w-full px-3 py-2 text-left text-red-600 hover:bg-gray-300"
                              onClick={() => {
                                setReportingMessage({
                                  messageId: msg._id!,
                                  content: displayContent || msg.content || '',
                                  userId: msg.userId,
                                });
                                setOpenActionFor(null);
                              }}
                            >
                              Report
                            </button>
                          )}
                        </>
                      )}

                      {/* RECALL */}
                      <button
                        className="w-full px-3 py-2 text-left text-black hover:bg-gray-300"
                        onClick={() => {
                          setOpenDeleteFor({
                            messageId: msg._id!,
                            isMine: isMe,
                          });
                          setOpenActionFor(null);
                        }}
                      >
                        Recall
                      </button>
                    </div>
                  )}

                  {/* MESSAGE CONTENT OR REVOKED */}
                  {isRevoked ? (
                    <div
                      className={`rounded-2xl px-4 py-2 text-sm italic ${isMe
                        ? "rounded-br-none bg-gray-600/40 text-gray-500"
                        : "rounded-bl-none bg-gray-600/40 text-gray-500"
                        }`}
                    >
                      Message has been recalled
                    </div>
                  ) : (
                    msg.content && (
                      <>
                        {/*  REPLY PREVIEW  */}
                        {msg.replyTo && msg.replyTo.messageId && (() => {
                          const targetId = msg.replyTo.messageId;
                          const isTargetRevoked = revokedMessages.includes(targetId);

                          return (
                            <div
                              className={`
        mb-1 rounded-lg px-3 py-2 text-xs
        ${isTargetRevoked
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : isMe
                                    ? "bg-gray-600/40 cursor-pointer hover:opacity-80"
                                    : "bg-gray-600/40 cursor-pointer hover:opacity-80"}
        border-l-4 ${isTargetRevoked ? "border-gray-400" : "border-blue-400"}
      `}
                              onClick={() => {
                                if (isTargetRevoked) return;

                                const el = messageRefs.current[targetId];
                                if (!el) return;

                                el.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });

                                setHighlightMessageId(targetId);
                                setTimeout(() => setHighlightMessageId(null), 1500);
                              }}
                            >
                              <div className="font-semibold mb-0.5">
                                ↩️{" "}
                                {msg.replyTo.userId === userId ? (
                                  <span className="text-blue-600">You</span>
                                ) : msg.replyTo.userId === otherUserId ? (
                                  <span className="text-blue-600">{otherUserName}</span>
                                ) : null}
                              </div>


                              {isTargetRevoked ? (
                                <div className="italic text-gray-500">
                                  Message has been recalled
                                </div>
                              ) : (
                                <>
                                  {msg.replyTo.content && (
                                    <div className="line-clamp-2 text-gray-200">
                                      {msg.replyTo.content}
                                    </div>
                                  )}

                                  {msg.replyTo.images?.length ? (
                                    <div className="italic text-gray-300">📷 Image</div>
                                  ) : msg.replyTo.fileUrl ? (
                                    <div className="italic text-gray-300 flex items-center gap-1"><Paperclip className="w-3 h-3" /> File</div>
                                  ) : null}
                                </>
                              )}
                            </div>
                          );
                        })()}


                        {/* 💬 MESSAGE BUBBLE — CHỈ HIGHLIGHT KHI LÀ TEXT */}
                        <div
                          className={`
    relative rounded-2xl px-4 py-2 shadow transition-all duration-300
    ${isMe
                              ? "rounded-br-none bg-primary text-primary-foreground"
                              : "rounded-bl-none bg-secondary text-secondary-foreground border border-border"

                            }
    ${msg._id === highlightMessageId &&
                              (!msg.images || msg.images.length === 0) &&
                              !msg.fileUrl
                              ? "ring-2 ring-blue-400 animate-pulse"
                              : ""
                            }
  `}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            if (!msg._id) return;
                            setOpenReactionFor(msg._id);
                          }}
                        >

                          {editingId === msg._id ? (
                            <input
                              value={editText}
                              ref={editInputRef}
                              autoFocus
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (!msg._id) return;

                                if (e.key === "Enter") {
                                  const trimmed = editText.trim();
                                  if (!trimmed) {
                                    setEditingId(null);
                                    return;
                                  }

                                  socket.emit("editMessage", {
                                    messageId: msg._id,
                                    content: trimmed,
                                  });

                                  setEditingId(null);
                                }

                                if (e.key === "Escape") {
                                  setEditingId(null);
                                }
                              }}
                              className="rounded-lg px-3 py-2 text-black w-full"
                            />
                          ) : (
                            <>
                              {/* 📌 PIN ICON - absolute positioned */}
                              {msg.isPinned && (
                                <span className="absolute -top-2 -right-2 z-10 text-yellow-400 text-lg drop-shadow">
                                  📌
                                </span>
                              )}

                              <span>{displayContent}</span>

                              {showEditedTag && (
                                <span className="ml-1 text-[10px] italic text-gray-300">
                                  (edited)
                                </span>
                              )}
                            </>

                          )}
                        </div>
                      </>
                    )
                  )}

                  {!revokedMessages.includes(msg._id!) &&
                    msg.images &&
                    msg.images.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.images.map((img, k) => (
                          <div
                            key={k}
                            className={`
            relative inline-block rounded-xl
            transition-all duration-300
            ${msg._id === highlightMessageId
                                ? "ring-2 ring-blue-400 animate-pulse"
                                : ""
                              }
          `}
                          >
                            {/* 📌 PIN ICON OVER IMAGE */}
                            {msg.isPinned && (
                              <span className="absolute -top-2 -right-2 z-10 text-yellow-400 text-lg drop-shadow">
                                📌
                              </span>
                            )}

                            <img
                              src={resolveImageUrl(img)}
                              className="max-h-[300px] max-w-[260px] cursor-pointer rounded-xl shadow"
                              onClick={() => window.open(resolveImageUrl(img), "_blank")}
                              onContextMenu={(e) => handleRightClick(e, msg._id!)}
                            />
                          </div>
                        ))}
                      </div>
                    )}


                  {!revokedMessages.includes(msg._id!) &&
                    msg.fileUrl &&
                    (!msg.images || msg.images.length === 0) && (
                      <div
                        className={`
                          relative mt-2 rounded-xl
                          transition-all duration-300
                          ${msg._id === highlightMessageId
                            ? "ring-2 ring-blue-400 animate-pulse"
                            : ""
                          }
                        `}
                      >
                        {/* 📌 PIN ICON OVER FILE */}
                        {msg.isPinned && (
                          <span className="absolute -top-2 -right-2 z-10 text-yellow-400 text-lg drop-shadow">
                            📌
                          </span>
                        )}

                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          className="flex items-center gap-3 bg-primary hover:bg-primary/80 px-4 py-3 min-w-[200px] max-w-[280px] transition-colors rounded-xl"
                          onContextMenu={(e) => {
                            e.preventDefault();
                            if (!msg._id) return;
                            setOpenReactionFor(msg._id);
                          }}
                        >
                          {/* Document Icon */}
                          <div className="flex-shrink-0 w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-700" />
                          </div>

                          {/* File Name */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-black font-medium break-all">
                              {getOriginalFileName(msg.fileUrl)}
                            </p>
                          </div>
                        </a>
                      </div>
                    )}



                  {openReactionFor === msg._id && (
                    <div
                      className={`absolute -top-8 ${isMe ? "right-0" : "left-0"
                        } flex gap-2 rounded-full bg-[#3A3B3C] px-3 py-1 shadow-lg`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {REACTIONS.map((r) => (
                        <span
                          key={r}
                          className="cursor-pointer text-xl hover:scale-125 transition"
                          onClick={() => {
                            if (!msg._id) return;
                            onSendReaction(msg._id, r);
                            setOpenReactionFor(null);
                          }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}

                  {!revokedMessages.includes(msg._id!) && reactions.length > 0 && (
                    <div
                      className={`mt-1 flex gap-1 ${isMe ? "justify-end" : "justify-start"
                        }`}
                    >
                      {reactions.map((r, i) => (
                        <span
                          key={r.userId + "_" + r.type + "_" + i}
                          className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#3A3B3C] text-sm"
                        >
                          {r.type}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="mt-1 text-[10px] text-gray-500">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ""}
                  </p>
                </div>
              </div>
            );
          })}

        {/* SEEN STATUS */}
        {isLastMine && (
          <div className="pr-2 text-right text-xs text-gray-400 flex items-center justify-end gap-1">
            {isSeen ? (
              <>
                <div className="h-4 w-4 rounded-full">
                  {otherUserAvatar ? (
                    <img src={otherUserAvatar} className="h-4 w-4 rounded-full object-cover" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold">
                      {otherUserName?.[0]}
                    </div>
                  )}
                </div>


                <span>Seen</span>
              </>
            ) : (
              <span>Sent</span>
            )}
          </div>
        )}

        {/* TYPING BUBBLE */}
        {isTyping && (
          <div className="flex items-end gap-2 mb-2">
            <div className="h-6 w-6 self-end mb-1">
              {otherUserAvatar ? (
                <img
                  src={otherUserAvatar}
                  alt={otherUserName}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-black text-xs font-bold">
                  {otherUserName?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            <div className="bg-[#3A3B3C] px-4 py-2 rounded-2xl rounded-bl-none flex gap-1">
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150" />
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-300" />
            </div>
          </div>
        )}


        {hasUnreadNewMsg && (
          <div className="sticky bottom-4 flex justify-center z-40">
            <button
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-white shadow-lg"
              onClick={() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                setHasUnreadNewMsg(false);
              }}
            >
              ⬇️ New messages
            </button>
          </div>
        )}



        <div ref={bottomRef} />
      </div>

      {/* DELETE MENU (UI ONLY) */}
      {openDeleteFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-80 rounded-xl bg-[#242526] p-4 shadow-xl">
            <h3 className="mb-3 text-center text-sm font-semibold text-white">
              Recall message?
            </h3>

            <button
              className="w-full rounded-lg px-4 py-2 text-left text-sm text-white hover:bg-[#3A3B3C]"
              onClick={() => {
                const key = `hiddenMessages_${userId}_${roomId}`;

                setHiddenMessages((prev) => {
                  const updated = [...prev, openDeleteFor.messageId];
                  localStorage.setItem(key, JSON.stringify(updated));
                  return updated;
                });
                setOpenDeleteFor(null);
              }}
            >
              Remove for you
            </button>

            {openDeleteFor.isMine && (
              <button
                className="mt-2 w-full rounded-lg px-4 py-2 text-left text-sm text-red-400 hover:bg-[#3A3B3C]"
                onClick={() => {
                  socket.emit("revokeMessage", {
                    messageId: openDeleteFor.messageId,
                  });
                  setOpenDeleteFor(null);
                }}
              >
                Recall for everyone
              </button>
            )}

            <button
              className="mt-3 w-full rounded-lg px-4 py-2 text-sm text-gray-400 hover:bg-[#3A3B3C]"
              onClick={() => setOpenDeleteFor(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ChatInput
        sendMessage={onSendMessage}
        uploadFile={uploadFile}
        roomId={roomId}
        replyingMessage={replyingMessage}
        clearReply={() => setReplyingMessage(null)}
        otherUserId={otherUserId}
        otherUserName={otherUserName}
        currentUserId={userId}
        onOpenReminder={() => setShowReminderModal(true)}
      />

      {/* Report Modal */}
      {reportingMessage && (
        <ReportModal
          open={!!reportingMessage}
          onOpenChange={(open) => !open && setReportingMessage(null)}
          targetType={ReportTargetType.MESSAGE}
          targetId={reportingMessage.messageId}
          targetContent={reportingMessage.content}
          reportedUserId={reportingMessage.userId}
          onReportSubmitted={() => {
            setReportingMessage(null);
          }}
        />
      )}

      {/* CREATE REMINDER MODAL */}
      <CreateReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        onSubmit={(content, scheduledDate) => {
          socket.emit("createReminder", {
            roomId,
            content,
            scheduledDate: scheduledDate.toISOString(),
            creatorId: userId,
            creatorName: currentUserName || "You",
          });
          setShowReminderModal(false);
        }}
      />

      {/* REMINDER DETAIL MODAL */}
      <ReminderDetailModal
        isOpen={showReminderDetail}
        onClose={() => {
          setShowReminderDetail(false);
          setSelectedReminder(null);
        }}
        reminder={selectedReminder ? {
          reminderId: selectedReminder.reminderId,
          content: selectedReminder.content,
          scheduledDate: selectedReminder.scheduledDate,
          creatorName: selectedReminder.creatorName,
        } : null}
        createdAt={selectedReminder?.createdAt}
        currentUserId={userId}
        creatorId={selectedReminder?.creatorId || ""}
        onUpdate={(reminderId, content, scheduledDate) => {
          socket.emit("updateReminder", {
            reminderId,
            content,
            scheduledDate: scheduledDate.toISOString(),
          });
          setShowReminderDetail(false);
          setSelectedReminder(null);
        }}
        onCancel={(reminderId) => {
          socket.emit("cancelReminder", { reminderId });
          setShowReminderDetail(false);
          setSelectedReminder(null);
        }}
      />

      {/* Toast for cancelled reminder */}
      {showCancelledToast && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[20000]">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg text-sm">
            Reminder has been cancelled
          </div>
        </div>
      )}
    </div>
  );
}
