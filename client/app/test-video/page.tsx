"use client";

import { useEffect, useState } from "react";
import { useVideoSocket } from "@/hooks/useVideoSocket";

export default function TestVideoPage() {
  const [idToCall, setIdToCall] = useState("");

  const {
    myId,
    localVideoRef,
    remoteVideoRef,
    joinRoomAndInitWebRTC,
    callUser,
    answerCall,
    incomingCall,
    callAccepted,
    busyNotification, // Đã fix TS error
    toggleMic,
    toggleCam,
    isVideoEnabled,
    isAudioEnabled
  } = useVideoSocket();

  useEffect(() => {
    if (myId) {
      joinRoomAndInitWebRTC(`room-${myId}`);
    }
  }, [myId]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4">
      {busyNotification && (
        <div className="fixed top-10 right-5 z-50 animate-bounce bg-red-600 px-4 py-2 rounded shadow-lg">
          ⚠️ {busyNotification}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4 text-blue-400">TEST PAGE (DEBUG)</h1>
      <p className="mb-4 text-gray-400">My ID: <span className="bg-gray-700 px-2 py-1 rounded">{myId}</span></p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mb-6">
        {/* VIDEO LOCAL */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video border-2 border-gray-600">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 text-xs rounded">ME</div>
        </div>

        {/* VIDEO REMOTE */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video border-2 border-gray-600">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          {!callAccepted && <div className="absolute inset-0 flex items-center justify-center text-gray-500">Waiting...</div>}
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 text-xs rounded">OTHER</div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex gap-4 mb-6">
        <button onClick={toggleMic} className={`px-4 py-2 rounded-full ${isAudioEnabled ? 'bg-gray-700' : 'bg-red-600'}`}>{isAudioEnabled ? "Mic On" : "Mic Off"}</button>
        <button onClick={toggleCam} className={`px-4 py-2 rounded-full ${isVideoEnabled ? 'bg-gray-700' : 'bg-red-600'}`}>{isVideoEnabled ? "Cam On" : "Cam Off"}</button>
      </div>

      {/* CALL FORM */}
      {!callAccepted && (
        <div className="flex gap-2 bg-gray-800 p-4 rounded-lg">
          <input type="text" placeholder="Paste ID here..." value={idToCall} onChange={(e) => setIdToCall(e.target.value)} className="px-4 py-2 text-black rounded w-64 outline-none" />
          <button onClick={() => callUser(idToCall)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded">CALL</button>
        </div>
      )}

      {/* INCOMING CALL POPUP */}
      {incomingCall && !callAccepted && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center text-black">
            <h2 className="text-2xl font-bold mb-2">📞 Incoming Call!</h2>
            <p className="text-gray-500 mb-6">From: {incomingCall.from}</p>
            <button onClick={answerCall} className="bg-green-500 text-white font-bold py-3 px-8 rounded-full hover:scale-110 transition">ANSWER</button>
          </div>
        </div>
      )}
    </div>
  );
}