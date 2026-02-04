"use client"

import { useState, useEffect } from "react"
import { Sparkles, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"

// All options matching Edit Profile
const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science"]
const STUDY_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const STUDY_TIMES = [
    "Morning (6am-12pm)",
    "Afternoon (12pm-6pm)",
    "Evening (6pm-9pm)",
    "Night (9pm-12am)",
]
const GRADE_LEVELS = ["Grade 10", "Grade 11", "Grade 12"]
const STUDY_STYLES = ["Visual", "Auditory", "Kinesthetic", "Reading", "Group", "Individual"]
const LEARNING_GOALS = ["Exam Preparation", "Improve Grades", "Deep Understanding", "Practice", "Review", "Homework"]

// Only these 3 are sent to ML matching server
export interface SmartFilters {
    subject?: string
    studyDays: string[]
    studyTimes: string[]
}

interface SmartFilterDialogProps {
    onApplyFilters: (filters: SmartFilters) => void
    loading?: boolean
    trigger?: React.ReactNode
}

export function SmartFilterDialog({ onApplyFilters, loading = false, trigger }: SmartFilterDialogProps) {
    const [open, setOpen] = useState(false)

    // 3 MAIN FILTERS (used for ML matching)
    const [subject, setSubject] = useState<string | undefined>(undefined)
    const [studyDays, setStudyDays] = useState<string[]>([])
    const [studyTimes, setStudyTimes] = useState<string[]>([])

    // OTHER PROFILE FIELDS (saved to profile but NOT used for matching)
    const [gradeLevel, setGradeLevel] = useState<string | undefined>(undefined)
    const [studyStyle, setStudyStyle] = useState<string | undefined>(undefined)
    const [learningGoal, setLearningGoal] = useState<string | undefined>(undefined)

    const [profileLoading, setProfileLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    const { user } = useAuth()
    const { toast } = useToast()

    // Load profile when dialog opens
    useEffect(() => {
        if (open && user?.id) {
            loadUserProfile()
        }
    }, [open, user?.id])

    const loadUserProfile = async () => {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        setProfileLoading(true)
        try {
            const res = await fetch('http://localhost:8888/users/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                const profile = data.profile || data || {}

                // Load main filters
                if (profile.subjects?.[0]) setSubject(profile.subjects[0])
                else if (profile.tagSubject?.name) setSubject(profile.tagSubject.name)

                // Load schedule
                if (data.studySlots && Array.isArray(data.studySlots)) {
                    const days = new Set<string>()
                    const times = new Set<string>()
                    data.studySlots.forEach((slot: any) => {
                        if (slot.tagStudyDay?.name) days.add(slot.tagStudyDay.name)
                        if (slot.tagStudyTime?.name) times.add(slot.tagStudyTime.name)
                    })
                    setStudyDays(Array.from(days))
                    setStudyTimes(Array.from(times))
                } else if (profile.studySchedule) {
                    setStudyDays(profile.studySchedule.days || [])
                }

                // Load other fields
                if (profile.gradeLevel) setGradeLevel(profile.gradeLevel)
                else if (profile.tagLevel?.name) setGradeLevel(profile.tagLevel.name)

                if (profile.studyStyles?.[0]) setStudyStyle(profile.studyStyles[0])
                else if (profile.tagStudyStyle?.name) setStudyStyle(profile.tagStudyStyle.name)

                if (profile.learningGoals?.[0]) setLearningGoal(profile.learningGoals[0])
                else if (profile.tagLearningGoal?.name) setLearningGoal(profile.tagLearningGoal.name)
            }
        } catch (error) {
            console.error('Failed to load profile:', error)
        } finally {
            setProfileLoading(false)
        }
    }

    const saveAllToProfile = async () => {
        const token = localStorage.getItem('accessToken')
        if (!token) return false

        setSaving(true)
        try {
            // Build complete profile update with ALL fields
            const updateData: any = {}

            // Main filters
            if (subject) updateData.subjects = [subject]
            if (studyDays.length > 0 || studyTimes.length > 0) {
                updateData.studySchedule = {
                    days: studyDays,
                    time: studyTimes.map(t => t.split('(')[0].trim()).join(', ')
                }
            }

            // Other profile fields
            if (gradeLevel) updateData.gradeLevel = gradeLevel
            if (studyStyle) updateData.studyStyle = [studyStyle]
            if (learningGoal) updateData.learningGoals = [learningGoal]

            const res = await fetch('http://localhost:8888/users/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            })

            if (!res.ok) {
                console.error('Failed to save profile:', await res.text())
                return false
            }

            return true
        } catch (error) {
            console.error('Profile save error:', error)
            return false
        } finally {
            setSaving(false)
        }
    }

    const toggleDay = (day: string) => {
        setStudyDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
    }

    const toggleTime = (time: string) => {
        setStudyTimes(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time])
    }

    const handleApply = async () => {
        // Save ALL fields to profile
        const saved = await saveAllToProfile()
        if (saved) {
            toast({ title: "✅ Profile Updated", description: "All preferences saved!" })
        }

        // Send ONLY 3 main filters to matching server
        const filtersToSend = {
            subject,
            studyDays,
            studyTimes,
        }
        console.log('🎯 [Smart Filter] Sending filters to matching:', filtersToSend)
        onApplyFilters(filtersToSend)
        setOpen(false)
    }

    const handleClear = () => {
        setSubject(undefined)
        setStudyDays([])
        setStudyTimes([])
        setGradeLevel(undefined)
        setStudyStyle(undefined)
        setLearningGoal(undefined)
    }

    const hasActiveFilters = !!subject || studyDays.length > 0 || studyTimes.length > 0
    const activeCount = (subject ? 1 : 0) + (studyDays.length > 0 ? 1 : 0) + (studyTimes.length > 0 ? 1 : 0)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button
                        variant="outline"
                        size="lg"
                        className="relative gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 hover:border-orange-400 hover:from-amber-100 hover:to-orange-100 transition-all shadow-md hover:shadow-lg"
                    >
                        <Sparkles className="h-5 w-5 text-amber-600" />
                        <span className="font-semibold text-amber-900">Smart Filter</span>
                        {hasActiveFilters && (
                            <Badge variant="default" className="ml-1 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-amber-600 hover:bg-amber-700">
                                {activeCount}
                            </Badge>
                        )}
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        🎯 Smart Matching Filters
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        {profileLoading ? "Loading..." : "Edit your profile and find matching partners!"}
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                    {/* === MAIN MATCHING FILTERS (Used by ML Server) === */}
                    <div className="space-y-6">
                        <h3 className="font-bold text-amber-800 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Main Matching Filters (used for finding partners)
                        </h3>

                        {/* Subject */}
                        <div className="space-y-3 mb-4">
                            <Label className="font-semibold">📚 Subject</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {SUBJECTS.map(subj => (
                                    <Badge
                                        key={subj}
                                        variant={subject === subj ? "default" : "outline"}
                                        className={`cursor-pointer px-3 py-2 text-sm justify-center ${subject === subj
                                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                                            : "hover:bg-amber-50 hover:border-amber-400"
                                            }`}
                                        onClick={() => setSubject(subject === subj ? undefined : subj)}
                                    >
                                        {subj}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Study Days */}
                        <div className="space-y-3 mb-4">
                            <Label className="font-semibold">📅 Study Days</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {STUDY_DAYS.map(day => (
                                    <div key={day} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`day-${day}`}
                                            checked={studyDays.includes(day)}
                                            onCheckedChange={() => toggleDay(day)}
                                            className="border-amber-600 data-[state=checked]:bg-amber-600"
                                        />
                                        <label htmlFor={`day-${day}`} className="text-sm cursor-pointer">
                                            {day.substring(0, 3)}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Study Times */}
                        <div className="space-y-3">
                            <Label className="font-semibold">⏰ Study Times</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {STUDY_TIMES.map(time => (
                                    <div key={time} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`time-${time}`}
                                            checked={studyTimes.includes(time)}
                                            onCheckedChange={() => toggleTime(time)}
                                            className="border-amber-600 data-[state=checked]:bg-amber-600"
                                        />
                                        <label htmlFor={`time-${time}`} className="text-sm cursor-pointer">
                                            {time}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* === OTHER PROFILE FIELDS (Saved but NOT used for matching) === */}
                    <div className="space-y-4 pt-4 border-t border-amber-200">
                        <h3 className="font-bold text-amber-800">
                            📝 Other Profile Info (saved to profile)
                        </h3>

                        {/* Grade Level */}
                        <div className="space-y-2 mb-4">
                            <Label className="font-semibold text-sm">🎓 Grade Level</Label>
                            <div className="flex gap-2">
                                {GRADE_LEVELS.map(grade => (
                                    <Badge
                                        key={grade}
                                        variant={gradeLevel === grade ? "default" : "outline"}
                                        className={`cursor-pointer px-3 py-2 text-sm justify-center ${gradeLevel === grade
                                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                                            : "hover:bg-amber-50 hover:border-amber-400"
                                            }`}
                                        onClick={() => setGradeLevel(gradeLevel === grade ? undefined : grade)}
                                    >
                                        {grade}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Study Style */}
                        <div className="space-y-2 mb-4">
                            <Label className="font-semibold text-sm">📖 Study Style</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {STUDY_STYLES.map(style => (
                                    <Badge
                                        key={style}
                                        variant={studyStyle === style ? "default" : "outline"}
                                        className={`cursor-pointer px-3 py-2 text-sm justify-center ${studyStyle === style
                                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                                            : "hover:bg-amber-50 hover:border-amber-400"
                                            }`}
                                        onClick={() => setStudyStyle(studyStyle === style ? undefined : style)}
                                    >
                                        {style}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Learning Goal */}
                        <div className="space-y-2">
                            <Label className="font-semibold text-sm">🎯 Learning Goal</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {LEARNING_GOALS.map(goal => (
                                    <Badge
                                        key={goal}
                                        variant={learningGoal === goal ? "default" : "outline"}
                                        className={`cursor-pointer px-3 py-2 text-sm justify-center ${learningGoal === goal
                                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                                            : "hover:bg-amber-50 hover:border-amber-400"
                                            }`}
                                        onClick={() => setLearningGoal(learningGoal === goal ? undefined : goal)}
                                    >
                                        {goal}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-6">
                    <Button
                        variant="outline"
                        onClick={handleClear}
                        disabled={loading || saving || profileLoading}
                        className="w-full sm:w-auto"
                    >
                        Clear All
                    </Button>
                    <Button
                        onClick={handleApply}
                        disabled={loading || saving || profileLoading}
                        className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg"
                    >
                        {loading || saving ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                {saving ? "Saving..." : "Finding..."}
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Save & Find Matches
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
