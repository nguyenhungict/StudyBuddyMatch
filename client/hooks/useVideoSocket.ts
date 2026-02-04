import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';

// const SOCKET_SERVER_URL = "https://167.172.67.111.nip.io"; // OLD
const SOCKET_SERVER_URL = "https://167.172.67.111.nip.io";

export const useVideoSocket = () => { // Revert signature
  const router = useRouter();

  // --- STATE ---
  const [myId, setMyId] = useState("");
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [busyNotification, setBusyNotification] = useState<string | null>(null);

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // --- REFS ---
  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

  // Lưu phòng hiện tại để fix lỗi gửi nhầm phòng
  const currentRoomIdRef = useRef<string | null>(null);

  // 📹 TRACK CALL INFO FOR DB UPDATE
  const callIdRef = useRef<string | null>(null);
  const callStartTimeRef = useRef<number | null>(null);

  const isInitiated = useRef(false);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);

  // 1. KẾT NỐI SOCKET
  useEffect(() => {
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem("accessToken") || localStorage.getItem("token"))
      : null;

    if (!token) return;

    if (!socketRef.current) {
      socketRef.current = io(SOCKET_SERVER_URL, {
        auth: { token: token },
        transports: ["websocket", "polling"],
        secure: true,
      });
    }

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("✅ Socket Connected ID:", socket.id);
      setMyId(socket.id || "");
    });

    socket.on("incoming-call", (data) => setIncomingCall(data));

    socket.on("call-accepted", (data) => {
      setCallAccepted(true);
      router.push(`/room/room-${socket.id}`);
    });

    socket.on("call-busy", () => {
      setBusyNotification("⚠️ Người dùng đang bận!");
      setTimeout(() => setBusyNotification(null), 4000);
    });

    socket.on('offer', async (data) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        while (iceCandidatesQueue.current.length > 0) {
          const c = iceCandidatesQueue.current.shift();
          if (c) await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { answer, roomId: data.roomId });
      } catch (e) { console.error("❌ Lỗi Offer:", e); }
    });

    socket.on('answer', async (data) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          while (iceCandidatesQueue.current.length > 0) {
            const c = iceCandidatesQueue.current.shift();
            if (c) await pc.addIceCandidate(new RTCIceCandidate(c));
          }
        } catch (e) { console.error("❌ Lỗi Answer:", e); }
      }
    });

    socket.on('ice-candidate', async (data) => {
      const pc = peerConnectionRef.current;
      const candidate = new RTCIceCandidate(data.candidate);
      if (pc && pc.remoteDescription) {
        try { await pc.addIceCandidate(candidate); } catch (e) { }
      } else {
        iceCandidatesQueue.current.push(data.candidate);
      }
    });

    // Khi có người mới vào -> Tạo Offer
    socket.on("user-connected", async () => {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Gửi offer vào ĐÚNG CÁI PHÒNG ĐANG NGỒI
        const targetRoom = currentRoomIdRef.current || `room-${socket.id}`;
        socket.emit("offer", { offer, roomId: targetRoom });

      } catch (e) { console.error("❌ Lỗi tạo Offer:", e); }
    });

    // 🔥 CLEANUP KHI COMPONENT BỊ HỦY (Tắt tab, Back trang)
    return () => {
      // Tắt Camera ngay lập tức
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }
      if (screenTrackRef.current) screenTrackRef.current.stop();

      socket.off("connect"); socket.off("incoming-call"); socket.off("call-accepted");
      socket.off("call-busy"); socket.off("offer"); socket.off("answer");
      socket.off("ice-candidate"); socket.off("user-connected");
      // socket.off("call-ended"); // Removed
      // socket.off("videoCallRejected"); // Removed
    };
  }, [router]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const joinRoomAndInitWebRTC = async (roomId: string) => {
    if (isInitiated.current) return;
    isInitiated.current = true;
    const socket = socketRef.current;
    if (!socket) return;

    try {
      currentRoomIdRef.current = roomId;

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setIsVideoEnabled(true);

      const DOMAIN = "167.172.67.111";
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: [`turn:${DOMAIN}:3478?transport=udp`, `turn:${DOMAIN}:3478?transport=tcp`], username: 'admin', credential: 'admin123' }
        ]
      });

      peerConnectionRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => setRemoteStream(event.streams[0]);
      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit("ice-candidate", { candidate: event.candidate, roomId });
      };

      socket.emit("join-room", roomId);

    } catch (e) {
      console.error("❌ Lỗi Media:", e);
    }
  };

  const shareScreen = async () => {
    try {
      if (isScreenSharing) {
        await stopSharingScreen();
        return;
      }
      // @ts-ignore
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const newScreenTrack = screenStream.getVideoTracks()[0];
      screenTrackRef.current = newScreenTrack;
      const pc = peerConnectionRef.current;
      if (pc) {
        const videoSender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (videoSender) await videoSender.replaceTrack(newScreenTrack);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
      setIsScreenSharing(true);
      newScreenTrack.onended = async () => { await stopSharingScreen(); };
    } catch (error) { console.error("Lỗi share:", error); }
  };

  const stopSharingScreen = async () => {
    const cameraStream = localStreamRef.current;
    if (!cameraStream) return;
    const cameraTrack = cameraStream.getVideoTracks()[0];
    const pc = peerConnectionRef.current;
    if (pc) {
      const videoSender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (videoSender) await videoSender.replaceTrack(cameraTrack);
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = cameraStream;
    if (screenTrackRef.current) { screenTrackRef.current.stop(); screenTrackRef.current = null; }
    setIsScreenSharing(false);
  };

  // 🔥 HÀM LEAVE ROOM ĐÃ ĐƯỢC NÂNG CẤP (Fix lỗi đèn Camera không tắt)
  const leaveRoom = async () => {
    // 🔥 UPDATE DB: End call + duration
    let duration = 0;
    if (callIdRef.current && callStartTimeRef.current) {
      duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888";
        const token = typeof window !== 'undefined'
          ? (localStorage.getItem("accessToken") || localStorage.getItem("token"))
          : null;

        await fetch(`${API_URL}/calls/${callIdRef.current}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: 'ENDED',
            endedAt: new Date().toISOString(),
            duration: duration,
          }),
        });

        console.log(`✅ Call ended. Duration: ${duration}s`);
      } catch (error) {
        console.error("❌ Failed to update call end:", error);
      }

      // Reset tracking
      callIdRef.current = null;
      callStartTimeRef.current = null;
    }

    // 1. Tắt triệt để Camera & Mic
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop(); // Lệnh quan trọng nhất để tắt đèn Cam
        track.enabled = false;
      });
    }

    // 2. Tắt Share Screen
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
    }

    // 3. Xóa hình ảnh trên thẻ Video
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    // 4. Ngắt WebRTC
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // 5. Reset biến
    localStreamRef.current = null;
    screenTrackRef.current = null;
    isInitiated.current = false;
    currentRoomIdRef.current = null;
    setRemoteStream(null);
    setIsScreenSharing(false);
    setCallAccepted(false);
    setIncomingCall(null);

    // 6. Chuyển trang (Caller tự xử lý)
    // router.push('/');

    return duration;
  };

  const callUser = (id: string) => socketRef.current?.emit("call-user", { userToCall: id, fromId: myId });
  const answerCall = () => {
    setCallAccepted(true);
    socketRef.current?.emit("answer-call", { to: incomingCall.from });
    router.push(`/room/${incomingCall.roomIdToJoin}`);
    setIncomingCall(null);
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const t = localStreamRef.current.getAudioTracks()[0];
      if (t) { t.enabled = !t.enabled; setIsAudioEnabled(t.enabled); }
    }
  };
  const toggleCam = () => {
    if (localStreamRef.current) {
      const t = localStreamRef.current.getVideoTracks()[0];
      if (t) { t.enabled = !t.enabled; setIsVideoEnabled(t.enabled); }
    }
  };

  // Function để set call info từ page
  const setCallInfo = (callId: string) => {
    callIdRef.current = callId;
    // callStartTimeRef.current = Date.now(); // ❌ REMOVE THIS: Don't start timer yet
    console.log(`📹 Tracking call ${callId}`);
  };

  // ✅ START TIMER WHEN REMOTE STREAM IS RECEIVED (Call Accepted & Connected)
  useEffect(() => {
    if (remoteStream && !callStartTimeRef.current) {
      callStartTimeRef.current = Date.now();
      console.log("⏱️ Call Timer Started (Connection Established)");
    }
  }, [remoteStream]);

  return {
    myId, localVideoRef, remoteVideoRef, remoteStream,
    callUser, answerCall, incomingCall, callAccepted,
    joinRoomAndInitWebRTC, leaveRoom,
    toggleMic, toggleCam, shareScreen,
    isScreenSharing, busyNotification,
    isVideoEnabled, isAudioEnabled,
    setCallInfo  // ✅ THÊM
  };
};