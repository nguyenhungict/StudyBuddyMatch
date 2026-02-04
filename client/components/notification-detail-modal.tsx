"use client"

import { useState } from "react"
import { Heart, X as XIcon, GraduationCap, BookOpen, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { createSwipe } from "@/lib/swipes"
import type { Notification } from "@/lib/notifications"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface NotificationDetailModalProps {
    notification: Notification
    onClose: () => void
    onAccept: (notificationId: string) => void
    onReject: (notificationId: string) => void
}

export function NotificationDetailModal({
    notification,
    onClose,
    onAccept,
    onReject,
}: NotificationDetailModalProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fromUser = notification.fromUser

    // 🚨 HANDLE SYSTEM NOTIFICATIONS (MODERATION)
    if (notification.type === "MODERATION_ACTION" || notification.type === "MODERATION_RESOLVED") {
        const isWarning = notification.type === "MODERATION_ACTION";
        return (
            <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="p-0 overflow-hidden sm:max-w-md border-0 bg-transparent shadow-none">
                    <VisuallyHidden>
                        <DialogTitle>{isWarning ? "System Warning" : "System Notification"}</DialogTitle>
                    </VisuallyHidden>

                    <div className={cn(
                        "bg-card rounded-3xl overflow-hidden shadow-2xl w-full flex flex-col",
                        isWarning ? "border-2 border-destructive" : "border border-border"
                    )}>
                        {/* Header */}
                        <div className={cn(
                            "p-6 flex flex-col items-center text-center",
                            isWarning ? "bg-destructive text-destructive-foreground" : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                        )}>
                            <div className="bg-white/20 p-4 rounded-full mb-4 backdrop-blur-sm">
                                {isWarning ? <div className="h-12 w-12 flex items-center justify-center font-bold text-4xl">!</div> : <div className="h-12 w-12 flex items-center justify-center">i</div>}
                            </div>
                            <h2 className="text-2xl font-bold uppercase tracking-wider">
                                {isWarning ? "Official Warning" : "Report Update"}
                            </h2>
                        </div>

                        {/* Content */}
                        <div className="p-8 text-center bg-card">
                            <p className="text-base text-card-foreground leading-relaxed font-medium">
                                {notification.content}
                            </p>

                            {isWarning && (
                                <div className="mt-6 p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                                    <p className="text-xs text-destructive">
                                        Please review our Community Guidelines. Further violations may result in account suspension.
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={onClose}
                                className={cn(
                                    "mt-8 w-full py-4 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]",
                                    isWarning
                                        ? "bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/30"
                                        : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30"
                                )}
                            >
                                {isWarning ? "I Understand" : "Close"}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (!fromUser) {
        return null
    }

    const handleAccept = async () => {
        if (!user?.id || !fromUser) return

        setLoading(true)
        setError(null)

        try {
            const result = await createSwipe(user.id, fromUser.id, true)

            if (result.isMatch) {
                alert(`🎉 It's a match with ${fromUser.profile?.username || fromUser.email}!`)
            }

            onAccept(notification.id)
        } catch (err: any) {
            console.error('Failed to accept:', err)
            setError(err.message || 'Failed to accept')
        } finally {
            setLoading(false)
        }
    }

    const handleReject = () => {
        onReject(notification.id)
    }

    const username = fromUser.profile?.username || fromUser.email
    const avatarUrl = fromUser.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fromUser.id}`
    const grade = fromUser.profile?.tagLevel?.name || "Unknown Grade"
    const subject = fromUser.profile?.tagSubject?.name || "Unknown Subject"
    const bio = fromUser.profile?.bio || "No bio available"

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="p-0 overflow-hidden sm:max-w-md border-0 bg-transparent shadow-none"
                showCloseButton={false}
            >
                <VisuallyHidden>
                    <DialogTitle>Notification Detail: {username}</DialogTitle>
                </VisuallyHidden>

                <div className="bg-card rounded-3xl overflow-hidden shadow-2xl border border-border/50 w-full flex flex-col max-h-[85vh]">
                    {/* Close Button - Custom positioned */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-20 rounded-full bg-black/20 backdrop-blur-sm p-2 text-white hover:bg-black/40 transition-colors"
                        disabled={loading}
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {/* Header Gradient */}
                    <div className="relative h-24 shrink-0 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 overflow-hidden">
                        {/* Pattern */}
                        <div className="absolute inset-0 opacity-30">
                            <div className="absolute inset-0" style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20h40v2H0z' fill='%23fff' fill-opacity='0.1'/%3E%3C/svg%3E")`,
                                backgroundSize: '40px 40px'
                            }} />
                        </div>

                        {/* Floating hearts */}
                        <div className="absolute top-4 left-8 animate-bounce">
                            <Heart className="h-6 w-6 text-white/30 fill-white/30" />
                        </div>
                        <div className="absolute top-6 right-12 animate-bounce" style={{ animationDelay: '0.2s' }}>
                            <Heart className="h-4 w-4 text-white/20 fill-white/20" />
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="overflow-y-auto flex-1 bg-card">
                        <div className="px-8 py-8">
                            {/* Avatar */}
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <div className="h-32 w-32 rounded-full border-4 border-card shadow-xl bg-secondary flex items-center justify-center overflow-hidden">
                                        <img
                                            src={avatarUrl}
                                            alt={username}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 p-3 shadow-lg z-10">
                                        <Heart className="h-5 w-5 text-white fill-white" />
                                    </div>
                                </div>
                            </div>

                            {/* User Name */}
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-foreground mb-1">
                                    {username}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {notification.type === "LIKE" ? "likes your profile!" : "It's a match!"}
                                </p>
                            </div>

                            {/* User Details */}
                            <div className="space-y-4 mb-6">
                                {/* Grade */}
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
                                    <div className="rounded-lg bg-amber-500/10 p-2">
                                        <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Grade</p>
                                        <p className="text-sm font-semibold text-foreground">{grade}</p>
                                    </div>
                                </div>

                                {/* Subject */}
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
                                    <div className="rounded-lg bg-amber-500/10 p-2">
                                        <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Subject</p>
                                        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-500">
                                            {subject}
                                        </span>
                                    </div>
                                </div>

                                {/* Bio */}
                                <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">About</p>
                                    <p className="text-sm text-foreground leading-relaxed">
                                        {bio}
                                    </p>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                                    {error}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleReject}
                                    disabled={loading}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 rounded-2xl px-6 py-4",
                                        "bg-secondary hover:bg-secondary/80",
                                        "text-foreground font-semibold text-sm",
                                        "transition-all duration-200",
                                        "hover:scale-105 active:scale-95",
                                        "border border-border hover:border-border/80",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                >
                                    <XIcon className="h-5 w-5" />
                                    <span>Not Now</span>
                                </button>

                                <button
                                    onClick={handleAccept}
                                    disabled={loading}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 rounded-2xl px-6 py-4",
                                        "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600",
                                        "text-white font-semibold text-sm",
                                        "transition-all duration-200",
                                        "hover:scale-105 active:scale-95",
                                        "shadow-lg hover:shadow-xl hover:shadow-amber-500/50",
                                        "relative overflow-hidden group",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                >
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                    {loading ? (
                                        <>
                                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span className="relative z-10">Accepting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Heart className="h-5 w-5 fill-white relative z-10" />
                                            <span className="relative z-10">Accept</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
