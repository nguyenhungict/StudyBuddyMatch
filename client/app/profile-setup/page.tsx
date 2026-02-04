"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Calendar,
  Target,
  Sparkles,
  Zap,
  Upload,
  User,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Plus,
} from "lucide-react"
import { userService } from "@/lib/user"
import { useAuth } from "@/context/AuthContext"

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science"]
const GRADES = ["Grade 10", "Grade 11", "Grade 12"]
const STUDY_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const STUDY_BLOCKS = ["Morning (6am-12pm)", "Afternoon (12pm-6pm)", "Evening (6pm-9pm)", "Night (9pm-6am)"]
const STUDY_STYLES = ["Visual", "Auditory", "Kinesthetic", "Reading", "Group", "Individual"]
const LEARNING_GOALS = ["Exam Preparation", "Improve Grades", "Deep Understanding", "Practice", "Review", "Homework"]

export default function ProfileSetupPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [step, setStep] = useState(1)
  const totalSteps = 7
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    school: "",
    grade: "",
    birthday: "",
    gender: "",
    subjects: [] as string[],
    studyDays: [] as string[],
    studyBlocks: [] as string[],
    studyStyle: [] as string[],
    learningGoal: [] as string[],
    achievement: "",
    bio: "",
    avatar: "",
    profilePhotos: [] as string[],
  })

  // --- LOAD DỮ LIỆU CŨ ---
  useEffect(() => {
    const fetchCurrentProfile = async () => {
      try {
        const data = await userService.getProfile()
        const userProfile = data.profile || {}

        if (userProfile) {
          // ✅ FIX 1: Map Gender từ Enum Backend (MALE) sang Value Frontend (Male)
          let mappedGender = "";
          if (userProfile.gender === "MALE") mappedGender = "Male";
          else if (userProfile.gender === "FEMALE") mappedGender = "Female";
          else if (userProfile.gender === "OTHER" || userProfile.gender === "PREFER_NOT_TO_SAY") mappedGender = "Non-binary";
          else mappedGender = userProfile.gender || "";

          // ✅ FIX 2: Subjects luôn là mảng
          const loadedSubjects = Array.isArray(userProfile.subjects) ? userProfile.subjects : [];

          // ✅ FIX 4: Fetch existing profile photos
          let existingPhotos: string[] = [];
          try {
            const photosResponse = await fetch('/api/profile-photos');
            if (photosResponse.ok) {
              const photosData = await photosResponse.json();
              existingPhotos = photosData.map((photo: any) => photo.photoUrl);
            }
          } catch (photoError) {
            console.error('Error loading existing photos:', photoError);
          }

          setFormData({
            name: data.fullName || "",
            school: userProfile.school || "",
            grade: userProfile.gradeLevel || "",
            birthday: userProfile.birthday || "",
            gender: mappedGender,
            subjects: loadedSubjects,
            studyDays: userProfile.studySchedule?.days || [],
            studyBlocks: userProfile.studySchedule?.time ? userProfile.studySchedule.time.split(", ") : [],
            studyStyle: userProfile.studyStyles || [],
            learningGoal: userProfile.learningGoals || [],
            achievement: userProfile.achievement || "",
            bio: userProfile.bio || "",
            avatar: userProfile.avatarUrl || "",
            profilePhotos: existingPhotos,
          })
        }
      } catch (error) {
        console.error("Lỗi tải profile cũ:", error)
      } finally {
        setIsLoadingData(false)
      }
    }
    fetchCurrentProfile()
  }, [])

  // --- XỬ LÝ ẢNH ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const fillDemoData = () => {
    setFormData({
      name: "Nguyễn Minh Anh",
      school: "THPT Lê Hồng Phong",
      grade: "Grade 11",
      birthday: "2007-01-01",
      gender: "Female",
      subjects: ["Mathematics", "IT"],
      studyDays: ["Monday", "Wednesday"],
      studyBlocks: ["Evening (6PM-9PM)"],
      studyStyle: ["Pomodoro"],
      learningGoal: ["Project"],
      achievement: "Top student 2024",
      bio: "Passionate about AI and data science.",
      avatar: "https://github.com/shadcn.png",
      profilePhotos: [],
    })
  }

  // Helper để chọn duy nhất 1 item (cho subjects)
  const selectSingleItem = (item: string) => {
    return [item]
  }

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item)
    } else {
      return [...array, item]
    }
  }

  // VALIDATION LOGIC
  const validateStep = (currentStep: number) => {
    if (currentStep === 2) {
      if (formData.subjects.length === 0) {
        alert("Please select exactly 1 subject.")
        return false
      }
    }
    if (currentStep === 3) {
      if (formData.studyDays.length < 2) {
        alert("Please select at least 2 study days.")
        return false
      }
      if (formData.studyBlocks.length < 2) {
        alert("Please select at least 2 time blocks.")
        return false
      }
    }
    if (currentStep === 7) {
      if (formData.profilePhotos.length < 3) {
        alert("Please upload at least 3 profile photos.")
        return false
      }
    }
    return true
  }

  const handleNext = async () => {
    if (!validateStep(step)) return

    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      setIsSaving(true)
      try {
        // Step 1-6: Update profile
        const payload = {
          fullName: formData.name,
          school: formData.school,
          birthday: formData.birthday,
          gender: formData.gender, // Gửi "Male" đi, Backend sẽ lo map sang Enum
          gradeLevel: formData.grade,
          bio: formData.bio,
          subjects: formData.subjects,
          studySchedule: {
            days: formData.studyDays,
            time: formData.studyBlocks.join(", ")
          },
          studyStyle: formData.studyStyle,
          learningGoals: formData.learningGoal,
          achievement: formData.achievement,
          avatar: formData.avatar
        }

        // @ts-ignore
        await userService.updateProfile(payload)

        // Step 7: Upload profile photos
        if (formData.profilePhotos.length > 0) {
          try {
            const response = await fetch('/api/profile-photos', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ photos: formData.profilePhotos }),
            });

            if (!response.ok) {
              console.error('Failed to upload profile photos');
            }
          } catch (photoError) {
            console.error('Error uploading photos:', photoError);
          }
        }

        await refreshUser()

        // SOCKET EMIT
        try {
          const { getSocket } = require("@/utils/socketSingleton");
          const socket = getSocket();
          socket.emit("userUpdated", {
            userId: (await userService.getProfile()).id,
            ...payload,
          });
        } catch (err) {
          console.error("Socket emit failed", err);
        }

        router.push("/home")

      } catch (error) {
        console.error("Lỗi lưu profile:", error)
        alert("Lỗi khi lưu hồ sơ. Vui lòng thử lại.")
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const progress = (step / totalSteps) * 100

  if (isLoadingData) {
    return <div className="flex h-screen items-center justify-center text-foreground">Loading...</div>
  }

  // --- UI REDESIGN ---
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4 py-8 relative">
      <Card className="w-full max-w-2xl border-border bg-card/90 backdrop-blur-sm shadow-2xl relative z-10">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-2xl text-foreground font-bold">
                  {formData.name ? "Edit Your Profile" : "Complete Your Profile"}
                </CardTitle>
                <CardDescription className="text-muted-foreground">Step {step} of {totalSteps}</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fillDemoData} className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10 bg-transparent">
              <Zap className="h-4 w-4 mr-1" /> Demo Data
            </Button>
          </div>
          <Progress value={progress} className="h-2 bg-muted fill-amber-500 [&>div]:bg-amber-500" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="text-center mb-6">
                <BookOpen className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-foreground">Basic Information</h3>
                <p className="text-sm text-muted-foreground">Tell us about your academic background</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Full Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-background border-input text-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school" className="text-foreground">School/University</Label>
                <Input id="school" value={formData.school} onChange={(e) => setFormData({ ...formData, school: e.target.value })} className="bg-background border-input text-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthday" className="text-foreground">Date of Birth</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="bg-background border-input text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Gender</Label>
                  <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Grade Level</Label>
                <div className="flex flex-wrap gap-2">
                  {GRADES.map((grade) => (
                    <Badge key={grade} variant={formData.grade === grade ? "default" : "outline"} onClick={() => setFormData({ ...formData, grade })} className={`cursor-pointer px-4 py-2 text-sm flex-1 justify-center transition-colors ${formData.grade === grade ? "bg-amber-500 text-black hover:bg-amber-600" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                      {grade}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-foreground">Bio (Optional)</Label>
                <textarea id="bio" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-amber-500" />
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="text-center mb-6">
                <BookOpen className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-foreground">Your Subjects</h3>
                <p className="text-sm text-muted-foreground">Select subjects you want to study</p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {SUBJECTS.map((subject) => (
                  <Badge key={subject} variant={formData.subjects.includes(subject) ? "default" : "outline"} onClick={() => setFormData({ ...formData, subjects: selectSingleItem(subject) })} className={`cursor-pointer px-6 py-3 text-base transition-colors ${formData.subjects.includes(subject) ? "bg-amber-500 text-black hover:bg-amber-600" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center mb-6">
                <Calendar className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-foreground">Study Schedule</h3>
                <p className="text-sm text-muted-foreground">When are you available?</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="mb-3 block text-foreground">Study Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {STUDY_DAYS.map((day) => (
                      <Badge
                        key={day}
                        variant={formData.studyDays.includes(day) ? "default" : "outline"}
                        className={`cursor-pointer px-4 py-2 text-sm transition-colors ${formData.studyDays.includes(day)
                          ? "bg-amber-500 text-black hover:bg-amber-600"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        onClick={() =>
                          setFormData({ ...formData, studyDays: toggleArrayItem(formData.studyDays, day) })
                        }
                      >
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-3 block text-foreground">Time Blocks</Label>
                  <div className="flex flex-wrap gap-2">
                    {STUDY_BLOCKS.map((block) => (
                      <Badge
                        key={block}
                        variant={formData.studyBlocks.includes(block) ? "default" : "outline"}
                        className={`cursor-pointer px-4 py-2 text-sm transition-colors ${formData.studyBlocks.includes(block)
                          ? "bg-amber-500 text-black hover:bg-amber-600"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        onClick={() =>
                          setFormData({ ...formData, studyBlocks: toggleArrayItem(formData.studyBlocks, block) })
                        }
                      >
                        {block}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="text-center mb-6">
                <Sparkles className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-foreground">Study Style</h3>
                <p className="text-sm text-muted-foreground">How do you prefer to learn?</p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {STUDY_STYLES.map((style) => (
                  <Badge
                    key={style}
                    variant={formData.studyStyle.includes(style) ? "default" : "outline"}
                    className={`cursor-pointer px-6 py-3 text-base transition-colors ${formData.studyStyle.includes(style)
                      ? "bg-amber-500 text-black hover:bg-amber-600"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    onClick={() =>
                      setFormData({ ...formData, studyStyle: toggleArrayItem(formData.studyStyle, style) })
                    }
                  >
                    {style}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="text-center mb-6">
                <Target className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-foreground">Learning Goals</h3>
                <p className="text-sm text-muted-foreground">What are you studying for?</p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {LEARNING_GOALS.map((goal) => (
                  <Badge
                    key={goal}
                    variant={formData.learningGoal.includes(goal) ? "default" : "outline"}
                    className={`cursor-pointer px-6 py-3 text-base transition-colors ${formData.learningGoal.includes(goal)
                      ? "bg-amber-500 text-black hover:bg-amber-600"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    onClick={() =>
                      setFormData({ ...formData, learningGoal: toggleArrayItem(formData.learningGoal, goal) })
                    }
                  >
                    {goal}
                  </Badge>
                ))}
              </div>
              <div className="space-y-2 mt-6">
                <Label htmlFor="achievement" className="text-foreground">Recent Achievement (Optional)</Label>
                <Input
                  id="achievement"
                  placeholder="e.g., Dean's List 2024"
                  value={formData.achievement}
                  onChange={(e) => setFormData({ ...formData, achievement: e.target.value })}
                  className="bg-background border-input text-foreground"
                />
              </div>
            </div>
          )}

          {/* STEP 6 */}
          {step === 6 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="text-center mb-6">
                <User className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-foreground">Profile Picture</h3>
                <p className="text-sm text-muted-foreground">Upload a photo or skip for now</p>
              </div>
              <div className="flex flex-col items-center gap-6">
                <div className="h-32 w-32 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-4 border-card shadow-lg">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>

                <div className="w-full max-w-sm space-y-3">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                  <Button type="button" variant="outline" className="w-full border-input text-foreground hover:bg-secondary bg-transparent" onClick={triggerFileInput}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Photo from Computer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7 - Profile Photos */}
          {step === 7 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="text-center mb-6">
                <ImageIcon className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-foreground">Profile Photos</h3>
                <p className="text-sm text-muted-foreground">Add at least 3 photos to showcase yourself</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ({formData.profilePhotos.length}/3 minimum)
                </p>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-3 gap-4">
                {formData.profilePhotos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-amber-500 transition-colors group bg-secondary">
                    <img
                      src={photo}
                      alt={`Profile ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            profilePhotos: formData.profilePhotos.filter((_, i) => i !== index)
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                      #{index + 1}
                    </div>
                  </div>
                ))}

                {/* Add Photo Button */}
                {formData.profilePhotos.length < 6 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-amber-500 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-secondary/30 hover:bg-secondary/50">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert("Photo too large! Maximum 5MB.")
                            return
                          }
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setFormData({
                              ...formData,
                              profilePhotos: [...formData.profilePhotos, reader.result as string]
                            })
                          }
                          reader.readAsDataURL(file)
                        }
                        e.target.value = ""
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground">
                  <ImageIcon className="h-4 w-4 text-amber-500" />
                  Photo Tips
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Add at least 3 clear photos of yourself</li>
                  <li>First photo will be your main profile image</li>
                  <li>Use recent photos that show your face clearly</li>
                  <li>Maximum 6 photos, each under 5MB</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-border">
            <Button variant="outline" onClick={handleBack} disabled={step === 1 || isSaving} className="border-border bg-transparent text-foreground hover:bg-secondary">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleNext} className="bg-amber-500 text-black hover:bg-amber-600 font-bold shadow-lg shadow-amber-500/20" disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : step === totalSteps ? "Complete" : <>{`Next `}<ChevronRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* BACKGROUND ACCENTS (Optional) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>
    </div>
  )
}