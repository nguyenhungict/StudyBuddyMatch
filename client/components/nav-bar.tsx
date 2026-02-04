"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BookOpen, Users, MessageSquare, UserCircle, LogOut, Sparkles, Brain } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { NotificationBell } from "@/components/notification-bell"
import { useTotalUnreadMessages } from "@/hooks/useTotalUnreadMessages"
import { ModeToggle } from "@/components/mode-toggle"

export default function NavBar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const totalUnread = useTotalUnreadMessages()

  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/profile-setup" ||
    pathname === "/onboarding" ||
    pathname.startsWith("/admin")
  ) {
    return null
  }

  // --- LOGIC: CHƯA ĐĂNG NHẬP ---
  if (!user) {
    return (
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground tracking-tight">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Study Buddy Match
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-amber-500 text-black hover:bg-amber-400 font-bold">Sign Up</Button>
            </Link>
            <ModeToggle />
          </div>
        </div>
      </nav>
    )
  }

  // --- LOGIC: ĐÃ ĐĂNG NHẬP ---
  const navItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/matching", label: "Matching", icon: Users },
    { href: "/quizzes", label: "Quizzes", icon: Brain },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/resource", label: "Resource", icon: BookOpen },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/home" className="flex items-center gap-2 text-xl font-bold text-foreground tracking-tight hover:opacity-90 transition-opacity">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span className="hidden sm:inline">Study Buddy Match</span>
        </Link>

        {/* Center Navigation */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-secondary text-secondary-foreground shadow-inner"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-amber-500" : "text-current")} />
                <span className="hidden sm:inline">{item.label}</span>
                {/* Badge for Chat unread messages */}
                {item.href === "/chat" && totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-1 ring-background">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <NotificationBell />
          <ModeToggle />

          <Link href="/profile">
            <button className="flex items-center gap-2 rounded-full border border-border bg-card pl-2 pr-4 py-1.5 text-sm font-medium text-card-foreground hover:bg-accent transition-all group">
              <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                <UserCircle className="h-4 w-4" />
              </div>
              <span className="hidden sm:inline truncate max-w-[100px]">{user.name || "Student"}</span>
            </button>
          </Link>

          <button
            onClick={() => logout()}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  )
}