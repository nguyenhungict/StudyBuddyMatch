"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, MapPin, Calendar, GraduationCap, Target, Trophy, Clock, Info, Mail } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface Profile {
    id: string
    name: string
    email?: string
    avatar: string
    school: string
    grade: string
    subjects: string[]
    schedule: string[]
    studyStyle: string
    goals: string[]
    bio: string
    compatibility?: number
    gender: string
    profilePhotos?: string[]
}

interface SwipeCardProps {
    profile: Profile
    dragOffset: { x: number; y: number }
    isDragging: boolean
    onPointerDown: (e: React.PointerEvent) => void
    onPointerMove: (e: React.PointerEvent) => void
    onPointerUp: () => void
    cardRef: React.RefObject<HTMLDivElement | null>
    showEmail?: boolean
}

export function SwipeCard({
    profile,
    dragOffset,
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerUp: onPointerLeave,
    cardRef,
    showEmail = false,
}: SwipeCardProps) {
    const [activeTab, setActiveTab] = useState<"overview" | "schedule">("overview")
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

    const photos =
        profile.profilePhotos && profile.profilePhotos.length > 0
            ? profile.profilePhotos
            : [profile.avatar || "/placeholder.svg"]
    const safePhotoIndex = currentPhotoIndex < photos.length ? currentPhotoIndex : 0

    const rotate = dragOffset.x * 0.05
    const opacityRight = Math.min(Math.max(dragOffset.x / 100, 0), 1)
    const opacityLeft = Math.min(Math.max(-dragOffset.x / 100, 0), 1)

    const isDayActive = (schedule: string[], day: string) => {
        return schedule.some(
            (s) =>
                s.toLowerCase().includes(day.toLowerCase()) ||
                (day === "Sat" && s.toLowerCase().includes("weekend")) ||
                (day === "Sun" && s.toLowerCase().includes("weekend"))
        )
    }

    return (
        <div
            ref={cardRef}
            className={cn(
                "absolute top-0 w-full z-10 touch-none cursor-grab active:cursor-grabbing select-none",
                !isDragging && "transition-all duration-300 ease-out"
            )}
            style={{
                transform: isDragging
                    ? undefined
                    : `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotate}deg)`,
                transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                willChange: "transform",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
        >
            <Card className="relative flex flex-col h-[540px] w-full max-w-[420px] mx-auto overflow-hidden rounded-[32px] bg-card shadow-2xl border border-border ring-1 ring-border hover:ring-2 hover:ring-amber-500/40 transition-shadow">

                {/* === HEADER IMAGE SECTION (45%) === */}
                <div className="relative h-[45%] shrink-0 w-full bg-muted group">
                    <Image
                        src={photos[safePhotoIndex]}
                        alt={profile.name}
                        fill
                        className="object-cover pointer-events-none select-none"
                        draggable={false}
                        priority
                    />

                    {/* Navigation Overlay */}
                    {photos.length > 1 && (
                        <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-all"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-all"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    )}

                    {/* Connect Dots */}
                    {photos.length > 1 && (
                        <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 z-20">
                            {photos.map((_, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all shadow-sm backdrop-blur-sm",
                                        safePhotoIndex === index ? "w-6 bg-amber-500" : "w-1.5 bg-white/40"
                                    )}
                                />
                            ))}
                        </div>
                    )}

                    {/* Gradient & Name - IMPORTANT: Gradient to match CARD BACKGROUND in Light/Dark */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-900 to-transparent pt-12 pb-3 px-5 dark:from-card">
                        {/* Note: In light mode, from-zinc-900 creates contrast for white text. In dark mode, from-card matches. */}
                        <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md font-['Inter'] leading-tight">
                            {profile.name}
                        </h2>
                        {showEmail && profile.email && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-white/90 bg-black/20 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 w-fit">
                                <Mail className="h-3 w-3 text-amber-500" />
                                <span className="font-medium">{profile.email}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1 text-xs/tight font-medium text-white/90 bg-black/20 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                                <MapPin className="h-3 w-3 text-amber-500" />
                                <span className="truncate max-w-[120px]">{profile.school}</span>
                            </span>
                            <span className="flex items-center gap-1 text-xs/tight font-medium text-white/90 bg-black/20 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                                <Calendar className="h-3 w-3 text-amber-500" />
                                {profile.grade}
                            </span>
                        </div>
                    </div>

                    {/* Indicators */}
                    <div
                        className="absolute top-8 left-8 border-4 border-[#22C55E] rounded-xl px-4 py-1 transform -rotate-12 font-black text-[#22C55E] text-3xl tracking-widest uppercase bg-card/90 shadow-xl transition-opacity duration-200 pointer-events-none z-30"
                        style={{ opacity: opacityRight }}
                    >
                        LIKE
                    </div>
                    <div
                        className="absolute top-8 right-8 border-4 border-[#EF4444] rounded-xl px-4 py-1 transform rotate-12 font-black text-[#EF4444] text-3xl tracking-widest uppercase bg-card/90 shadow-xl transition-opacity duration-200 pointer-events-none z-30"
                        style={{ opacity: opacityLeft }}
                    >
                        NOPE
                    </div>
                </div>

                {/* === CONTENT SECTION (55%) === */}
                <div className="flex-1 bg-card flex flex-col relative" onPointerDown={(e) => e.stopPropagation()}>

                    <div className="px-5 pt-4 pb-2">
                        <div className="flex p-1 bg-muted rounded-xl relative z-10 border border-border">
                            <button
                                onClick={() => setActiveTab("overview")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all duration-300",
                                    activeTab === "overview"
                                        ? "bg-card text-foreground shadow-sm ring-1 ring-border scale-[1.02]"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Info className="h-3.5 w-3.5" />
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab("schedule")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all duration-300",
                                    activeTab === "schedule"
                                        ? "bg-card text-foreground shadow-sm ring-1 ring-border scale-[1.02]"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Clock className="h-3.5 w-3.5" />
                                Schedule
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 pb-4 scrollbar-hide text-card-foreground">
                        {activeTab === "overview" ? (
                            <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="relative pl-3 border-l-[3px] border-amber-500">
                                    <p className="text-sm font-medium leading-relaxed text-muted-foreground italic">
                                        "{profile.bio}"
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <GraduationCap className="h-3 w-3 text-amber-500" /> Subjects
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.subjects.map((sub, i) => (
                                            <Badge key={i} variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 text-xs px-2.5 py-1">
                                                {sub}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                    <div>
                                        <h3 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <Target className="h-3 w-3 text-amber-500" /> Style
                                        </h3>
                                        <p className="text-xs font-semibold text-foreground bg-muted/50 px-2 py-1.5 rounded-md border border-border">
                                            {profile.studyStyle}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <Trophy className="h-3 w-3 text-amber-500" /> Goal
                                        </h3>
                                        <p className="text-xs font-semibold text-foreground bg-muted/50 px-2 py-1.5 rounded-md border border-border truncate">
                                            {profile.goals[0] || "General Study"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h3 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3 text-amber-500" /> Weekly
                                    </h3>
                                    <div className="flex justify-between gap-1">
                                        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
                                            const fullDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                                            const active = isDayActive(profile.schedule, fullDays[i])
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center">
                                                    <div className={cn(
                                                        "w-full aspect-[4/5] rounded-md flex items-center justify-center text-xs font-bold transition-all",
                                                        active ? "bg-amber-500 text-black shadow-sm" : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {d}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Clock className="h-3 w-3 text-amber-500" /> Times
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {["Morning", "Afternoon", "Evening", "Night"]
                                            .filter(t => isDayActive(profile.schedule, t))
                                            .map(t => (
                                                <Badge key={t} variant="outline" className="text-xs font-medium border-border text-muted-foreground px-3 py-1 bg-muted">
                                                    {t}
                                                </Badge>
                                            ))}
                                        {profile.schedule.length === 0 && (
                                            <span className="text-xs text-muted-foreground italic">No specific times listed</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}
