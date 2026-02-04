"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { X, Heart, Flag, SlidersHorizontal, User, Mail, School, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ReportModal, ReportTargetType } from "@/components/report-modal"
import { getSwipeTargets, createSwipe, type SmartFilters } from "@/lib/swipes"
import { SmartFilterDialog } from "@/components/smart-filter-dialog"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"

import { SwipeCard, type Profile } from "@/components/matching/SwipeCard"
import { SwipeActions } from "@/components/matching/SwipeActions"
import { SwipeHint } from "@/components/matching/SwipeHint"

//Mock data for demonstration (Fallback)
const mockProfiles = [
  {
    id: "550e8400-e29b-41d4-a716-446655440201",
    name: "Nguyễn Minh Đức",
    email: "duc.nguyen@example.com",
    avatar: "/diverse-student-portraits.png",
    school: "Hanoi Amsterdam High School",
    grade: "Grade 12",
    subjects: ["Mathematics", "Physics", "IT"],
    schedule: ["Mon", "Wed", "Fri", "Morning", "Evening"],
    studyStyle: "Visual learner, Group study",
    goals: ["Ace final exams", "Improve problem-solving skills"],
    bio: "Dean's List 2024. I love solving complex math problems and helping others.",
    compatibility: 92,
    gender: "Male",
    profilePhotos: [] as string[],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440202",
    name: "Trần Thu Hà",
    email: "ha.tran@example.com",
    avatar: "/diverse-female-student.png",
    school: "Le Hong Phong High School",
    grade: "Grade 11",
    subjects: ["Chemistry", "Biology", "English"],
    schedule: ["Tue", "Thu", "Sat", "Afternoon"],
    studyStyle: "Kinesthetic learner, Solo study",
    goals: ["Master lab techniques", "Research methods"],
    bio: "Science Competition Winner 2023. Looking for a serious study partner.",
    compatibility: 85,
    gender: "Female",
    profilePhotos: [] as string[],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440203",
    name: "Lê Văn Nam",
    email: "nam.le@example.com",
    avatar: "/diverse-students-studying.png",
    school: "Chu Van An High School",
    grade: "Grade 12",
    subjects: ["Programming", "Algorithms", "Database"],
    schedule: ["Sat", "Sun", "Evening", "Night"],
    studyStyle: "Logical, Hands-on",
    goals: ["Build a startup project"],
    bio: "Hackathon Champion. Let's code something amazing together!",
    compatibility: 88,
    gender: "Male",
    profilePhotos: [] as string[],
  },
]

export default function MatchingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [profiles, setProfiles] = useState(mockProfiles)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMatchPopup, setShowMatchPopup] = useState(false)
  const [matchName, setMatchName] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [smartFilters, setSmartFilters] = useState<SmartFilters | undefined>()

  const activeFilterCount = smartFilters ?
    (smartFilters.subject ? 1 : 0) +
    (smartFilters.studyDays?.length || 0) +
    (smartFilters.studyTimes?.length || 0) : 0

  const filteredProfiles = profiles

  const currentProfile =
    filteredProfiles.length > 0 ? filteredProfiles[currentIndex % filteredProfiles.length] : undefined

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handleSwipe("left")
      else if (e.key === "ArrowRight") handleSwipe("right")
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentProfile, user])

  const fetchTargets = async (filters?: SmartFilters, append: boolean = false) => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
    try {
      const targets = await getSwipeTargets(user.id, 100, filters)
      if (targets && targets.length > 0) {
        const mapped = targets.map((t) => {
          const days = new Set<string>();
          const times = new Set<string>();

          if (t.studySlots && Array.isArray(t.studySlots)) {
            t.studySlots.forEach((slot: any) => {
              if (slot.tagStudyDay?.name) {
                const dayMap: Record<string, string> = {
                  'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed',
                  'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun'
                };
                const shortDay = dayMap[slot.tagStudyDay.name] || slot.tagStudyDay.name.substring(0, 3);
                days.add(shortDay);
              }
              if (slot.tagStudyTime?.name) {
                const timeName = slot.tagStudyTime.name.split('(')[0].trim();
                times.add(timeName);
              }
            });
          }

          if (days.size === 0 && t.profile?.tagStudyDay?.name) {
            days.add(t.profile.tagStudyDay.name.substring(0, 3));
          }
          if (times.size === 0 && t.profile?.tagStudyTime?.name) {
            times.add(t.profile.tagStudyTime.name.split('(')[0].trim());
          }

          if (days.size === 0) {
            const hash = (t.id || "").charCodeAt(0) % 3;
            if (hash === 0) {
              days.add("Mon"); days.add("Wed"); days.add("Fri"); times.add("Evening");
            } else if (hash === 1) {
              days.add("Tue"); days.add("Thu"); times.add("Afternoon");
            } else {
              days.add("Sat"); days.add("Sun"); times.add("Morning");
            }
          }

          const schedule = [...Array.from(days), ...Array.from(times)];

          return {
            id: t.id,
            name: t.profile?.username || t.email || "Study Buddy",
            email: t.email || "No email",
            avatar: t.profile?.avatarUrl || "/placeholder-user.jpg",
            school: t.profile?.school || "Unknown School",
            grade: t.profile?.tagLevel?.name || "Grade",
            subjects: [t.profile?.tagSubject?.name || "Subject"],
            schedule: schedule,
            studyStyle: t.profile?.tagStudyStyle?.name || "Any style",
            goals: [t.profile?.tagLearningGoal?.name || "Improve"],
            bio: t.profile?.bio || "Let's study together!",
            compatibility: 80,
            gender: t.profile?.tagGender?.name || "N/A",
            profilePhotos: t.profile?.photos?.map((p: any) =>
              p.photoUrl?.startsWith('/uploads') ? `http://localhost:8888${p.photoUrl}` : p.photoUrl
            ) || [],
          }
        })

        if (append) {
          setProfiles((prev) => [...prev, ...mapped])
        } else {
          setProfiles(mapped)
          setCurrentIndex(0)
        }
      } else {
        if (!append) setProfiles(mockProfiles)
      }
    } catch (err: any) {
      setError("Cannot fetch users. Using mock data.")
      if (!append) setProfiles(mockProfiles)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTargets()
  }, [user])

  const handleApplySmartFilters = (filters: SmartFilters) => {
    setSmartFilters(filters)
    fetchTargets(filters)
  }

  const handleSwipe = async (direction: "left" | "right") => {
    if (!currentProfile || !user?.id) return

    const like = direction === "right"
    const targetId = currentProfile.id

    setProfiles((prev) => prev.filter((p) => p.id !== targetId))
    setCurrentIndex(0)
    setDragOffset({ x: 0, y: 0 })

    const remainingUsers = profiles.length - 1
    if (remainingUsers <= 10 && !loading) {
      fetchTargets(smartFilters, true)
    }

    try {
      const result = await createSwipe(user.id, targetId, like)
      if (result?.isMatch) {
        setMatchName(currentProfile.name)
        setShowMatchPopup(true)
      }
    } catch (err) {
      setProfiles((prev) => [currentProfile, ...prev])
      setError("Swipe failed. Please try again.")
    }
  }

  const handleClosePopup = () => {
    setShowMatchPopup(false)
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStart || !cardRef.current) return
    e.preventDefault()

    const currentX = e.clientX
    const currentY = e.clientY
    const offsetX = currentX - dragStart.x
    const offsetY = currentY - dragStart.y
    dragOffsetRef.current = { x: offsetX, y: offsetY }

    const rotate = offsetX * 0.05
    cardRef.current.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${rotate}deg)`
  }

  const handlePointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    setDragStart(null)

    const threshold = 100
    const offsetX = dragOffsetRef.current.x
    if (offsetX > threshold) {
      setDragOffset({ x: dragOffsetRef.current.x, y: dragOffsetRef.current.y })
      handleSwipe("right")
    } else if (offsetX < -threshold) {
      setDragOffset({ x: dragOffsetRef.current.x, y: dragOffsetRef.current.y })
      handleSwipe("left")
    } else {
      setDragOffset({ x: 0, y: 0 })
      dragOffsetRef.current = { x: 0, y: 0 }
      if (cardRef.current) cardRef.current.style.transform = ''
    }
  }

  if (loading && filteredProfiles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        Loading potential matches...
      </div>
    )
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-zinc-950 text-white">
        <div className="bg-zinc-900 p-8 rounded-full">
          <User className="w-16 h-16 text-zinc-700" />
        </div>
        <div className="text-xl font-bold">No more profiles to show</div>
        <p className="text-zinc-500 max-w-xs text-center">We've run out of study buddies nearby. Try adjusting your filters or come back later.</p>
        <Button onClick={() => window.location.reload()} className="bg-amber-500 text-black font-bold">Refresh Page</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent flex flex-col items-center pt-8 pb-6">

      <SwipeHint />

      <div className="container mx-auto px-4 max-w-sm relative z-10 flex flex-col h-full">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-black" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg">Discovery</span>
          </div>

          <SmartFilterDialog
            onApplyFilters={handleApplySmartFilters}
            loading={loading}
            trigger={
              <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors">
                <SlidersHorizontal className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                {activeFilterCount > 0 && (
                  <Badge className="h-5 px-1.5 min-w-[1.25rem] bg-amber-500 text-black text-[10px] hover:bg-amber-400 border-0">
                    {activeFilterCount}
                  </Badge>
                )}
              </button>
            }
          />
        </div>

        {/* === MAIN CARD STACK === */}
        <div className="relative w-full max-w-sm mx-auto flex-1 flex flex-col items-center justify-center min-h-[500px]">

          <div className="relative w-full h-[520px]">
            {/* Background Cards for Stack Effect */}
            <div className="absolute top-0 w-full transform scale-[0.92] opacity-40 translate-y-3 z-0 pointer-events-none">
              <div className="h-[520px] w-full rounded-[32px] bg-zinc-800 border border-white/5"></div>
            </div>

            <div className="absolute top-0 w-full transform scale-[0.85] opacity-20 translate-y-6 z-[-1] pointer-events-none">
              <div className="h-[520px] w-full rounded-[32px] bg-zinc-800 border border-white/5"></div>
            </div>

            {/* Active Card */}
            <SwipeCard
              profile={{
                ...currentProfile,
                subjects: currentProfile.subjects || [],
                goals: currentProfile.goals || [],
              }}
              dragOffset={dragOffset}
              isDragging={isDragging}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              cardRef={cardRef}
              showEmail={true}
            />

            {/* Report Button */}
            <button
              onClick={() => setReportModalOpen(true)}
              className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-all border border-white/10"
              title="Report User"
            >
              <Flag className="h-4 w-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 z-20 w-full">
            <SwipeActions
              onReject={() => handleSwipe("left")}
              onAccept={() => handleSwipe("right")}
              disabled={loading}
              showSuperLike={false}
            />
          </div>
        </div>

        {/* Match Popup */}
        {showMatchPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <Card className="w-full max-w-md bg-zinc-900 border border-amber-500/20 p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300 rounded-3xl relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-amber-500/5 blur-3xl"></div>
              </div>

              <div className="relative z-10">
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-500/30 blur-xl rounded-full animate-pulse"></div>
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl transform rotate-3">
                      <Heart className="h-12 w-12 text-black fill-black" />
                    </div>
                  </div>
                </div>

                <h2 className="mb-2 text-4xl font-black text-white tracking-tight">It's a Match!</h2>
                <p className="mb-8 text-zinc-400">
                  You and <span className="font-bold text-amber-500">{matchName || "your buddy"}</span> can now study together.
                </p>

                <div className="space-y-3">
                  <Link href="/chat" className="block w-full">
                    <Button className="w-full h-14 text-lg bg-amber-500 text-black font-bold hover:bg-amber-400 rounded-xl">
                      Say Hello 👋
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl"
                    onClick={handleClosePopup}
                  >
                    Keep Swiping
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        <ReportModal
          open={reportModalOpen}
          onOpenChange={setReportModalOpen}
          targetType={ReportTargetType.USER}
          targetId={currentProfile.id}
          onReportSubmitted={() => console.log("Reported")}
        />
      </div>
    </div>
  )
}
