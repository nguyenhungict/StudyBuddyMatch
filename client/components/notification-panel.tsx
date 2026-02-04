"use client"

import { useState, useEffect } from "react"
import { Heart, X, Clock, CheckCheck, Bell, Shield, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { NotificationDetailModal } from "./notification-detail-modal"
import { useAuth } from "@/context/AuthContext"
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    type Notification,
} from "@/lib/notifications"

interface NotificationPanelProps {
    onClose: () => void
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { user } = useAuth()

    const unreadCount = notifications.filter(n => !n.isRead).length

    useEffect(() => {
        if (user?.id) {
            loadNotifications()
        }
    }, [user?.id])

    const loadNotifications = async () => {
        if (!user?.id) return

        setLoading(true)
        setError(null)

        try {
            const data = await getNotifications(user.id)
            setNotifications(data)
        } catch (err: any) {
            console.error('Failed to load notifications:', err)
            setError('Không thể tải thông báo')
        } finally {
            setLoading(false)
        }
    }

    const formatTimestamp = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

        if (diffInMinutes < 1) return "Vừa xong"
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`

        const diffInHours = Math.floor(diffInMinutes / 60)
        if (diffInHours < 24) return `${diffInHours} giờ trước`

        const diffInDays = Math.floor(diffInHours / 24)
        return `${diffInDays} ngày trước`
    }

    const handleMarkAsRead = async (id: string) => {
        if (!user?.id) return

        try {
            await markNotificationAsRead(id, user.id)
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
            )
        } catch (err) {
            console.error('Failed to mark as read:', err)
        }
    }

    const handleMarkAllAsRead = async () => {
        if (!user?.id) return

        try {
            await markAllNotificationsAsRead(user.id)
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
        } catch (err) {
            console.error('Failed to mark all as read:', err)
        }
    }

    const handleNotificationClick = (notification: Notification) => {
        handleMarkAsRead(notification.id)
        setSelectedNotification(notification)
    }

    const handleAccept = (notificationId: string) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        setSelectedNotification(null)
    }

    const handleReject = (notificationId: string) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        setSelectedNotification(null)
    }

    return (
        <>
            <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[600px]">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">Notifications</h2>
                            {unreadCount > 0 && (
                                <p className="text-xs text-amber-100">
                                    {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="mt-2 text-xs text-amber-100 hover:text-white underline"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto min-h-0 bg-card">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-sm text-muted-foreground">Loading...</div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-sm text-destructive">{error}</div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center h-full">
                            <div className="rounded-full bg-muted p-4 mb-4">
                                <Bell className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-foreground">No notifications</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                When someone likes you, you'll see it here
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={cn(
                                        "w-full px-6 py-4 text-left transition-all hover:bg-muted/50",
                                        // Unread styling
                                        !notification.isRead && "bg-secondary/30",
                                        // Moderation styling
                                        notification.type === "MODERATION_ACTION" && "bg-destructive/5 hover:bg-destructive/10 border-l-4 border-l-destructive pl-5"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="relative flex-shrink-0">
                                            <img
                                                src={notification.fromUser?.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notification.id}`}
                                                alt={notification.fromUser?.profile?.username || "User"}
                                                className={cn(
                                                    "h-12 w-12 rounded-full border-2",
                                                    notification.type === "MODERATION_ACTION"
                                                        ? "border-destructive/30"
                                                        : "border-border"
                                                )}
                                            />
                                            <div className={cn(
                                                "absolute -bottom-1 -right-1 rounded-full p-1",
                                                notification.type === "MODERATION_ACTION"
                                                    ? "bg-destructive"
                                                    : "bg-gradient-to-br from-amber-500 to-orange-600"
                                            )}>
                                                {notification.type === "LIKE" && (
                                                    <Heart className="h-3 w-3 text-white fill-white" />
                                                )}
                                                {notification.type === "MATCH" && (
                                                    <CheckCheck className="h-3 w-3 text-white" />
                                                )}
                                                {notification.type === "MODERATION_RESOLVED" && (
                                                    <Shield className="h-3 w-3 text-white" />
                                                )}
                                                {notification.type === "MODERATION_ACTION" && (
                                                    <AlertTriangle className="h-3 w-3 text-white" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn(
                                                        "font-semibold text-sm truncate",
                                                        notification.type === "MODERATION_ACTION"
                                                            ? "text-destructive uppercase tracking-wide"
                                                            : "text-foreground"
                                                    )}>
                                                        {notification.type === "MODERATION_RESOLVED" || notification.type === "MODERATION_ACTION"
                                                            ? "System Notification"
                                                            : (notification.fromUser?.profile?.username || "Someone")}
                                                    </p>
                                                    <p className={cn(
                                                        "text-xs mt-0.5",
                                                        notification.type === "MODERATION_ACTION"
                                                            ? "text-destructive"
                                                            : "text-muted-foreground"
                                                    )}>
                                                        {notification.type === "LIKE" && "liked your profile"}
                                                        {notification.type === "MATCH" && "It's a match!"}
                                                        {notification.type === "MESSAGE" && "sent you a message"}
                                                        {(notification.type === "MODERATION_RESOLVED" || notification.type === "MODERATION_ACTION") && (
                                                            <span className="line-clamp-2">{notification.content}</span>
                                                        )}
                                                    </p>
                                                </div>
                                                {!notification.isRead && (
                                                    <div className="flex-shrink-0 h-2 w-2 rounded-full bg-amber-500 mt-1" />
                                                )}
                                            </div>

                                            <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground/70">
                                                <Clock className="h-3 w-3" />
                                                <span>{formatTimestamp(notification.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Notification Detail Modal */}
            {selectedNotification && (
                <NotificationDetailModal
                    notification={selectedNotification}
                    onClose={() => setSelectedNotification(null)}
                    onAccept={handleAccept}
                    onReject={handleReject}
                />
            )}
        </>
    )
}
