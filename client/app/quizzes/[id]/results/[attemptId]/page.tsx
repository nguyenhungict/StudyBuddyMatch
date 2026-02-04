"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, RotateCw, Home, CheckCircle2, XCircle, Lightbulb, ArrowLeft } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface QuizAttempt {
    id: string
    score: number
    correctCount: number
    totalCount: number
    answers: number[]
    completedAt: string
    quiz: {
        id: string
        subject: string
        fileName: string
        difficulty: string
        questions: Array<{
            question: string
            options: string[]
            correct_answer: number
            explanation: string
        }>
    }
}

export default function QuizResultsPage({ params }: { params: Promise<{ id: string; attemptId: string }> }) {
    const router = useRouter()
    const unwrappedParams = use(params)
    const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAttempt()
    }, [])

    const fetchAttempt = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/quizzes/attempts/${unwrappedParams.attemptId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            )
            if (response.ok) {
                const data = await response.json()
                setAttempt(data)
            }
        } catch (error) {
            console.error("Failed to fetch attempt:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground">Loading results...</p>
                </div>
            </div>
        )
    }

    if (!attempt) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-foreground">Results not found</p>
                        <Button onClick={() => router.push("/quizzes")} className="mt-4">
                            Back to Quizzes
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500"
        if (score >= 60) return "text-amber-500"
        return "text-red-500"
    }

    const getScoreMessage = (score: number) => {
        if (score >= 90) return "Outstanding! You've mastered this topic! 🎉"
        if (score >= 80) return "Great job! You have a strong understanding! 👏"
        if (score >= 70) return "Good work! Keep it up! 💪"
        if (score >= 60) return "Not bad! A bit more practice will help. 📚"
        return "Don't worry, practice makes perfect! 🌱"
    }

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
                        Back to Quizzes
                    </Button>
                </div>

                {/* Score Card */}
                <Card className="border-border bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm mb-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                    <CardContent className="p-8 md:p-12 relative z-10">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 border-4 border-primary/20">
                                <Trophy className="h-10 w-10 text-primary" />
                            </div>

                            <h1 className="text-4xl md:text-6xl font-bold mb-4">
                                <span className={getScoreColor(attempt.score)}>{attempt.score}%</span>
                            </h1>

                            <p className="text-xl font-medium text-foreground mb-2">
                                {attempt.correctCount} out of {attempt.totalCount} correct
                            </p>

                            <p className="text-muted-foreground mb-6">{getScoreMessage(attempt.score)}</p>

                            <Progress value={attempt.score} className="h-3 mb-6" />

                            <div className="flex items-center justify-center gap-4">
                                <Button
                                    onClick={() => router.push(`/quizzes/${attempt.quiz.id}/take`)}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                                >
                                    <RotateCw className="h-4 w-4 mr-2" />
                                    Retake Quiz
                                </Button>
                                <Button variant="outline" onClick={() => router.push("/quizzes")}>
                                    <Home className="h-4 w-4 mr-2" />
                                    All Quizzes
                                </Button>
                            </div>
                        </div>

                        {/* Quiz Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Subject</p>
                                <p className="font-bold text-foreground">{attempt.quiz.subject}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Difficulty</p>
                                <p className="font-bold text-foreground">{attempt.quiz.difficulty}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                                <p className="font-bold text-foreground">
                                    {new Date(attempt.completedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Answer Review */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">Answer Review</h2>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-muted-foreground">Correct</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-muted-foreground">Incorrect</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {attempt.quiz.questions.map((question, idx) => {
                        const userAnswer = attempt.answers[idx]
                        const isCorrect = userAnswer === question.correct_answer
                        const optionLetters = ["A", "B", "C", "D"]

                        return (
                            <Card
                                key={idx}
                                className={`border-2 ${isCorrect
                                    ? "border-green-500/30 bg-green-500/5"
                                    : "border-red-500/30 bg-red-500/5"
                                    } backdrop-blur-sm`}
                            >
                                <CardContent className="p-6">
                                    {/* Question Header */}
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isCorrect
                                                    ? "bg-green-500 text-white"
                                                    : "bg-red-500 text-white"
                                                    }`}
                                            >
                                                {idx + 1}
                                            </div>
                                            <h3 className="text-lg font-medium text-foreground leading-relaxed">
                                                {question.question}
                                            </h3>
                                        </div>
                                        {isCorrect ? (
                                            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                                        )}
                                    </div>

                                    {/* Options */}
                                    <div className="space-y-2 mb-4 ml-11">
                                        {question.options.map((option, optionIdx) => {
                                            const isUserAnswer = userAnswer === optionIdx
                                            const isCorrectAnswer = question.correct_answer === optionIdx

                                            return (
                                                <div
                                                    key={optionIdx}
                                                    className={`p-3 rounded-lg border-2 ${isCorrectAnswer
                                                        ? "border-green-500 bg-green-500/10"
                                                        : isUserAnswer
                                                            ? "border-red-500 bg-red-500/10"
                                                            : "border-border bg-muted/30"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-sm text-muted-foreground">
                                                            {optionLetters[optionIdx]}.
                                                        </span>
                                                        <span
                                                            className={`${isCorrectAnswer || isUserAnswer
                                                                ? "font-medium text-foreground"
                                                                : "text-muted-foreground"
                                                                }`}
                                                        >
                                                            {option}
                                                        </span>
                                                        {isCorrectAnswer && (
                                                            <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                                                        )}
                                                        {isUserAnswer && !isCorrectAnswer && (
                                                            <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Explanation */}
                                    <div className="ml-11 p-4 rounded-lg bg-primary/5 border border-primary/20">
                                        <div className="flex items-start gap-3">
                                            <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-foreground mb-1">Explanation</p>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {question.explanation}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* Bottom Actions */}
                <div className="mt-8 flex items-center justify-center gap-4">
                    <Button
                        onClick={() => router.push(`/quizzes/${attempt.quiz.id}/take`)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/30"
                    >
                        <RotateCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/quizzes")}>
                        Back to Quizzes
                    </Button>
                </div>
            </div>
        </div>
    )
}
