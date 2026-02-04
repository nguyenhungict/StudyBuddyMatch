"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  UsersRound,
  MessageSquare,
  Video,
  CircleUser,
  CheckCircle2,
  CalendarCheck,
  LayoutGrid,
  ArrowRight,
  BookOpen,
  Brain
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useTotalUnreadMessages } from "@/hooks/useTotalUnreadMessages"
import { getSwipeTargets } from "@/lib/swipes"

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const unreadMessages = useTotalUnreadMessages()

  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [potentialMatchesCount, setPotentialMatchesCount] = useState<number | string>("-")
  const [greeting, setGreeting] = useState("Welcome")

  // --- 1. GREETING LOGIC ---
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good Morning")
    else if (hour < 18) setGreeting("Good Afternoon")
    else setGreeting("Good Evening")
  }, [])

  // --- 2. PROFILE CHECK LOGIC ---
  useEffect(() => {
    if (!loading && user) {
      if (!user.hasProfile) {
        setShowProfileDialog(true)
      } else {
        setShowProfileDialog(false)
      }
    }
  }, [user, loading])

  // --- 3. FETCH DATA (Real Stats) ---
  useEffect(() => {
    const fetchStats = async () => {
      if (user?.id && user.hasProfile) {
        try {
          const targets = await getSwipeTargets(user.id, 20)
          if (targets && targets.length >= 20) {
            setPotentialMatchesCount("20+")
          } else {
            setPotentialMatchesCount(targets.length)
          }
        } catch (e) {
          console.error("Failed to fetch potential matches stats", e)
          setPotentialMatchesCount(0)
        }
      }
    }
    fetchStats()
  }, [user])

  const handleCompleteProfile = () => {
    setShowProfileDialog(false)
    router.push("/profile-setup")
  }

  const userName = user?.name || "Student"
  const hasProfile = user?.hasProfile || false

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent text-muted-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p>Loading your space...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border text-card-foreground">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CircleUser className="h-8 w-8 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-2xl text-center">Complete Your Profile</DialogTitle>
            <DialogDescription className="text-center text-base text-muted-foreground">
              To start finding study buddies, please complete your profile with your study preferences and schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-4">
            <Button
              onClick={handleCompleteProfile}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
            >
              Create Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-transparent relative overflow-hidden">

        <div className="container max-w-6xl mx-auto px-4 py-8 relative z-10">

          {/* === HEADER SECTION === */}
          <div className="mb-12 mt-8">
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-4">
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2 tracking-tight">
                  {greeting}, <span className="text-primary">{userName}</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  {hasProfile
                    ? "Let's make today productive!"
                    : "Welcome to your new study journey."}
                </p>
              </div>

              {hasProfile && (
                <div className="hidden md:flex items-center gap-2 bg-card/50 backdrop-blur-md px-4 py-2 rounded-full border border-border shadow-sm">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Ready to learn?</span>
                </div>
              )}
            </div>
          </div>

          {/* === DASHBOARD CONTENT (For Users with Profile) === */}
          {hasProfile ? (
            <div className="space-y-10">

              {/* 1. Real Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* MATCHES STATS */}
                <Card className="border-border bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => router.push('/matching')}>
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                      <UsersRound className="h-7 w-7 text-primary" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">{potentialMatchesCount}</p>
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Potential Matches</p>
                    </div>
                  </CardContent>
                </Card>

                {/* MESSAGES STATS */}
                <Card className="border-border bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => router.push('/chat')}>
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform ${unreadMessages > 0 ? 'bg-destructive/10 border-destructive/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                      <MessageSquare className={`h-7 w-7 ${unreadMessages > 0 ? 'text-destructive' : 'text-blue-500'}`} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">{unreadMessages}</p>
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-blue-500 transition-colors">Unread Messages</p>
                    </div>
                  </CardContent>
                </Card>

                {/* STUDY GOAL (Placeholder - Future Feature) */}
                <Card className="border-border bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20 group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="h-7 w-7 text-green-500" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">Daily</p>
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-green-500 transition-colors">Goal Status</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 2. Quick Actions Grid (Replaces Steps) */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div
                    onClick={() => router.push('/matching')}
                    className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-border p-6 hover:shadow-lg hover:border-amber-500/30 transition-all cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
                      <UsersRound className="w-24 h-24 text-amber-500" strokeWidth={1} />
                    </div>
                    <div className="relative z-10">
                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center mb-4 text-black shadow-lg shadow-amber-500/30">
                        <UsersRound className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Find a Buddy</h3>
                      <p className="text-sm text-muted-foreground mb-4">Discover students matching your style.</p>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest group-hover:underline flex items-center gap-1">
                        Start Matching <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => router.push('/room/demo')}
                    className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-border p-6 hover:shadow-lg hover:border-purple-500/30 transition-all cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
                      <Video className="w-24 h-24 text-purple-500" strokeWidth={1} />
                    </div>
                    <div className="relative z-10">
                      <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center mb-4 text-white shadow-lg shadow-purple-500/30">
                        <Video className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Study Room</h3>
                      <p className="text-sm text-muted-foreground mb-4">Jump into a video session instantly.</p>
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest group-hover:underline flex items-center gap-1">
                        Join Now <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => router.push('/quizzes')}
                    className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-border p-6 hover:shadow-lg hover:border-blue-500/30 transition-all cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
                      <Brain className="w-24 h-24 text-blue-500" strokeWidth={1} />
                    </div>
                    <div className="relative z-10">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mb-4 text-white shadow-lg shadow-blue-500/30">
                        <Brain className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">AI Quizzes</h3>
                      <p className="text-sm text-muted-foreground mb-4">Generate quizzes from your PDFs.</p>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest group-hover:underline flex items-center gap-1">
                        Try AI Quiz <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => router.push('/profile')}
                    className="group relative overflow-hidden rounded-3xl bg-card border border-border p-6 hover:shadow-lg hover:border-foreground/20 transition-all cursor-pointer"
                  >
                    <div className="relative z-10">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-4 text-secondary-foreground">
                        <CircleUser className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">My Profile</h3>
                      <p className="text-sm text-muted-foreground mb-4">Update your schedule and goals.</p>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors flex items-center gap-1">
                        Edit Profile <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* === ONBOARDING CONTENT (For New Users) === */
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-4">Let's get you started in 4 steps</h2>
                <p className="text-muted-foreground">Complete these steps to unlock the full potential of Study Buddy Match.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Complete Profile", desc: "Tell us about your subjects & schedule", icon: CircleUser, action: () => router.push("/profile-setup"), btn: "Setup Now", active: true },
                  { title: "Find Buddies", desc: "Swipe to find your perfect match", icon: UsersRound, action: () => { }, btn: "Locked", active: false },
                  { title: "Connect & Chat", desc: "Plan your session together", icon: MessageSquare, action: () => { }, btn: "Locked", active: false },
                  { title: "Start Learning", desc: "Join video rooms and study", icon: Video, action: () => { }, btn: "Locked", active: false },
                ].map((step, idx) => (
                  <Card key={idx} className={`border-border bg-card/80 backdrop-blur-sm ${step.active ? 'border-primary/50 shadow-md ring-1 ring-primary/20' : 'opacity-60 grayscale'}`}>
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-foreground">{step.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{step.desc}</p>
                      <Button
                        onClick={step.action}
                        disabled={!step.active}
                        className={`w-full ${step.active ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground'}`}
                      >
                        {step.btn}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}