"use client"

import { useEffect, useState } from "react"
import { X, Heart, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const HINT_STORAGE_KEY = "swipe_hint_seen"

export function SwipeHint() {
    const [show, setShow] = useState(false)

    useEffect(() => {
        // Check if user has seen the hint before
        const hasSeenHint = localStorage.getItem(HINT_STORAGE_KEY)
        if (!hasSeenHint) {
            // Show hint after 500ms delay
            const timer = setTimeout(() => setShow(true), 500)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleDismiss = () => {
        localStorage.setItem(HINT_STORAGE_KEY, "true")
        setShow(false)
    }

    if (!show) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">

                {/* Close Button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Close hint"
                >
                    <X className="h-5 w-5 text-gray-500" />
                </button>

                {/* Title */}
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2 font-['Inter']">
                    How to Swipe 👋
                </h2>
                <p className="text-sm text-[#6B6B6B] mb-6">
                    Find your perfect study buddy in seconds!
                </p>

                {/* Instructions */}
                <div className="space-y-4 mb-8">

                    {/* Swipe Left */}
                    <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-white border-2 border-red-500">
                            <ArrowLeft className="h-6 w-6 text-red-500" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-[#1A1A1A] mb-1 flex items-center gap-2">
                                Swipe Left or Click <X className="h-4 w-4 text-red-500" />
                            </h3>
                            <p className="text-sm text-[#6B6B6B]">Pass on this profile</p>
                        </div>
                    </div>

                    {/* Swipe Right */}
                    <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-white border-2 border-green-500">
                            <ArrowRight className="h-6 w-6 text-green-500" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-[#1A1A1A] mb-1 flex items-center gap-2">
                                Swipe Right or Click <Heart className="h-4 w-4 text-green-500 fill-green-500" />
                            </h3>
                            <p className="text-sm text-[#6B6B6B]">Like this profile - if they like you back, it's a match!</p>
                        </div>
                    </div>

                    {/* Keyboard Hint */}
                    <div className="flex items-center gap-3 p-3 bg-[#FFF9E6] rounded-xl border border-[#FDB022]/20">
                        <div className="text-xs text-[#6B6B6B] flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-[#1A1A1A] font-mono">←</kbd>
                            <span>or</span>
                            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-[#1A1A1A] font-mono">→</kbd>
                            <span>arrow keys work too!</span>
                        </div>
                    </div>
                </div>

                {/* Got It Button */}
                <Button
                    onClick={handleDismiss}
                    className="w-full h-12 bg-gradient-to-r from-[#FDB022] to-[#FFD700] hover:from-[#FDB022]/90 hover:to-[#FFD700]/90 text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                    Got it! Let's start swiping
                </Button>
            </div>
        </div>
    )
}
