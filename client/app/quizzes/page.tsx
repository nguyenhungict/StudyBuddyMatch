"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, Plus, Clock, BookOpen, Trophy, ArrowRight, Search, Trash2, AlertCircle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Quiz {
    id: string
    subject: string
    fileName: string
    difficulty: string
    createdAt: string
    attemptCount: number
    bestScore: number | null
    avgScore: number | null
    questions: any[]
}

export default function QuizzesPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [quizToDelete, setQuizToDelete] = useState<string | null>(null)

    useEffect(() => {
        fetchQuizzes()
    }, [])

    const fetchQuizzes = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quizzes`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setQuizzes(data)
            }
        } catch (error) {
            console.error("Failed to fetch quizzes:", error)
        } finally {
            setLoading(false)
        }
    }

    const deleteQuiz = async (id: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quizzes/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            })

            if (response.ok) {
                toast.success("Quiz deleted successfully")
                setQuizzes(quizzes.filter((q) => q.id !== id))
            } else {
                toast.error("Failed to delete quiz")
            }
        } catch (error) {
            console.error("Error deleting quiz:", error)
            toast.error("An error occurred while deleting the quiz")
        } finally {
            setQuizToDelete(null)
        }
    }

    const filteredQuizzes = quizzes.filter(
        (quiz) =>
            quiz.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            quiz.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "EASY":
                return "text-green-500 bg-green-500/10 border-green-500/20"
            case "MEDIUM":
                return "text-amber-500 bg-amber-500/10 border-amber-500/20"
            case "HARD":
                return "text-red-500 bg-red-500/10 border-red-500/20"
            default:
                return "text-muted-foreground bg-muted/10"
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground">Loading quizzes...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent">
            <div className="container max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 mt-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <Brain className="h-6 w-6 text-primary" />
                                </div>
                                My Quizzes
                            </h1>
                            <p className="text-muted-foreground">
                                AI-generated quizzes from your study materials
                            </p>
                        </div>

                        <Button
                            onClick={() => router.push("/quizzes/create")}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/30 flex items-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            Create New Quiz
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by subject or filename..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-card/50 backdrop-blur-sm border-border"
                        />
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="border-border bg-card/80 backdrop-blur-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                    <BookOpen className="h-6 w-6 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{quizzes.length}</p>
                                    <p className="text-sm text-muted-foreground">Total Quizzes</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card/80 backdrop-blur-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <Clock className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">
                                        {quizzes.reduce((sum, q) => sum + q.attemptCount, 0)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Total Attempts</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card/80 backdrop-blur-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                    <Trophy className="h-6 w-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">
                                        {quizzes.filter((q) => q.bestScore && q.bestScore >= 80).length}
                                    </p>
                                    <p className="text-sm text-muted-foreground">High Scores (80%+)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quizzes Grid */}
                {filteredQuizzes.length === 0 ? (
                    <Card className="border-border bg-card/50 backdrop-blur-sm">
                        <CardContent className="py-16 text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Brain className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No quizzes yet</h3>
                            <p className="text-muted-foreground mb-6">
                                {searchQuery
                                    ? "No quizzes match your search"
                                    : "Upload a PDF or Word document to generate your first AI quiz"}
                            </p>
                            {!searchQuery && (
                                <Button
                                    onClick={() => router.push("/quizzes/create")}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create First Quiz
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredQuizzes.map((quiz) => (
                            <Card
                                key={quiz.id}
                                className="group border-border bg-card/80 backdrop-blur-sm hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <CardContent className="p-6">
                                    <div
                                        onClick={() => router.push(`/quizzes/${quiz.id}/take`)}
                                        className="absolute inset-0 z-0"
                                    />
                                    {/* Delete Button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setQuizToDelete(quiz.id)
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>

                                    {/* Subject Badge */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                                            <p className="text-xs font-bold text-primary">{quiz.subject}</p>
                                        </div>
                                        <div
                                            className={`px-3 py-1 rounded-full border text-xs font-bold ${getDifficultyColor(
                                                quiz.difficulty
                                            )}`}
                                        >
                                            {quiz.difficulty}
                                        </div>
                                    </div>

                                    {/* Filename */}
                                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                        {quiz.fileName}
                                    </h3>

                                    {/* Questions Count */}
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {quiz.questions.length} questions
                                    </p>

                                    {/* Stats */}
                                    <div className="space-y-2 mb-4">
                                        {quiz.bestScore !== null && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Best Score:</span>
                                                <span className="font-bold text-green-500">{quiz.bestScore}%</span>
                                            </div>
                                        )}
                                        {quiz.avgScore !== null && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Avg Score:</span>
                                                <span className="font-medium text-foreground">{quiz.avgScore}%</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Attempts:</span>
                                            <span className="font-medium text-foreground">{quiz.attemptCount}</span>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="flex items-center justify-between text-xs font-bold text-primary group-hover:underline">
                                        <span className="uppercase tracking-widest">
                                            {quiz.attemptCount > 0 ? "Retake Quiz" : "Take Quiz"}
                                        </span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </div>

                                    {/* Date */}
                                    <p className="text-xs text-muted-foreground mt-4">
                                        Created {new Date(quiz.createdAt).toLocaleDateString()}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <AlertDialog open={!!quizToDelete} onOpenChange={(open) => !open && setQuizToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this quiz and all associated attempts.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => quizToDelete && deleteQuiz(quizToDelete)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
