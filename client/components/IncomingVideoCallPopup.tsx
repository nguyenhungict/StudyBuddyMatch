"use client";

import Image from "next/image";

interface IncomingVideoCallPopupProps {
    from: string;
    callerName?: string;
    callerAvatar?: string;
    onAccept: () => void;
    onReject: () => void;
}

export default function IncomingVideoCallPopup({
    from,
    callerName,
    callerAvatar,
    onAccept,
    onReject
}: IncomingVideoCallPopupProps) {
    const displayName = callerName || from;
    let resolvedAvatar = callerAvatar;
    if (resolvedAvatar && resolvedAvatar.startsWith('/uploads')) {
        resolvedAvatar = `http://localhost:8888${resolvedAvatar}`;
    }

    const avatarUrl = resolvedAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-8 animate-slideUp">

                {/* Header */}
                <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">
                        Incoming Call
                    </h3>
                </div>

                {/* Avatar */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
                            <img
                                src={avatarUrl}
                                alt={displayName}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Pulse ring */}
                        <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-75"></div>
                    </div>
                </div>

                {/* Caller Name */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {displayName}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                        is calling you
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-8 justify-center">
                    {/* Reject Button */}
                    <button
                        onClick={onReject}
                        className="group flex flex-col items-center gap-2"
                    >
                        <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-110 group-active:scale-95">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Decline</span>
                    </button>

                    {/* Accept Button */}
                    <button
                        onClick={onAccept}
                        className="group flex flex-col items-center gap-2"
                    >
                        <div className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-110 group-active:scale-95">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Accept</span>
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
}