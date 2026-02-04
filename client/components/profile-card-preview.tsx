"use client"

import { useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { MapPin, Calendar, Clock, Info, BookOpen, GraduationCap, Target, Trophy, ChevronLeft, ChevronRight } from "lucide-react"

interface ProfileCardPreviewProps {
    user: {
        name: string
        avatar: string
        school: string
        grade: string
        gender: string
        bio: string
        subjects: string[]
        studyStyle: string
        goals: string[]
        schedule: string[] // ["Mon", "Morning", "Tue", "Afternoon", ...]
        profilePhotos?: string[]
    }
}

export function ProfileCardPreview({ user }: ProfileCardPreviewProps) {
    const [activeTab, setActiveTab] = useState<"overview" | "schedule">("overview")
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

    // Use profile photos if available, otherwise fallback to avatar
    const photos = user.profilePhotos && user.profilePhotos.length > 0
        ? user.profilePhotos
        : [user.avatar || "/placeholder.svg"]

    const isDayActive = (schedule: string[], day: string) => {
        if (!schedule || !Array.isArray(schedule)) return false
        // Support both "Mon" and "Monday", case-insensitive
        return schedule.some(s =>
            s.toLowerCase().includes(day.toLowerCase()) ||
            day.toLowerCase().includes(s.toLowerCase().substring(0, 3))
        )
    }

    const goToPrevPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
    }

    const goToNextPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
    }

    return (
        <div className="relative flex flex-col h-[650px] w-full max-w-sm mx-auto overflow-hidden rounded-xl bg-card shadow-2xl">
            {/* Image Section with Carousel */}
            <div className="relative h-[42%] shrink-0 w-full bg-muted group">
                <Image
                    src={photos[currentPhotoIndex]}
                    alt={user.name}
                    fill
                    className="object-cover pointer-events-none"
                />

                {/* Photo Navigation Arrows */}
                {photos.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevPhoto}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={goToNextPhoto}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </>
                )}

                {/* Photo Navigation Dots */}
                {photos.length > 1 && (
                    <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                        {photos.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentPhotoIndex(index)}
                                className={cn(
                                    "h-1.5 rounded-full transition-all",
                                    currentPhotoIndex === index
                                        ? "w-6 bg-white"
                                        : "w-1.5 bg-white/50 hover:bg-white/75"
                                )}
                            />
                        ))}
                    </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 pt-10">
                    <h2 className="mb-1.5 text-2xl font-bold text-white tracking-tight drop-shadow-md">{user.name}</h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-white/95 font-medium drop-shadow-sm">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-amber-400" />
                            <span>{user.school || "N/A"}</span>
                        </div>
                        <span className="text-white/50">•</span>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-amber-400" />
                            <span>{user.grade || "N/A"}</span>
                        </div>
                        <span className="text-white/50">•</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-white/90">{user.gender || "N/A"}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className="flex-1 bg-card flex flex-col min-h-0 cursor-default"
            // onPointerDown={(e) => e.stopPropagation()} // Not needed for preview
            >
                {/* Custom Tab Switcher */}
                <div className="flex items-center border-b border-border/40 px-4">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={cn(
                            "flex items-center gap-2 py-3 px-1 text-sm font-semibold transition-colors relative",
                            activeTab === "overview"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Info className="h-4 w-4" />
                        Overview
                        {activeTab === "overview" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                    <div className="w-6" />
                    <button
                        onClick={() => setActiveTab("schedule")}
                        className={cn(
                            "flex items-center gap-2 py-3 px-1 text-sm font-semibold transition-colors relative",
                            activeTab === "schedule"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Clock className="h-4 w-4" />
                        Schedule
                        {activeTab === "schedule" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 p-5 overflow-y-auto no-scrollbar">
                    {activeTab === "overview" ? (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Bio Section */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground/80 uppercase tracking-wider">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    About Me
                                </div>
                                <p className="text-[15px] leading-relaxed text-muted-foreground font-normal">
                                    {user.bio || "No bio available."}
                                </p>
                            </div>

                            {/* Subjects */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground/80 uppercase tracking-wider">
                                    <GraduationCap className="h-4 w-4 text-primary" />
                                    Subjects
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {user.subjects && user.subjects.length > 0 ? (
                                        user.subjects.map((subject) => (
                                            <Badge
                                                key={subject}
                                                variant="secondary"
                                                className="px-3 py-1 text-sm font-medium bg-secondary text-secondary-foreground"
                                            >
                                                {subject}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground italic">No subjects listed</span>
                                    )}
                                </div>
                            </div>

                            {/* Goals & Style Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-bold text-foreground/80 uppercase tracking-wider">
                                        <Target className="h-4 w-4 text-primary" />
                                        Style
                                    </div>
                                    <Badge variant="outline" className="text-xs px-2.5 py-1 font-medium border-primary/20 text-primary bg-primary/5">
                                        {user.studyStyle || "N/A"}
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-bold text-foreground/80 uppercase tracking-wider">
                                        <Trophy className="h-4 w-4 text-primary" />
                                        Goals
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {user.goals && user.goals.length > 0 ? (
                                            <>
                                                {user.goals.slice(0, 2).map((goal) => (
                                                    <Badge key={goal} variant="outline" className="text-xs px-2 py-0.5 font-medium border-amber-500/30 text-amber-700 bg-amber-50">
                                                        {goal}
                                                    </Badge>
                                                ))}
                                                {user.goals.length > 2 && (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 text-muted-foreground">
                                                        +{user.goals.length - 2}
                                                    </Badge>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">N/A</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col">
                            {/* Schedule Summary */}
                            <div className="bg-muted/30 rounded-xl p-4 border border-border/60">
                                <div className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wider">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    Weekly Availability
                                </div>

                                <div className="grid grid-cols-7 gap-y-4 gap-x-1">
                                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                                        const isActive = isDayActive(user.schedule, day);
                                        return (
                                            <div key={day} className="flex flex-col items-center gap-2">
                                                <span className={cn(
                                                    "text-[10px] uppercase font-bold tracking-widest",
                                                    isActive ? "text-primary" : "text-muted-foreground/50"
                                                )}>{day}</span>
                                                <div className={cn(
                                                    "h-10 w-2.5 rounded-full transition-all duration-300",
                                                    isActive
                                                        ? "bg-gradient-to-b from-primary to-primary/60 shadow-md scale-100"
                                                        : "bg-muted-foreground/10"
                                                )} />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Slot Details */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Preferred Times</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {["Morning", "Afternoon", "Evening", "Night"].filter(time => isDayActive(user.schedule, time)).map(time => (
                                        <div key={time} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors shadow-sm">
                                            <div className={cn("w-2 h-2 rounded-full",
                                                time === "Morning" ? "bg-orange-400" :
                                                    time === "Afternoon" ? "bg-yellow-400" :
                                                        time === "Evening" ? "bg-indigo-500" : "bg-purple-900"
                                            )}></div>
                                            <span className="font-medium text-sm">{time}</span>
                                        </div>
                                    ))}
                                    {user.schedule.length === 0 && (
                                        <div className="col-span-2 text-center py-4 text-muted-foreground italic text-sm">
                                            Flexible / No specific preference
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Border Overlay */}
            <div className="absolute inset-0 rounded-xl border-2 border-border pointer-events-none" />
        </div>
    )
}
