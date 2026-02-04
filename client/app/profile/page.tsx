"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MapPin,
  Award,
  Edit,
  Settings,
  LogOut,
  User,
  Eye,
  Calendar,
  BookOpen,
  Target
} from "lucide-react"
import Link from "next/link"
import { userService } from "@/lib/user"
import { getMatches } from "@/lib/matches"
import { useAuth } from "@/context/AuthContext"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ProfileCardPreview } from "@/components/profile-card-preview"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
  const { logout } = useAuth()
  const [loading, setLoading] = useState(true)

  const [user, setUser] = useState({
    name: "User",
    email: "",
    school: "",
    age: "",
    birthday: "",
    gender: "",
    achievement: "",
    bio: "",
    matchCount: 0,
    profileStrength: 0,
    avatar: "",
    grade: "",
    subjects: [] as string[],
    studyStyle: "",
    goals: [] as string[],
    schedule: [] as string[],
    profilePhotos: [] as string[],
  })

  // --- LOGIC LẤY DỮ LIỆU TỪ BACKEND ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile()
        const userProfile = data.profile || {}

        // 1. Get Real Match Count
        let realMatchCount = 0
        try {
          if (data.id) {
            const matches = await getMatches(data.id)
            realMatchCount = matches.length
          }
        } catch (err) {
          console.error("Failed to fetch matches count", err)
        }

        // Schedule parsing
        let scheduleArray: string[] = []
        if (userProfile.studySchedule) {
          let days: string[] = []
          if (Array.isArray(userProfile.studySchedule.days)) {
            days = userProfile.studySchedule.days
          } else if (userProfile.studySchedule.days) {
            days = [userProfile.studySchedule.days]
          }

          let times: string[] = []
          if (Array.isArray(userProfile.studySchedule.time)) {
            times = userProfile.studySchedule.time
          } else if (userProfile.studySchedule.time) {
            times = userProfile.studySchedule.time.split(",").map((s: string) => s.trim())
          }
          scheduleArray = [...days, ...times]
        }

        // Fetch profile photos
        let photos: string[] = []
        try {
          const photosResponse = await fetch('/api/profile-photos')
          if (photosResponse.ok) {
            const photosData = await photosResponse.json()
            photos = photosData.map((photo: any) => photo.photoUrl)
          }
        } catch (photoError) {
          console.error('Error fetching profile photos:', photoError)
        }

        const subjects = Array.isArray(userProfile.subjects) ? userProfile.subjects : []

        // Calculate Profile Strength
        let strength = 0
        if (userProfile.avatarUrl) strength += 20
        if (userProfile.bio && userProfile.bio.length > 10) strength += 20
        if (subjects.length > 0) strength += 20
        if (scheduleArray.length > 0) strength += 20
        if (userProfile.learningGoals && userProfile.learningGoals.length > 0) strength += 20

        setUser({
          name: data.fullName || data.email?.split('@')[0] || "User",
          email: data.email || "",
          school: userProfile.school || "Not specified",
          grade: userProfile.gradeLevel || "N/A",
          age: userProfile.age ? userProfile.age.toString() : "",
          birthday: userProfile.birthday || "",
          gender: userProfile.gender || "Not specified",
          achievement: userProfile.achievement || "No achievements yet",
          bio: userProfile.bio || "No bio available.",

          // REAL DATA
          matchCount: realMatchCount,
          profileStrength: strength,

          avatar: userProfile.avatarUrl || "",
          subjects: subjects,
          studyStyle: Array.isArray(userProfile.studyStyles) ? userProfile.studyStyles.join(", ") : (userProfile.studyStyles || "Flexible"),
          goals: Array.isArray(userProfile.learningGoals) ? userProfile.learningGoals : [],
          schedule: scheduleArray,
          profilePhotos: photos
        })
      } catch (error) {
        console.error("Failed to load profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent text-muted-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* --- HEADER SECTION --- */}
      <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-sm">
        {/* Background Cover Mockup */}
        <div className="h-32 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-purple-500/10"></div>

        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6 mt-[-3rem] items-start">
            {/* Avatar */}
            <div className="relative">
              <div className="h-28 w-28 rounded-2xl p-1 bg-card border border-border">
                <Avatar className="h-full w-full rounded-xl">
                  <AvatarImage src={user.avatar} className="object-cover" />
                  <AvatarFallback className="bg-muted text-amber-500 text-2xl font-bold border border-border">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute bottom-2 right-[-0.5rem] bg-green-500 w-4 h-4 rounded-full border-[3px] border-card"></div>
            </div>

            {/* Info */}
            <div className="flex-1 mt-12 md:mt-0 pt-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-1">{user.name}</h1>
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" />
                    {user.school} • {user.grade}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link href="/profile-setup">
                    <Button className="bg-amber-500 text-black hover:bg-amber-400 font-bold shadow-lg shadow-amber-500/20">
                      <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                  </Link>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-border bg-background/50 text-foreground hover:bg-secondary">
                        <Eye className="mr-2 h-4 w-4" /> Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-transparent border-none shadow-none p-0">
                      <div className="w-full flex justify-center">
                        <ProfileCardPreview user={user} />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {user.bio && (
                <p className="mt-4 text-foreground/80 text-sm leading-relaxed max-w-2xl border-l-2 border-amber-500/50 pl-3 italic bg-muted/30 py-2 pr-2 rounded-r-md">
                  "{user.bio}"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* --- LEFT COLUMN (Stats & Info) --- */}
        <div className="space-y-6">
          <Card className="border-border bg-card/80 backdrop-blur-md shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-amber-500" /> About
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground text-sm">Age</span>
                <span className="text-foreground text-sm font-medium">{user.age || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground text-sm">Gender</span>
                <span className="text-foreground text-sm font-medium capitalize">{user.gender || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground text-sm">Birthday</span>
                <span className="text-foreground text-sm font-medium">{user.birthday || "N/A"}</span>
              </div>
              <div className="pt-2">
                <span className="text-muted-foreground text-sm block mb-2">Style</span>
                <Badge variant="outline" className="border-amber-500/20 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10">
                  {user.studyStyle}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/80 backdrop-blur-md shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center p-4 rounded-xl bg-secondary/30 border border-border/50">
                <div className="text-2xl font-bold text-foreground mb-1">{user.matchCount}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">Total Matches</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/30 border border-border/50">
                <div className="text-2xl font-bold text-amber-500 mb-1">{user.profileStrength}%</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">Profile Strength</div>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>

        {/* --- RIGHT COLUMN (Details) --- */}
        <div className="md:col-span-2 space-y-6">
          {/* Subjects & Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border bg-card/80 backdrop-blur-md shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" /> Subjects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.subjects.length > 0 ? (
                    user.subjects.map((sub, i) => (
                      <Badge key={i} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/50">
                        {sub}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm italic">No subjects added</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/80 backdrop-blur-md shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" /> Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {user.goals.length > 0 ? (
                    user.goals.map((goal, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        {goal}
                      </div>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm italic">No goals set</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievement */}
          <Card className="border-border bg-card/80 backdrop-blur-md shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-500" /> Achievement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/10">
                <div className="p-3 bg-card rounded-lg border border-border">
                  <Award className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">Current Level</h4>
                  <p className="text-muted-foreground text-sm">{user.achievement}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card className="border-border bg-card/80 backdrop-blur-md shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-500" /> Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.schedule.length > 0 ? (
                  user.schedule.map((slot, i) => (
                    <Badge key={i} variant="outline" className="border-amber-500/20 text-amber-500 bg-amber-500/5">
                      {slot}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm italic">No schedule set</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Settings Link */}
          <div className="flex justify-end pt-4">
            <Link href="/settings">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                <Settings className="mr-2 h-4 w-4" /> Account Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}