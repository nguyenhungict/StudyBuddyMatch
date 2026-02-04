"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, Calendar, Info, Clock, BookOpen, GraduationCap, Target, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { userService } from "@/lib/user";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface UserProfileData {
    id: string;
    name: string;
    avatar: string;
    school: string;
    grade: string;
    gender: string;
    bio: string;
    subjects: string[];
    studyStyle: string;
    goals: string[];
    schedule: string[];
    photos: string[];
}

interface UserProfileModalProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
}

// Helper to check if a day is in the schedule
const isDayActive = (schedule: string[], day: string) => {
    return schedule.some(s => s.toLowerCase().includes(day.toLowerCase()) ||
        (day === "Sat" && s.toLowerCase().includes("weekend")) ||
        (day === "Sun" && s.toLowerCase().includes("weekend")));
};

export default function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "schedule">("overview");
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [mounted, setMounted] = useState(false);

    // For portal - ensure we're on client
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen || !userId) return;

        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await userService.getPublicProfile(userId);
                if (data) {
                    setProfile(data);
                } else {
                    setError("User not found");
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
                setError("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId, isOpen]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setActiveTab("overview");
            setCurrentPhotoIndex(0);
        }
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const photos = profile?.photos && profile.photos.length > 0
        ? profile.photos
        : profile?.avatar ? [profile.avatar] : ["/placeholder-user.jpg"];
    const safePhotoIndex = currentPhotoIndex < photos.length ? currentPhotoIndex : 0;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-lg mx-4 h-[100vh] max-h-[100vh] overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-gray-500">Loading profile...</div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-96 gap-4">
                        <div className="text-red-500">{error}</div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                ) : profile ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Image Section */}
                        <div className="relative h-[40%] shrink-0 w-full bg-gray-200 group">
                            <Image
                                src={photos[safePhotoIndex]}
                                alt={profile.name}
                                fill
                                className="object-cover"
                            />

                            {/* Photo Navigation Arrows */}
                            {photos.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
                                        }}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </>
                            )}

                            {/* Photo Navigation Dots */}
                            {photos.length > 1 && (
                                <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 z-20">
                                    {photos.map((_: string, index: number) => (
                                        <button
                                            key={index}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentPhotoIndex(index);
                                            }}
                                            className={cn(
                                                "h-1.5 rounded-full transition-all",
                                                safePhotoIndex === index
                                                    ? "w-6 bg-white"
                                                    : "w-1.5 bg-white/50 hover:bg-white/75"
                                            )}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Gradient Overlay with User Info */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 pt-10">
                                <h2 className="mb-1.5 text-2xl font-bold text-white tracking-tight drop-shadow-md">
                                    {profile.name}
                                </h2>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-white/95 font-medium drop-shadow-sm">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-amber-400" />
                                        <span>{profile.school || "Unknown School"}</span>
                                    </div>
                                    <span className="text-white/50">•</span>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-amber-400" />
                                        <span>{profile.grade || "Grade"}</span>
                                    </div>
                                    <span className="text-white/50">•</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-white/90">{profile.gender || "N/A"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Tab Switcher */}
                            <div className="flex items-center border-b border-gray-200 px-4">
                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className={cn(
                                        "flex items-center gap-2 py-3 px-1 text-sm font-semibold transition-colors relative",
                                        activeTab === "overview"
                                            ? "text-amber-600"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    <Info className="h-4 w-4" />
                                    Overview
                                    {activeTab === "overview" && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-t-full" />
                                    )}
                                </button>
                                <div className="w-6" />
                                <button
                                    onClick={() => setActiveTab("schedule")}
                                    className={cn(
                                        "flex items-center gap-2 py-3 px-1 text-sm font-semibold transition-colors relative",
                                        activeTab === "schedule"
                                            ? "text-amber-600"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    <Clock className="h-4 w-4" />
                                    Schedule
                                    {activeTab === "schedule" && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-t-full" />
                                    )}
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 p-4 overflow-y-auto">
                                {activeTab === "overview" ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {/* Bio Section */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                <BookOpen className="h-4 w-4 text-amber-600" />
                                                About Me
                                            </div>
                                            <p className="text-[15px] leading-relaxed text-gray-600">
                                                {profile.bio || "No bio yet."}
                                            </p>
                                        </div>

                                        {/* Subjects */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                <GraduationCap className="h-4 w-4 text-amber-600" />
                                                Subjects
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.subjects.length > 0 ? (
                                                    profile.subjects.map((subject) => (
                                                        <span
                                                            key={subject}
                                                            className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded-full"
                                                        >
                                                            {subject}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-500 text-sm italic">No subjects specified</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Goals & Style Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                    <Target className="h-4 w-4 text-amber-600" />
                                                    Style
                                                </div>
                                                <span className="inline-block text-xs px-2.5 py-1 font-medium border border-amber-200 text-amber-700 bg-amber-50 rounded-full">
                                                    {profile.studyStyle || "Any style"}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                    <Trophy className="h-4 w-4 text-amber-600" />
                                                    Goals
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {profile.goals.length > 0 ? (
                                                        profile.goals.slice(0, 2).map((goal) => (
                                                            <span
                                                                key={goal}
                                                                className="text-xs px-2 py-0.5 font-medium border border-amber-300 text-amber-700 bg-amber-50 rounded-full"
                                                            >
                                                                {goal}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-500 text-xs italic">No goals specified</span>
                                                    )}
                                                    {profile.goals.length > 2 && (
                                                        <span className="text-[10px] px-1.5 py-0.5 text-gray-500 border border-gray-200 rounded-full">
                                                            +{profile.goals.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {/* Schedule Summary */}
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                <Calendar className="h-4 w-4 text-amber-600" />
                                                Weekly Availability
                                            </div>

                                            <div className="grid grid-cols-7 gap-y-4 gap-x-1">
                                                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                                                    const isActive = isDayActive(profile.schedule || [], day);
                                                    return (
                                                        <div key={day} className="flex flex-col items-center gap-2">
                                                            <span className={cn(
                                                                "text-[10px] uppercase font-bold tracking-widest",
                                                                isActive ? "text-amber-600" : "text-gray-400"
                                                            )}>{day}</span>
                                                            <div className={cn(
                                                                "h-10 w-2.5 rounded-full transition-all duration-300",
                                                                isActive
                                                                    ? "bg-gradient-to-b from-amber-500 to-amber-400 shadow-md"
                                                                    : "bg-gray-200"
                                                            )} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Slot Details */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Preferred Times</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {["Morning", "Afternoon", "Evening", "Night"]
                                                    .filter(time => isDayActive(profile.schedule || [], time))
                                                    .map(time => (
                                                        <div key={time} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                                                            <div className={cn("w-2 h-2 rounded-full",
                                                                time === "Morning" ? "bg-orange-400" :
                                                                    time === "Afternoon" ? "bg-yellow-400" :
                                                                        time === "Evening" ? "bg-indigo-500" : "bg-purple-900"
                                                            )}></div>
                                                            <span className="font-medium text-sm text-gray-700">{time}</span>
                                                        </div>
                                                    ))}
                                                {!["Morning", "Afternoon", "Evening", "Night"].some(time => isDayActive(profile.schedule || [], time)) && (
                                                    <div className="col-span-2 text-center py-4 text-gray-500 italic text-sm">
                                                        Flexible / No specific preference
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );

    // Use portal to render at document body level (bypasses chat container's fixed positioning)
    return createPortal(modalContent, document.body);
}
