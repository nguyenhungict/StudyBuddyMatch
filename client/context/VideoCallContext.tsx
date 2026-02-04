"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

const VIDEO_SOCKET_URL = "https://167.172.67.111.nip.io";

interface VideoCallState {
    isActive: boolean;
    isMinimized: boolean;
    videoRoomId: string | null;
    chatRoomId: string | null;
    otherUserId: string | null;
    callerId: string | null;
    callId: string | null;
}

interface VideoCallContextType {
    // State
    callState: VideoCallState;
    remoteStream: MediaStream | null;
    localStream: MediaStream | null;
    localVideoRef: React.RefObject<HTMLVideoElement | null>;
    remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
    isScreenSharing: boolean;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;

    // Actions
    startCall: (params: {
        videoRoomId: string;
        chatRoomId: string;
        otherUserId: string;
        callerId: string;
        callId: string;
    }) => void;
    endCall: () => Promise<number>;
    toggleMinimize: () => void;
    toggleMic: () => void;
    toggleCam: () => void;
    shareScreen: () => Promise<void>;
}

const VideoCallContext = createContext<VideoCallContextType | null>(null);

export function VideoCallProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    // Call State
    const [callState, setCallState] = useState<VideoCallState>({
        isActive: false,
        isMinimized: false,
        videoRoomId: null,
        chatRoomId: null,
        otherUserId: null,
        callerId: null,
        callId: null,
    });

    // Media State
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);

    // Refs
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const screenTrackRef = useRef<MediaStreamTrack | null>(null);
    const callStartTimeRef = useRef<number | null>(null);
    const callIdRef = useRef<string | null>(null);
    const currentRoomIdRef = useRef<string | null>(null);
    const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
    const isInitiated = useRef(false);

    // Initialize Socket
    useEffect(() => {
        const token = typeof window !== 'undefined'
            ? (localStorage.getItem("accessToken") || localStorage.getItem("token"))
            : null;

        if (!token) return;

        if (!socketRef.current) {
            socketRef.current = io(VIDEO_SOCKET_URL, {
                auth: { token },
                transports: ["websocket", "polling"],
                secure: true,
            });
        }

        const socket = socketRef.current;

        socket.on("connect", () => {
            console.log("✅ Video Socket Connected:", socket.id);
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
            } catch (e) {
                console.error("❌ Error handling offer:", e);
            }
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
                } catch (e) {
                    console.error("❌ Error handling answer:", e);
                }
            }
        });

        socket.on('ice-candidate', async (data) => {
            const pc = peerConnectionRef.current;
            const candidate = new RTCIceCandidate(data.candidate);
            if (pc && pc.remoteDescription) {
                try {
                    await pc.addIceCandidate(candidate);
                } catch (e) { }
            } else {
                iceCandidatesQueue.current.push(data.candidate);
            }
        });

        socket.on("user-connected", async () => {
            const pc = peerConnectionRef.current;
            if (!pc) return;
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                const targetRoom = currentRoomIdRef.current;
                if (targetRoom) {
                    socket.emit("offer", { offer, roomId: targetRoom });
                }
            } catch (e) {
                console.error("❌ Error creating offer:", e);
            }
        });

        socket.on("call-accepted", (data) => {
            console.log("Video call accepted by other user:", data);
        });

        socket.on("call-busy", () => {
            console.log("Target user is busy");
            alert("Người dùng đang bận!");
        });

        return () => {
            socket.off("connect");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("user-connected");
            socket.off("call-accepted");
            socket.off("call-busy");
        };
    }, []);

    // Listen for custom event from useChat/useIncomingCall to start floating call
    useEffect(() => {
        const handleStartCall = (e: any) => {
            console.log("📹 Received startFloatingVideoCall event:", e.detail);
            const params = e.detail;

            callIdRef.current = params.callId;

            setCallState({
                isActive: true,
                isMinimized: false,
                videoRoomId: params.videoRoomId,
                chatRoomId: params.chatRoomId,
                otherUserId: params.otherUserId,
                callerId: params.callerId,
                callId: params.callId,
            });

            // Join WebRTC room
            joinRoomAndInitWebRTC(params.videoRoomId);
        };

        window.addEventListener("startFloatingVideoCall", handleStartCall as EventListener);

        return () => {
            window.removeEventListener("startFloatingVideoCall", handleStartCall as EventListener);
        };
    }, []);

    // Start timer when remote stream received
    useEffect(() => {
        if (remoteStream && !callStartTimeRef.current) {
            callStartTimeRef.current = Date.now();
            console.log("Call Timer Started");
        }
    }, [remoteStream]);

    // Assign remote stream to video element
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
            setLocalStream(stream);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            setIsVideoEnabled(true);
            setIsAudioEnabled(true);

            const DOMAIN = "167.172.67.111";
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    {
                        urls: [`turn:${DOMAIN}:3478?transport=udp`, `turn:${DOMAIN}:3478?transport=tcp`],
                        username: 'admin',
                        credential: 'admin123'
                    }
                ]
            });

            peerConnectionRef.current = pc;
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.ontrack = (event) => setRemoteStream(event.streams[0]);
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("ice-candidate", { candidate: event.candidate, roomId });
                }
            };

            socket.emit("join-room", roomId);
        } catch (e) {
            console.error("Media Error:", e);
        }
    };

    const startCall = useCallback((params: {
        videoRoomId: string;
        chatRoomId: string;
        otherUserId: string;
        callerId: string;
        callId: string;
    }) => {
        callIdRef.current = params.callId;

        setCallState({
            isActive: true,
            isMinimized: false,
            videoRoomId: params.videoRoomId,
            chatRoomId: params.chatRoomId,
            otherUserId: params.otherUserId,
            callerId: params.callerId,
            callId: params.callId,
        });

        // Join WebRTC room
        joinRoomAndInitWebRTC(params.videoRoomId);
    }, []);

    const endCall = useCallback(async (): Promise<number> => {
        let duration = 0;

        // Calculate duration
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

                console.log(`Call ended. Duration: ${duration}s`);
            } catch (error) {
                console.error("Failed to update call end:", error);
            }
        }

        // Stop camera and mic
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                track.stop();
                track.enabled = false;
            });
        }

        // Stop screen share
        if (screenTrackRef.current) {
            screenTrackRef.current.stop();
        }

        // Clear video elements
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        // Reset refs
        localStreamRef.current = null;
        screenTrackRef.current = null;
        isInitiated.current = false;
        currentRoomIdRef.current = null;
        callStartTimeRef.current = null;
        callIdRef.current = null;

        // Reset state
        setRemoteStream(null);
        setLocalStream(null);
        setIsScreenSharing(false);
        setCallState({
            isActive: false,
            isMinimized: false,
            videoRoomId: null,
            chatRoomId: null,
            otherUserId: null,
            callerId: null,
            callId: null,
        });

        return duration;
    }, []);

    const toggleMinimize = useCallback(() => {
        setCallState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
    }, []);

    const toggleMic = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    }, []);

    const toggleCam = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    }, []);

    const shareScreen = useCallback(async () => {
        try {
            if (isScreenSharing) {
                // Stop sharing
                const cameraStream = localStreamRef.current;
                if (!cameraStream) return;
                const cameraTrack = cameraStream.getVideoTracks()[0];
                const pc = peerConnectionRef.current;
                if (pc) {
                    const videoSender = pc.getSenders().find((s) => s.track?.kind === 'video');
                    if (videoSender) await videoSender.replaceTrack(cameraTrack);
                }
                if (localVideoRef.current) localVideoRef.current.srcObject = cameraStream;
                if (screenTrackRef.current) {
                    screenTrackRef.current.stop();
                    screenTrackRef.current = null;
                }
                setIsScreenSharing(false);
            } else {
                // Start sharing
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
                newScreenTrack.onended = async () => {
                    await shareScreen(); // This will stop sharing
                };
            }
        } catch (error) {
            console.error("Screen share error:", error);
        }
    }, [isScreenSharing]);

    return (
        <VideoCallContext.Provider
            value={{
                callState,
                remoteStream,
                localStream,
                localVideoRef,
                remoteVideoRef,
                isScreenSharing,
                isVideoEnabled,
                isAudioEnabled,
                startCall,
                endCall,
                toggleMinimize,
                toggleMic,
                toggleCam,
                shareScreen,
            }}
        >
            {children}
        </VideoCallContext.Provider>
    );
}

export function useVideoCall() {
    const context = useContext(VideoCallContext);
    if (!context) {
        throw new Error("useVideoCall must be used within VideoCallProvider");
    }
    return context;
}
