"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, X, Calendar, MapPin, GraduationCap, Users, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { getMatches, unmatch, type Match as APIMatch } from "@/lib/matches"
import { useAuth } from "@/context/AuthContext"
import { ProfileCardPreview } from "./profile-card-preview"

interface Match {
    id: string
    matchId: string // The ID of the match record
    name: string
    email: string
    avatar: string
    school: string
    grade: string
    gender: string
    bio: string
    subjects: string[]
    studyStyle: string
    goals: string[]
    schedule: string[]
    matchedAt: string
    profilePhotos: string[]
}

export function MatchingList() {
    const { user } = useAuth()
    const [matches, setMatches] = useState<Match[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

    useEffect(() => {
        const fetchMatches = async () => {
            if (!user?.id) {
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError(null)

                const apiMatches = await getMatches(user.id)

                // Transform backend data to component format
                const transformedMatches: Match[] = apiMatches.map((match: APIMatch) => {
                    // Determine which user is the "other" user (not the current user)
                    const isUser1 = match.user1Id === user.id
                    const otherUser = isUser1 ? match.user2 : match.user1

                    // Extract schedule from profile
                    const schedule: string[] = []
                    // You might need to adjust this based on your actual profile structure
                    // For now, using empty array as placeholder

                    // Map profile photos from backend
                    const profilePhotos = otherUser.profile?.photos?.map((p: any) =>
                        p.photoUrl?.startsWith('/uploads')
                            ? `http://localhost:8888${p.photoUrl}`
                            : p.photoUrl
                    ) || []

                    return {
                        id: otherUser.id,
                        matchId: match.id, // Store the match record ID for unmatch operation
                        name: otherUser.profile?.username || otherUser.email?.split('@')[0] || "Study Buddy",
                        email: otherUser.email || "",
                        avatar: otherUser.profile?.avatarUrl || "/placeholder-user.jpg",
                        school: otherUser.profile?.school || "Unknown School",
                        grade: otherUser.profile?.tagLevel?.name || "N/A",
                        gender: otherUser.profile?.tagGender?.name || "N/A",
                        bio: otherUser.profile?.bio || "No bio available",
                        subjects: otherUser.profile?.tagSubject?.name ? [otherUser.profile.tagSubject.name] : [],
                        studyStyle: "Any style", // TODO: Add to backend
                        goals: [], // TODO: Add to backend
                        schedule: schedule,
                        matchedAt: match.createdAt,
                        profilePhotos: profilePhotos,
                    }
                })

                setMatches(transformedMatches)
            } catch (err) {
                console.error("Failed to fetch matches:", err)
                setError("Failed to load matches. Please try again.")
            } finally {
                setLoading(false)
            }
        }

        if (open) {
            fetchMatches()
        }
    }, [open, user?.id])

    const handleUnmatch = async (matchId: string, userName: string, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent opening the profile card

        if (!user?.id) return

        if (!confirm(`Are you sure you want to unmatch with ${userName}?`)) {
            return
        }

        try {
            await unmatch(matchId, user.id)
            // Remove from local state
            setMatches(matches.filter((m) => m.matchId !== matchId))
        } catch (error) {
            console.error("Failed to unmatch:", error)
            alert("Failed to unmatch. Please try again.")
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        className="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                    >
                        <Users className="mr-2 h-4 w-4" />
                        My Matches ({matches.length})
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Heart className="h-5 w-5 text-primary fill-primary" />
                            My Matches
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-muted-foreground">Loading matches...</div>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <X className="h-16 w-16 text-destructive/30 mb-4" />
                                <h3 className="text-lg font-semibold text-foreground mb-2">Error</h3>
                                <p className="text-sm text-muted-foreground">{error}</p>
                            </div>
                        ) : matches.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Heart className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-semibold text-foreground mb-2">No matches yet</h3>
                                <p className="text-sm text-muted-foreground">
                                    Start swiping to find your study buddies!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {matches.map((match) => (
                                    <div
                                        key={match.matchId}
                                        onClick={() => setSelectedMatch(match)}
                                        className="group relative flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/5 hover:border-primary/30 transition-all cursor-pointer"
                                    >
                                        {/* Avatar */}
                                        <div className="relative">
                                            <Avatar className="h-14 w-14 border-2 border-border">
                                                {match.avatar ? (
                                                    <img
                                                        src={match.avatar}
                                                        alt={match.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                        {match.name.charAt(0)}
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>
                                            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white" />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-foreground truncate">{match.name}</h4>
                                                    <p className="text-xs text-muted-foreground font-mono truncate flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {match.email}
                                                    </p>
                                                </div>
                                                <Badge variant="secondary" className="text-xs shrink-0">
                                                    {new Date(match.matchedAt).toLocaleDateString()}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    <span className="truncate max-w-[150px]">{match.school}</span>
                                                </div>
                                                <span className="text-muted-foreground/50">•</span>
                                                <div className="flex items-center gap-1">
                                                    <GraduationCap className="h-3 w-3" />
                                                    <span>{match.grade}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5">
                                                {match.subjects.slice(0, 3).map((subject) => (
                                                    <Badge
                                                        key={subject}
                                                        variant="outline"
                                                        className="text-xs px-2 py-0 bg-orange-50 text-orange-700 border-orange-200"
                                                    >
                                                        {subject}
                                                    </Badge>
                                                ))}
                                                {match.subjects.length > 3 && (
                                                    <Badge variant="outline" className="text-xs px-2 py-0 text-muted-foreground">
                                                        +{match.subjects.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Unmatch Button */}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => handleUnmatch(match.matchId, match.name, e)}
                                            title="Unmatch"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {matches.length > 0 && !loading && !error && (
                        <div className="border-t border-border pt-4 mt-4">
                            <p className="text-xs text-muted-foreground text-center">
                                You have {matches.length} active {matches.length === 1 ? "match" : "matches"}
                            </p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Profile Detail Dialog */}
            <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
                <DialogContent className="max-w-md bg-transparent border-none shadow-none p-0">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Profile Details</DialogTitle>
                    </DialogHeader>
                    {selectedMatch && (
                        <div className="w-full flex justify-center">
                            <ProfileCardPreview user={selectedMatch} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
