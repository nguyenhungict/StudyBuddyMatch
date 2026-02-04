"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Upload, FileText, X, AlertCircle, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CreateQuizPage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [file, setFile] = useState<File | null>(null)
    const [subject, setSubject] = useState("")
    const [count, setCount] = useState<"10" | "15" | "20">("10")
    const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dragActive, setDragActive] = useState(false)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0])
        }
    }

    const handleFileChange = (selectedFile: File) => {
        const ext = selectedFile.name.split(".").pop()?.toLowerCase()
        if (!ext || !["pdf", "docx"].includes(ext)) {
            setError("Only PDF and Word (.docx) files are supported")
            return
        }

        if (selectedFile.size > 50 * 1024 * 1024) {
            setError("File size must be less than 50MB")
            return
        }

        setFile(selectedFile)
        setError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !subject.trim()) {
            setError("Please upload a file and enter a subject")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("subject", subject)
            formData.append("count", count)
            formData.append("difficulty", difficulty)

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quizzes/generate`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || "Failed to generate quiz")
            }

            const quiz = await response.json()
            console.log("Quiz created:", quiz);

            if (!quiz.id) {
                throw new Error("Quiz created but ID is missing!");
            }

            router.push(`/quizzes/${quiz.id}/take`)
        } catch (err: any) {
            setError(err.message || "Failed to generate quiz. Please try again.")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-transparent">
            <div className="container max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 mt-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="mb-4 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>

                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                        Generate AI Quiz
                    </h1>
                    <p className="text-muted-foreground">
                        Upload your study material and let AI create a quiz for you
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {/* File Upload */}
                        <Card className="border-border bg-card/80 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <Label className="text-sm font-medium text-foreground mb-2 block">
                                    Upload Document
                                </Label>
                                <div
                                    className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${dragActive
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50 hover:bg-card/50"
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    {file ? (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                                    <FileText className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{file.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setFile(null)}
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                                <Upload className="h-8 w-8 text-primary" />
                                            </div>
                                            <p className="text-foreground font-medium mb-1">
                                                Drop your file here or{" "}
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="text-primary hover:underline"
                                                >
                                                    browse
                                                </button>
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                PDF or Word (.docx) files only, max 50MB
                                            </p>
                                        </div>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.docx"
                                        onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                                        className="hidden"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Subject */}
                        <Card className="border-border bg-card/80 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <Label htmlFor="subject" className="text-sm font-medium text-foreground mb-2 block">
                                    Subject
                                </Label>
                                <Input
                                    id="subject"
                                    placeholder="e.g., Mathematics, Biology, History..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="bg-background border-border"
                                    required
                                />
                            </CardContent>
                        </Card>

                        {/* Quiz Settings */}
                        <Card className="border-border bg-card/80 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <h3 className="font-bold text-foreground mb-4">Quiz Settings</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Question Count */}
                                    <div>
                                        <Label className="text-sm font-medium text-foreground mb-2 block">
                                            Number of Questions
                                        </Label>
                                        <Select value={count} onValueChange={(v: any) => setCount(v)}>
                                            <SelectTrigger className="bg-background border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10">10 Questions</SelectItem>
                                                <SelectItem value="15">15 Questions</SelectItem>
                                                <SelectItem value="20">20 Questions</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Difficulty */}
                                    <div>
                                        <Label className="text-sm font-medium text-foreground mb-2 block">
                                            Difficulty Level
                                        </Label>
                                        <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                                            <SelectTrigger className="bg-background border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="EASY">Easy</SelectItem>
                                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                                <SelectItem value="HARD">Hard</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm text-muted-foreground">
                                            <p className="font-medium text-foreground mb-1">AI-Powered Generation</p>
                                            <p>
                                                Our AI will analyze your document and create{" "}
                                                <span className="font-medium text-foreground">{count} questions</span> at{" "}
                                                <span className="font-medium text-foreground">{difficulty.toLowerCase()}</span>{" "}
                                                difficulty level. Each question includes explanations for better learning.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Error Alert */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                className="flex-1"
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/30"
                                disabled={loading || !file || !subject.trim()}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Generating Quiz...
                                    </>
                                ) : (
                                    "Generate Quiz"
                                )}
                            </Button>
                        </div>

                        {/* Loading State Message */}
                        {loading && (
                            <Card className="border-primary/50 bg-primary/5">
                                <CardContent className="p-6 text-center">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                    </div>
                                    <p className="text-foreground font-medium mb-2">
                                        AI is analyzing your document...
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        This may take 10-30 seconds depending on file size
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
