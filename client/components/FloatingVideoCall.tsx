"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useVideoCall } from "@/context/VideoCallContext";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/utils/socketSingleton";
import {
    Mic,
    Video,
    PhoneOff,
    MicOff,
    VideoOff,
    Monitor,
    MonitorOff,
    Minimize2,
    Maximize2,
    Move,
} from "lucide-react";

export default function FloatingVideoCall() {
    const { user } = useAuth();
    const userId = user?.id;

    const {
        callState,
        remoteStream,
        localStream,
        localVideoRef,
        remoteVideoRef,
        isScreenSharing,
        isVideoEnabled,
        isAudioEnabled,
        endCall,
        toggleMinimize,
        toggleMic,
        toggleCam,
        shareScreen,
    } = useVideoCall();

    // Local refs for video elements
    const localVideoElementRef = useRef<HTMLVideoElement>(null);
    const remoteVideoElementRef = useRef<HTMLVideoElement>(null);

    // Dragging state
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // 🔥 CRITICAL: Re-assign streams to video elements when they change or when minimize toggles
    useEffect(() => {
        if (localVideoElementRef.current && localStream) {
            console.log("🎥 Assigning local stream to video element");
            localVideoElementRef.current.srcObject = localStream;
        }
    }, [callState.isMinimized, localStream]);

    useEffect(() => {
        if (remoteVideoElementRef.current && remoteStream) {
            console.log("🎥 Assigning remote stream to video element");
            remoteVideoElementRef.current.srcObject = remoteStream;
        }
    }, [callState.isMinimized, remoteStream]);

    // Also assign when component mounts or stream changes
    useEffect(() => {
        if (remoteVideoElementRef.current && remoteStream) {
            remoteVideoElementRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    useEffect(() => {
        if (localVideoElementRef.current && localStream) {
            localVideoElementRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Handle drag
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            dragOffset.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            e.preventDefault();
            e.stopPropagation();

            const newX = e.clientX - dragOffset.current.x;
            const newY = e.clientY - dragOffset.current.y;

            // Keep within viewport bounds
            const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 192);
            const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 128);

            setPosition({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            });
        };

        const handleMouseUp = (e: MouseEvent) => {
            e.preventDefault();
            setIsDragging(false);
        };

        // Prevent text selection while dragging
        const preventSelection = (e: Event) => {
            if (isDragging) {
                e.preventDefault();
            }
        };

        if (isDragging) {
            // Disable text selection globally while dragging
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            document.body.style.cursor = 'grabbing';

            document.addEventListener('mousemove', handleMouseMove, { passive: false });
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('selectstart', preventSelection);
        }

        return () => {
            // Re-enable text selection
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            document.body.style.cursor = '';

            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('selectstart', preventSelection);
        };
    }, [isDragging]);

    // Listen for call-ended and videoCallRejected events
    useEffect(() => {
        if (!callState.isActive || !userId) return;

        const chatSocket = getSocket();
        if (!chatSocket) return;

        chatSocket.emit("registerUser", userId);

        const handleRejected = () => {
            console.log("❌ Video call rejected - closing floating window");
            endCall();
        };

        const handleEnded = () => {
            console.log("☎️ Call ended - closing floating window");
            endCall();
        };

        chatSocket.on("videoCallRejected", handleRejected);
        chatSocket.on("call-ended", handleEnded);

        return () => {
            chatSocket.off("videoCallRejected", handleRejected);
            chatSocket.off("call-ended", handleEnded);
        };
    }, [callState.isActive, userId, endCall]);

    // Handle end call button
    const handleEndCall = async () => {
        const duration = await endCall();

        if (callState.chatRoomId && callState.otherUserId) {
            const socket = getSocket();

            if (duration && duration > 0) {
                // Connected call - log as ended
                socket.emit("endVideoCall", {
                    to: callState.otherUserId,
                    roomId: callState.chatRoomId,
                    duration: duration,
                    callerId: callState.callerId
                });
            } else {
                // Not connected
                if (userId === callState.callerId) {
                    // Caller cancelled
                    socket.emit("missedVideoCall", {
                        to: callState.otherUserId,
                        roomId: callState.chatRoomId,
                        callerId: callState.callerId
                    });
                } else {
                    // Callee left
                    socket.emit("rejectVideoCall", {
                        to: callState.otherUserId,
                        roomId: callState.chatRoomId
                    });
                }
            }
        }
    };

    if (!callState.isActive) return null;

    const isMinimized = callState.isMinimized;

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                ...(isMinimized
                    ? {
                        left: position.x,
                        top: position.y,
                        touchAction: 'none',
                        userSelect: 'none'
                    }
                    : { left: 0, top: 64, right: 0, bottom: 0 }
                ),
                zIndex: 9999
            }}
            className={`bg-zinc-900 shadow-2xl overflow-hidden group transition-all duration-300 flex flex-col ${isMinimized
                ? 'w-48 h-32 rounded-xl border border-zinc-700 cursor-grab active:cursor-grabbing select-none'
                : ''
                }`}
            onMouseDown={isMinimized ? handleMouseDown : undefined}
        >
            {/* Header - only visible when expanded */}
            <div
                className={`bg-zinc-800 flex items-center justify-between px-4 cursor-move transition-all ${isMinimized ? 'h-0 overflow-hidden opacity-0' : 'h-12 opacity-100'
                    }`}
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <Video className="w-3 h-3 text-white" />
                    </div>
                    <div>
                        <span className="text-sm font-medium text-white">Video Call</span>
                        {remoteStream && (
                            <span className="ml-2 text-xs text-green-400">● Connected</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={toggleMinimize}
                        className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                    >
                        <Minimize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Video Area */}
            <div className={`relative bg-zinc-950 transition-all ${isMinimized ? 'h-32' : 'flex-1'
                }`}>
                {/* Remote Video - ALWAYS MOUNTED */}
                <video
                    ref={remoteVideoElementRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full transition-all ${isMinimized ? 'object-cover' : 'object-contain'
                        }`}
                />

                {/* Waiting placeholder */}
                {!remoteStream && (
                    <div className={`absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 ${isMinimized ? 'bg-zinc-800' : ''
                        }`}>
                        <div className={`rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg animate-pulse ${isMinimized ? 'h-10 w-10' : 'h-20 w-20 mb-4'
                            }`}>
                            <span className={`font-bold text-white ${isMinimized ? 'text-xs' : 'text-2xl'}`}>...</span>
                        </div>
                        {!isMinimized && (
                            <>
                                <h2 className="text-lg font-semibold text-white">Waiting for partner...</h2>
                                <p className="text-zinc-400 text-xs mt-1">Will connect automatically</p>
                            </>
                        )}
                    </div>
                )}

                {/* Local Video (PiP) - ALWAYS MOUNTED, hidden when minimized */}
                <div className={`absolute bottom-4 right-4 bg-zinc-800 rounded-lg border-2 border-zinc-600 overflow-hidden shadow-xl transition-all ${isMinimized ? 'opacity-0 scale-0' : 'opacity-100 scale-100 h-[150px] w-[200px] hover:scale-105'
                    }`}>
                    <video
                        ref={localVideoElementRef}
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-full object-cover ${isScreenSharing ? '' : '-scale-x-100'}`}
                    />
                    {!isVideoEnabled && (
                        <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">ME</span>
                        </div>
                    )}
                </div>

                {/* Minimized controls overlay - show on hover */}
                {isMinimized && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleMinimize(); }}
                            className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-full text-white"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleEndCall(); }}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded-full text-white"
                        >
                            <PhoneOff className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Drag indicator for minimized */}
                {isMinimized && (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Move className="w-3 h-3 text-white/50" />
                    </div>
                )}
            </div>

            {/* Controls - only visible when expanded */}
            <div className={`bg-zinc-800 flex items-center justify-center gap-3 px-4 transition-all ${isMinimized ? 'h-0 overflow-hidden opacity-0' : 'h-16 opacity-100'
                }`}>
                <button
                    onClick={toggleMic}
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${isAudioEnabled ? 'bg-zinc-700 hover:bg-zinc-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                >
                    {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                    onClick={toggleCam}
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${isVideoEnabled ? 'bg-zinc-700 hover:bg-zinc-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                >
                    {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <button
                    onClick={shareScreen}
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                        }`}
                >
                    {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </button>

                <div className="w-px h-6 bg-zinc-600 mx-1"></div>

                <button
                    onClick={handleEndCall}
                    className="h-10 px-5 bg-red-600 hover:bg-red-700 rounded-full text-white font-semibold flex items-center gap-2 transition-colors"
                >
                    <PhoneOff className="w-5 h-5" />
                    <span className="text-sm">End</span>
                </button>
            </div>
        </div>
    );
}
