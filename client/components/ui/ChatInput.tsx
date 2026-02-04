"use client";

import { useRef, useState, useEffect } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { getSocket } from "@/utils/socketSingleton";
import { Clock, Paperclip, Smile, Send } from "lucide-react";

/* TYPE FOR REPLY (NEW)*/
export interface ReplyPreview {
  messageId: string;
  userId: string;
  content?: string;
  images?: string[];
  fileUrl?: string;
}

interface ChatInputProps {
  sendMessage: (
    content: string,
    images?: string[],
    fileUrl?: string,
    replyTo?: ReplyPreview | null
  ) => void;
  uploadFile: (file: File) => Promise<string>;
  roomId?: string;
  replyingMessage?: ReplyPreview | null;
  clearReply?: () => void;
  otherUserId: string;
  otherUserName: string;
  currentUserId: string;
  onOpenReminder?: () => void;
}

export default function ChatInput({
  sendMessage,
  uploadFile,
  roomId,
  replyingMessage,
  clearReply,
  otherUserId,
  otherUserName,
  currentUserId,
  onOpenReminder,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const socket = getSocket();

  /*  EMOJI CLOSE (GIỮ NGUYÊN)*/
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ RESET REPLY KHI ĐỔI ROOM
  useEffect(() => {
    clearReply?.();
  }, [roomId]);

  /* YPING EVENT (GIỮ NGUYÊN)*/
  const emitTyping = () => {
    if (!roomId) return;
    socket.emit("typing", { roomId });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", { roomId });
    }, 2000);
  };

  /*  SEND MESSAGE (CHỈ THÊM replyTo) */
  const handleSend = () => {
    if (roomId) socket.emit("stopTyping", { roomId });

    if (previewUrl && previewName) {
      const isImage = previewName.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);
      sendMessage(
        message.trim(),
        isImage ? [previewUrl] : [],
        isImage ? undefined : previewUrl,
        replyingMessage ?? null
      );
      setPreviewUrl(null);
      setPreviewName(null);
      setMessage("");
      clearReply?.();
      return;
    }

    if (!message.trim() && !previewUrl) return;
    sendMessage(message.trim(), undefined, undefined, replyingMessage ?? null);
    setMessage("");
    clearReply?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    emitTyping();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* UPLOAD FILE (GIỮ NGUYÊN)*/
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file) return;
    setPreviewName(file.name);
    try {
      const url = await uploadFile(file);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed");
    }
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-2 p-3 border-t border-border bg-background/80 backdrop-blur-md relative z-20">
      {/*  REPLY PREVIEW (NEW) */}
      {replyingMessage && (
        <div className="flex items-start justify-between rounded-lg bg-secondary/80 px-3 py-2 text-sm text-secondary-foreground border border-border/50">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-amber-500 font-semibold">
              Replying to{" "}
              {replyingMessage.userId === currentUserId
                ? "You"
                : replyingMessage.userId === otherUserId
                  ? otherUserName
                  : "Someone"}
            </span>

            {replyingMessage.content && (
              <span className="line-clamp-1 text-muted-foreground">
                {replyingMessage.content}
              </span>
            )}

            {replyingMessage.images?.length ? (
              <span className="text-xs italic text-muted-foreground">📷 Image</span>
            ) : replyingMessage.fileUrl ? (
              <span className="text-xs italic text-muted-foreground flex items-center gap-1"><Paperclip className="w-3 h-3" /> File</span>
            ) : null}
          </div>

          <button
            onClick={clearReply}
            className="ml-2 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}

      {/*  PREVIEW FILE */}
      {previewUrl && (
        <div className="flex items-center gap-2 px-2">
          {previewName?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ? (
            <img
              src={previewUrl}
              alt="preview"
              className="max-h-24 rounded-md object-contain border border-border"
            />
          ) : (
            <div className="px-3 py-2 rounded-lg border border-border bg-secondary text-xs text-secondary-foreground flex items-center gap-2">
              <Paperclip className="w-4 h-4" /> {previewName}
            </div>
          )}

          <button
            onClick={() => {
              setPreviewUrl(null);
              setPreviewName(null);
            }}
            className="text-xs text-muted-foreground hover:underline"
          >
            Cancel
          </button>
        </div>
      )}

      {/*  INPUT BAR  */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            emitTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 rounded-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 border border-transparent focus:border-primary/50 transition-all font-medium"
        />

        <input type="file" ref={fileRef} className="hidden" onChange={handleFileChange} />

        {/* Emoji Button */}
        <button
          onClick={() => setShowEmoji((prev) => !prev)}
          className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-amber-500 transition-colors"
          title="Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* File Attachment Button */}
        <button
          onClick={() => fileRef.current?.click()}
          className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Attach File"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Reminder Button */}
        <button
          onClick={onOpenReminder}
          className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-blue-500 transition-colors"
          title="Create Reminder"
        >
          <Clock className="w-5 h-5" />
        </button>

        {/* Send Button */}
        <button
          onClick={handleSend}
          className="h-10 w-10 flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-md active:scale-95"
          title="Send"
        >
          <Send className="w-5 h-5 ml-0.5" />
        </button>

        {showEmoji && (
          <div ref={emojiRef} className="absolute bottom-16 right-2 z-50 shadow-2xl rounded-xl overflow-hidden border border-border">
            <Picker
              data={data}
              theme="auto"
              onEmojiSelect={(emoji: any) =>
                setMessage((prev) => prev + emoji.native)
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
