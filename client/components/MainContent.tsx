"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export default function MainContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    // Routes that should be full width (no container padding)
    const isFullWidth =
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname.startsWith("/verify-email") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/home") ||
        pathname.startsWith("/matching") ||
        pathname.startsWith("/chat") ||
        pathname.startsWith("/resource") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/room")

    return (
        <main
            className={cn(
                "flex-1 w-full transition-all duration-300",
                !isFullWidth && "container mx-auto px-4 py-8"
            )}
        >
            {children}
        </main>
    )
}
