"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Heart, MessageSquare, Video, BookOpen, Trophy, Users, Check, Sparkles } from "lucide-react"

const ONBOARDING_STEPS = [
  {
    icon: Heart,
    title: "Find Your Match",
    description:
      "Swipe through profiles of students who share your subjects and schedule. Swipe right to like, left to pass.",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    icon: MessageSquare,
    title: "Start Chatting",
    description: "When you both like each other, it's a match! Start chatting instantly to plan your study sessions.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Video,
    title: "Video Study Sessions",
    description: "Join video calls with your study buddies. Share your screen, discuss problems, and learn together.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: BookOpen,
    title: "Share Resources",
    description: "Upload and access study materials, notes, and documents shared by your study group.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Trophy,
    title: "Take AI Quizzes",
    description: "Generate quizzes from your materials and compete with your study buddy to test your knowledge.",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Users,
    title: "Build Your Network",
    description: "Connect with multiple study buddies, create study groups, and expand your learning community.",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push("/matching")
    }
  }

  const handleSkip = () => {
    router.push("/matching")
  }

  const step = ONBOARDING_STEPS[currentStep]
  const Icon = step.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl border-border bg-card shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-card-foreground">Welcome to Study Buddy Match!</h1>
          </div>
          <p className="text-muted-foreground">Let's show you around</p>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep ? "w-8 bg-primary" : index < currentStep ? "w-2 bg-primary/50" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-8 animate-in fade-in duration-500">
          <div className={`inline-flex h-24 w-24 items-center justify-center rounded-full ${step.bgColor} mb-6`}>
            <Icon className={`h-12 w-12 ${step.color}`} />
          </div>
          <h2 className="text-2xl font-bold text-card-foreground mb-3">{step.title}</h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">{step.description}</p>
        </div>

        {/* Features Preview (for current step) */}
        {currentStep === 0 && (
          <div className="bg-gradient-to-br from-primary/5 to-orange-100/20 rounded-lg p-6 mb-8 border border-primary/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                92%
              </div>
              <div>
                <p className="font-semibold text-card-foreground">Smart Matching Algorithm</p>
                <p className="text-sm text-muted-foreground">Based on subjects, schedule & goals</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-100/20 rounded-lg p-6 mb-8 border border-green-500/10">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-card-foreground">HD video quality</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-card-foreground">Screen sharing</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-card-foreground">Whiteboard collaboration</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="bg-gradient-to-br from-yellow-50 to-amber-100/20 rounded-lg p-6 mb-8 border border-yellow-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-card-foreground mb-1">AI-Powered Learning</p>
                <p className="text-sm text-muted-foreground">Automatically generate quizzes from your notes</p>
              </div>
              <Trophy className="h-10 w-10 text-yellow-500" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground hover:text-foreground">
            Skip Tutorial
          </Button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="border-border">
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]"
            >
              {currentStep === ONBOARDING_STEPS.length - 1 ? "Get Started" : "Next"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
