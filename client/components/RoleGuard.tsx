"use client"

import { useAuth } from "@/context/AuthContext"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

/**
 * RoleGuard: Bảo vệ routes dựa trên role
 * - ADMIN: Chỉ cho phép /admin/*
 * - USER: Chỉ cho phép /home, /matching, /chat, etc.
 */
export default function RoleGuard({ children }: { children: React.ReactNode }) {
    const { user, loading, isLoggingOut } = useAuth() // Thêm isLoggingOut
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (loading || isLoggingOut) return // Bỏ qua nếu đang loading hoặc đang logout

        // Skip RoleGuard cho các trang auth (login/signup/admin signin)
        const isAuthPage = ["/login", "/signup", "/admin/signin"].some((route) => pathname.startsWith(route))
        if (isAuthPage) return // Không redirect nếu đang ở trang auth

        // Nếu chưa đăng nhập, không cần check role
        if (!user) return

        const isAdminRoute = pathname.startsWith("/admin")
        const isUserRoute = ["/home", "/matching", "/chat", "/room", "/quiz", "/resource", "/profile"].some(
            (route) => pathname.startsWith(route)
        )

        // Nếu user có role ADMIN
        if (user.role === "ADMIN") {
            // Admin cố gắng vào user routes → Redirect về admin dashboard
            if (isUserRoute) {
                console.log("🔴 Admin không thể truy cập user routes, redirect về /admin/dashboard")
                router.replace("/admin/dashboard")
            }
        }
        // Nếu user có role USER
        else if (user.role === "USER") {
            // User cố gắng vào admin routes → Redirect về home
            if (isAdminRoute) {
                console.log("🔴 User không thể truy cập admin routes, redirect về /home")
                router.replace("/home")
            }
        }
    }, [user, loading, isLoggingOut, pathname, router])

    // Hiển thị children nếu không vi phạm rule
    return <>{children}</>
}
