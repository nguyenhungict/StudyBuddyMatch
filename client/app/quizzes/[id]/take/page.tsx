"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Clock,
    FileText,
    Send,
    AlertCircle,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Question {
    question: string
    options: string[]
    correct_answer: number
    explanation: string
}

interface Quiz {
    id: string
    subject: string
    fileName: string
    difficulty: string
    questions: Question[]
}

export default function TakeQuizPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const unwrappedParams = use(params) // Unwrap Promise
    const [quiz, setQuiz] = useState<Quiz | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState<number[]>([])
    const [showSubmitDialog, setShowSubmitDialog] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchQuiz()
    }, [])

    const fetchQuiz = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quizzes/${unwrappedParams.id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setQuiz(data)
                setAnswers(new Array(data.questions.length).fill(-1))
            } else {
                setError("Quiz not found")
            }
        } catch (error) {
            setError("Failed to load quiz")
        } finally {
            setLoading(false)
        }
    }

    const handleSelectOption = (optionIndex: number) => {
        const newAnswers = [...answers]
        newAnswers[currentIndex] = optionIndex
        setAnswers(newAnswers)
    }

    const handleNext = () => {
        if (currentIndex < (quiz?.questions.length || 0) - 1) {
            setCurrentIndex(currentIndex + 1)
        }
    }

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
        }
    }

    const handleSubmit = async () => {
        if (!quiz) return

        setSubmitting(true)
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/quizzes/${unwrappedParams.id}/submit`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                    body: JSON.stringify({ answers }),
                }
            )

            if (response.ok) {
                const attempt = await response.json()
                router.push(`/quizzes/${quiz.id}/results/${attempt.id}`)
            } else {
                throw new Error("Failed to submit quiz")
            }
        } catch (error) {
            alert("Failed to submit quiz. Please try again.")
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground">Loading quiz...</p>
                </div>
            </div>
        )
    }

    if (error || !quiz) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md border-destructive/50 bg-destructive/5">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-2">Error Loading Quiz</h3>
                        <p className="text-muted-foreground mb-6">{error || "Quiz not found"}</p>
                        <Button onClick={() => router.push("/quizzes")}>Back to Quizzes</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const currentQuestion = quiz.questions[currentIndex]
    const answeredCount = answers.filter((a) => a !== -1).length
    const progress = (answeredCount / quiz.questions.length) * 100
    const allAnswered = answeredCount === quiz.questions.length

    return (
        <div className="min-h-screen bg-transparent">
            <div className="container max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 mt-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/quizzes")}
                        className="mb-4 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Exit Quiz
                    </Button>

                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{quiz.subject}</h1>
                            <p className="text-muted-foreground text-sm">{quiz.fileName}</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="text-sm font-bold text-primary">
                                {answeredCount}/{quiz.questions.length}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">
                            {answeredCount} of {quiz.questions.length} answered
                        </p>
                    </div>
                </div>

                {/* Question Card */}
                <Card className="border-border bg-card/80 backdrop-blur-sm mb-6">
                    <CardContent className="p-8">
                        {/* Question Number */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                                <p className="text-sm font-bold text-primary">
                                    Question {currentIndex + 1} of {quiz.questions.length}
                                </p>
                            </div>
                            <div
                                className={`px-4 py-1.5 rounded-full border ${quiz.difficulty === "EASY"
                                    ? "bg-green-500/10 border-green-500/20 text-green-500"
                                    : quiz.difficulty === "MEDIUM"
                                        ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                        : "bg-red-500/10 border-red-500/20 text-red-500"
                                    }`}
                            >
                                <p className="text-sm font-bold">{quiz.difficulty}</p>
                            </div>
                        </div>

                        {/* Question Text */}
                        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-8 leading-relaxed">
                            {currentQuestion.question}
                        </h2>

                        {/* Options */}
                        <div className="space-y-3">
                            {currentQuestion.options.map((option, idx) => {
                                const isSelected = answers[currentIndex] === idx
                                const optionLetter = String.fromCharCode(65 + idx) // A, B, C, D

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectOption(idx)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected
                                            ? "border-primary bg-primary/10 shadow-md"
                                            : "border-border bg-card/50 hover:border-primary/50 hover:bg-card/80"
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                                    }`}
                                            >
                                                {optionLetter}
                                            </div>
                                            <span className="font-medium text-foreground">{option}</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-4">
                    <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="flex-1 md:flex-none"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>

                    {/* Question Navigator */}
                    <div className="hidden md:flex items-center gap-2 flex-1 justify-center flex-wrap">
                        {quiz.questions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${idx === currentIndex
                                    ? "bg-primary text-primary-foreground scale-110"
                                    : answers[idx] !== -1
                                        ? "bg-green-500/20 text-green-500 border-2 border-green-500/50"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                    }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    {currentIndex === quiz.questions.length - 1 ? (
                        <Button
                            onClick={() => setShowSubmitDialog(true)}
                            className="flex-1 md:flex-none bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/30"
                        >
                            Submit Quiz
                            <Send className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleNext} className="flex-1 md:flex-none">
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>

                {/* Submit Confirmation Dialog */}
                <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                    <DialogContent className="bg-card border-border">
                        <DialogHeader>
                            <DialogTitle>Submit Quiz?</DialogTitle>
                            <DialogDescription>
                                {allAnswered ? (
                                    <div className="flex items-center gap-2 text-foreground mt-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        All questions answered! Ready to submit.
                                    </div>
                                ) : (
                                    <div className="space-y-2 mt-2">
                                        <p className="text-amber-500 flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5" />
                                            You have {quiz.questions.length - answeredCount} unanswered questions
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            Unanswered questions will be marked as incorrect.
                                        </p>
                                    </div>
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowSubmitDialog(false)}
                                disabled={submitting}
                            >
                                Review
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {submitting ? "Submitting..." : "Confirm Submit"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
