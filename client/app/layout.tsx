import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import NavBar from "@/components/nav-bar"
import MainContent from "@/components/MainContent"
import GlobalBackground from "@/components/GlobalBackground"
import { AuthProvider } from "@/context/AuthContext"
import RoleGuard from "@/components/RoleGuard"
import { Toaster } from "sonner"
import { PresenceProvider } from "@/context/PresenceContext";
import GlobalCallListener from "@/components/GlobalCallListener";
import { VideoCallProvider } from "@/context/VideoCallContext";
import FloatingVideoCall from "@/components/FloatingVideoCall";


const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Study Buddy Match - Find Your Perfect Study Partner",
  description:
    "Connect with students who share your subjects, schedule, and learning goals. Study smarter together with real-time chat, video calls, and AI-powered quizzes.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Bọc AuthProvider ở đây để toàn bộ app dùng được context */}
          <AuthProvider>
            <VideoCallProvider>
              <PresenceProvider>
                <RoleGuard>
                  <GlobalBackground />
                  <NavBar />
                  <MainContent>{children}</MainContent>
                  <GlobalCallListener />
                  <FloatingVideoCall />
                  <Toaster />
                  <Analytics />
                </RoleGuard>
              </PresenceProvider>
            </VideoCallProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}