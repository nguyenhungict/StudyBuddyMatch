"use client"

import { use, useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useVideoSocket } from "@/hooks/useVideoSocket"
import { Mic, Video, PhoneOff, MicOff, VideoOff, Monitor, MonitorOff, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext" // ✅ ADD
import { getSocket } from "@/utils/socketSingleton"

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { id } = use(params);
  const router = useRouter()
  const searchParams = useSearchParams();
  const chatRoomId = searchParams.get('chatRoomId');
  const otherUserId = searchParams.get('otherUserId');
  const callerId = searchParams.get('callerId'); // ✅ GET CALLER ID
  const callId = searchParams.get('callId'); // ✅ GET CALL ID from URL

  const { user } = useAuth(); // ✅ GET USER
  const userId = user?.id || undefined;

  const {
    localVideoRef,
    remoteVideoRef,
    remoteStream, // Lấy biến này ra để check
    toggleMic,
    toggleCam,
    shareScreen,
    isScreenSharing,
    joinRoomAndInitWebRTC,
    leaveRoom,
    setCallInfo  // ✅ THÊM
  } = useVideoSocket(); // ✅ FIXED: No args needed

  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)

  // 🔥 FIX 1: Chặn code chạy 2 lần khi vào trang
  const hasJoined = useRef(false);

  // 🔥 LISTENER CHAT SOCKET (Control Channel)
  useEffect(() => {
    const chatSocket = getSocket();
    if (!chatSocket) return;

    if (userId) {
      console.log("🔥 RoomPage: Registering Chat Socket User:", userId);
      chatSocket.emit("registerUser", userId);
    }

    // 1. NGƯỜI KIA TỪ CHỐI -> Component này đang render ở Caller -> Thoát về Chat
    const handleRejected = () => {
      console.log("❌ Received videoCallRejected from Chat Server. Returning to chat...");
      leaveRoom();
      router.push(`/chat?roomId=${chatRoomId || ''}`);
    };

    // 2. NGƯỜI KIA KẾT THÚC CUỘC GỌI -> Thoát về chat
    const handleEnded = () => {
      console.log("☎️ Received call-ended from Chat Server. Ending session...");
      leaveRoom();
      router.push(`/chat?roomId=${chatRoomId || ''}`);
    };

    chatSocket.on("videoCallRejected", handleRejected);
    chatSocket.on("call-ended", handleEnded);

    return () => {
      chatSocket.off("videoCallRejected", handleRejected);
      chatSocket.off("call-ended", handleEnded);
    };
  }, [userId, chatRoomId, router]);

  useEffect(() => {
    if (id && !hasJoined.current) {
      hasJoined.current = true;
      console.log("🚀 Calling Join Room:", id);

      // ✅ GET CALLID from URL query params (more reliable than parsing room ID)
      if (callId) {
        console.log("📹 Got callId from URL:", callId);
        setCallInfo(callId);
      } else {
        console.warn("⚠️ No callId in URL - Duration will be 0");
      }

      joinRoomAndInitWebRTC(id);
    }
  }, [id, callId]);

  // 🔥 FIX 2: Ép stream vào thẻ video khi nhận được dữ liệu
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log("🎥 UI: Gán stream vào video remote");
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="fixed inset-0 flex flex-col bg-zinc-900 text-white">
      {/* Top Bar - GIỮ NGUYÊN */}
      <div className="h-16 bg-zinc-800/50 backdrop-blur-sm flex items-center justify-between px-6 border-b border-zinc-700/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Video className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">Study Session</h1>
              <p className="text-xs text-zinc-400">Room #{id.slice(0, 8)}...</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-400">Live</span>
          </div>
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-700">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Video Area - GIỮ NGUYÊN UI */}
        <div className="flex-1 p-4 flex flex-col gap-4 relative">
          <div className="flex-1 bg-zinc-950 rounded-xl flex items-center justify-center relative overflow-hidden shadow-2xl border border-zinc-800">

            {/* 1. VIDEO CỦA ĐỐI PHƯƠNG */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />

            {/* 2. PLACEHOLDER (Dùng biến remoteStream để ẩn hiện) */}
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10">
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto mb-6 flex items-center justify-center shadow-lg animate-pulse">
                  <span className="text-4xl font-bold text-white">...</span>
                </div>
                <h2 className="text-2xl font-semibold mb-2 text-white">Waiting for partner...</h2>
                <p className="text-zinc-400 text-sm">Screen will auto-update when connected</p>
              </div>
            )}

            {/* Overlay Info */}
            {remoteStream && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10 z-20">
                <span className="text-xs text-green-400 font-medium flex items-center gap-2">● Connected</span>
              </div>
            )}

            {/* 3. VIDEO CỦA MÌNH (Góc phải dưới) */}
            <div className="absolute bottom-4 right-4 h-36 w-52 bg-zinc-900 rounded-lg border-2 border-zinc-700 overflow-hidden shadow-xl hover:scale-105 transition-transform cursor-pointer z-30">
              <div className="h-full w-full flex items-center justify-center relative bg-zinc-800">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${isScreenSharing ? '' : '-scale-x-100'}`}
                />
                {isVideoOff && (
                  <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center z-10">
                    <span className="text-white font-bold">ME</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Sidebar */}
        {(showParticipants || showChat) && (
          <div className="w-80 bg-zinc-800 border-l border-zinc-700 p-4">
            <p className="text-zinc-400 text-center text-sm">Sidebar Content</p>
          </div>
        )}
      </div>

      {/* Controls Bar - GIỮ NGUYÊN UI */}
      <div className="h-20 bg-zinc-800/50 backdrop-blur-sm flex items-center justify-center gap-3 px-4 border-t border-zinc-700/50">
        <button onClick={() => { toggleMic(); setIsMuted(!isMuted); }} className="h-12 w-12 bg-zinc-700 rounded-full text-white flex items-center justify-center">
          {isMuted ? <MicOff /> : <Mic />}
        </button>
        <button onClick={() => { toggleCam(); setIsVideoOff(!isVideoOff); }} className="h-12 w-12 bg-zinc-700 rounded-full text-white flex items-center justify-center">
          {isVideoOff ? <VideoOff /> : <Video />}
        </button>
        <button onClick={shareScreen} className={`h-12 w-12 rounded-full text-white flex items-center justify-center ${isScreenSharing ? 'bg-blue-600' : 'bg-zinc-700'}`}>
          {isScreenSharing ? <MonitorOff /> : <Monitor />}
        </button>

        <div className="w-px h-8 bg-zinc-600 mx-2"></div>

        <button
          onClick={async () => {
            // 📞 END CALL HANDLER
            const duration = await leaveRoom();

            if (chatRoomId && otherUserId) {
              const socket = getSocket();

              if (duration && duration > 0) {
                // ✅ CONNECTED -> VOICE CALL LOG
                socket.emit("endVideoCall", {
                  to: otherUserId,
                  roomId: chatRoomId,
                  duration: duration,
                  callerId: callerId // Pass Caller ID to attribution
                });
              } else {
                // ❌ NOT CONNECTED (Duration = 0)

                // LOGIC: Only the CALLER should generate a "Missed Call" log if they cancel.
                // If the CALLEE leaves before answering, it's just a leave (or we could treat as reject, but let's keep it simple).

                if (userId === callerId) {
                  // I AM THE CALLER -> I CANCELLED
                  console.log("🔍 CALLER CANCELLING:", {
                    myUserId: userId,
                    otherUserId: otherUserId,
                    chatRoomId: chatRoomId,
                    callerId: callerId
                  });
                  console.log("SENDING MISSED CALL EVENT (Caller Cancelled)", { to: otherUserId, roomId: chatRoomId });
                  socket.emit("missedVideoCall", {
                    to: otherUserId,
                    roomId: chatRoomId,
                    callerId: callerId
                  });
                } else {
                  // I AM THE CALLEE -> I LEFT (IGNORED/CLOSED TAB)
                  // Do nothing or optionally emit reject?
                  // For now, doing nothing avoids duplicate logs. 
                  // The Caller is supposedly still waiting or will see me leave? 
                  // Actually if I leave, Caller doesn't know. 
                  // So maybe I SHOULD emit rejectVideoCall?
                  console.log("CALLEE LEFT -> Emitting rejectVideoCall to notify Caller");
                  socket.emit("rejectVideoCall", {
                    to: otherUserId, // Notify Caller
                    roomId: chatRoomId
                  });
                }
              }
            }

            // Navigate back to Chat
            router.push(`/chat?roomId=${chatRoomId || ''}`);
          }}
          className="h-12 px-6 bg-red-600 hover:bg-red-700 rounded-full text-white font-bold flex items-center gap-2"
        >
          <PhoneOff className="w-5 h-5" /> End Call
        </button>
      </div>
    </div >
  )
}