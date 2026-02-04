"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    Users,
    FileText,
    FolderOpen,
    LogOut,
    Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
    label: string
    href: string
    icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
    {
        label: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Users Management",
        href: "/admin/users",
        icon: Users,
    },
    {
        label: "Reports Management",
        href: "/admin/reports",
        icon: FileText,
    },
    {
        label: "Documents Management",
        href: "/admin/documents",
        icon: FolderOpen,
    },
]

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const { logout } = useAuth()

    // Don't show layout for signin page
    if (pathname === "/admin/signin") {
        return <>{children}</>
    }

    const handleLogout = () => {
        logout("/admin/signin")
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Sidebar - Always visible (desktop only) */}
            <aside className="fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border">
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="p-6 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Shield className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg text-card-foreground">
                                    Admin Panel
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    StudyBuddyMatch
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href

                            return (
                                <Link key={item.href} href={item.href}>
                                    <div
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-md"
                                                : "text-muted-foreground hover:bg-muted hover:text-card-foreground"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Logout Button */}
                    <div className="p-4 border-t border-border">
                        <Button
                            variant="outline"
                            className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-600"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64">
                {children}
            </main>
        </div>
    )
}
