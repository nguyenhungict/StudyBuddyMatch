"use client"

import { Bell } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { NotificationPanel } from "./notification-panel"
import { getUnreadCount } from "@/lib/notifications"
import { useAuth } from "@/context/AuthContext"
import { getSocket } from "@/utils/socketSingleton"

interface NotificationBellProps {
    count?: number
}

export function NotificationBell({ count: overrideCount }: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [count, setCount] = useState(overrideCount || 0)
    const { user } = useAuth()

    // Fetch unread count from API
    useEffect(() => {
        if (user?.id && !overrideCount) {
            fetchUnreadCount()

            // Poll every 30 seconds
            const interval = setInterval(fetchUnreadCount, 30000)
            return () => clearInterval(interval)
        }
    }, [user?.id, overrideCount])

    // Listen for new notifications via socket
    useEffect(() => {
        const socket = getSocket()

        const handleNewNotification = () => {
            // Increment count immediately for instant feedback
            setCount(prev => prev + 1)
        }

        socket.on("newNotification", handleNewNotification)

        return () => {
            socket.off("newNotification", handleNewNotification)
        }
    }, [])

    const fetchUnreadCount = async () => {
        if (!user?.id) return

        try {
            const data = await getUnreadCount(user.id)
            setCount(data.count)
        } catch (error) {
            console.error('Failed to fetch unread count:', error)
        }
    }

    // Update count when panel closes (notifications might have been read)
    const handlePanelClose = () => {
        setIsOpen(false)
        if (user?.id && !overrideCount) {
            fetchUnreadCount()
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "notification-bell relative flex items-center justify-center rounded-full p-2 transition-all duration-200",
                    "hover:bg-secondary text-muted-foreground hover:text-foreground",
                    isOpen && "bg-secondary text-foreground"
                )}
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />

                {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background animate-pulse">
                        {count > 9 ? "9+" : count}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={handlePanelClose}
                    />

                    {/* Notification Panel */}
                    <div className="fixed right-4 top-20 z-50 w-[380px] max-h-[600px] animate-in slide-in-from-top-2 duration-200 fade-in-0">
                        <NotificationPanel onClose={handlePanelClose} />
                    </div>
                </>
            )}
        </div>
    )
}
