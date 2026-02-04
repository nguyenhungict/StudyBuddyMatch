"use client"

import { X, Heart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SwipeActionsProps {
    onReject: () => void
    onAccept: () => void
    onSuperLike?: () => void
    disabled?: boolean
    showSuperLike?: boolean
}

export function SwipeActions({
    onReject,
    onAccept,
    onSuperLike,
    disabled = false,
    showSuperLike = false,
}: SwipeActionsProps) {
    return (
        <div className="flex items-center justify-center gap-6">
            {/* Reject Button (Left) */}
            <Button
                size="icon"
                variant="outline"
                disabled={disabled}
                onClick={onReject}
                className={cn(
                    "w-16 h-16 rounded-full border-2 border-[#EF4444]/20 bg-white text-[#EF4444]",
                    "shadow-[0_8px_30px_rgb(239,68,68,0.15)]", // Soft red shadow
                    "hover:border-[#EF4444] hover:bg-white hover:-translate-y-1 hover:shadow-[0_15px_30px_rgb(239,68,68,0.25)]",
                    "active:translate-y-0 active:shadow-none active:scale-95",
                    "transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)", // Bouncy effect
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                )}
                aria-label="Pass"
            >
                <X className="h-7 w-7" strokeWidth={3} />
            </Button>

            {/* Super Like (Center - Optional) */}
            {showSuperLike && (
                <Button
                    size="icon"
                    disabled={disabled || !onSuperLike}
                    onClick={onSuperLike}
                    className={cn(
                        "w-12 h-12 rounded-full bg-gradient-to-b from-[#FDB022] to-[#D97706] text-white border-none",
                        "shadow-[0_8px_20px_rgb(253,176,34,0.3)]",
                        "hover:-translate-y-1 hover:shadow-[0_15px_30px_rgb(253,176,34,0.4)]",
                        "active:translate-y-0 active:scale-95",
                        "transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)"
                    )}
                >
                    <Star className="h-5 w-5 fill-white" />
                </Button>
            )}

            {/* Accept Button (Right) */}
            <Button
                size="icon"
                variant="outline"
                disabled={disabled}
                onClick={onAccept}
                className={cn(
                    "w-16 h-16 rounded-full border-2 border-[#22C55E]/20 bg-white text-[#22C55E]",
                    "shadow-[0_8px_30px_rgb(34,197,94,0.15)]", // Soft green shadow
                    "hover:border-[#22C55E] hover:bg-white hover:-translate-y-1 hover:shadow-[0_15px_30px_rgb(34,197,94,0.25)]",
                    "active:translate-y-0 active:shadow-none active:scale-95",
                    "transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                )}
                aria-label="Like"
            >
                <Heart className="h-7 w-7 fill-[#22C55E]" strokeWidth={0} />
            </Button>
        </div>
    )
}
