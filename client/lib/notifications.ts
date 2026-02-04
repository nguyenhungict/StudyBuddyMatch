const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888"

export interface NotificationFromUser {
    id: string
    email: string
    profile: {
        username: string
        avatarUrl?: string
        tagLevel?: { name: string }
        tagSubject?: { name: string }
        tagGender?: { name: string }
        tagStudyStyle?: { name: string }
        tagLearningGoal?: { name: string }
        bio?: string
        grade?: number
        school?: string
    }
}

export interface Notification {
    id: string
    userId: string
    content: string
    type: "LIKE" | "MATCH" | "MESSAGE" | "SYSTEM" | "MODERATION_RESOLVED" | "MODERATION_ACTION" |"REMINDER"
    matchId?: string
    isRead: boolean
    readAt?: string
    createdAt: string
    fromUser?: NotificationFromUser
}

/**
 * Lấy tất cả notifications của user
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
    const url = `${BASE_URL}/notifications?userId=${encodeURIComponent(userId)}`
    const res = await fetch(url, { cache: "no-store" })

    if (!res.ok) {
        throw new Error(`Failed to fetch notifications: ${res.status}`)
    }

    return res.json()
}

/**
 * Đếm số notifications chưa đọc
 */
export async function getUnreadCount(userId: string): Promise<{ count: number }> {
    const url = `${BASE_URL}/notifications/count?userId=${encodeURIComponent(userId)}`
    const res = await fetch(url, { cache: "no-store" })

    if (!res.ok) {
        throw new Error(`Failed to fetch unread count: ${res.status}`)
    }

    return res.json()
}

/**
 * Đánh dấu một notification là đã đọc
 */
export async function markNotificationAsRead(
    notificationId: string,
    userId: string
): Promise<Notification> {
    const url = `${BASE_URL}/notifications/${notificationId}/mark-read?userId=${encodeURIComponent(userId)}`
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) {
        throw new Error(`Failed to mark notification as read: ${res.status}`)
    }

    return res.json()
}

/**
 * Đánh dấu tất cả notifications là đã đọc
 */
export async function markAllNotificationsAsRead(
    userId: string
): Promise<{ success: boolean; message: string }> {
    const url = `${BASE_URL}/notifications/mark-all-read`
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
    })

    if (!res.ok) {
        throw new Error(`Failed to mark all as read: ${res.status}`)
    }

    return res.json()
}

/**
 * Xóa một notification
 */
export async function deleteNotification(
    notificationId: string,
    userId: string
): Promise<void> {
    const url = `${BASE_URL}/notifications/${notificationId}?userId=${encodeURIComponent(userId)}`
    const res = await fetch(url, {
        method: "DELETE",
    })

    if (!res.ok) {
        throw new Error(`Failed to delete notification: ${res.status}`)
    }
}
