"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import api from "@/lib/api" // Import axios instance

// Component chính xử lý logic
function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const router = useRouter()
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Verifying your email...")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("No verification token found.")
      return
    }

    const verify = async () => {
      try {
        // Gọi API Backend: http://localhost:3000/auth/verify?token=...
        await api.get(`/auth/verify?token=${token}`)
        
        setStatus("success")
        setMessage("Email verified successfully! You can now log in.")
      } catch (error: any) {
        setStatus("error")
        setMessage(error.response?.data?.message || "Verification failed or token expired.")
      }
    }

    verify()
  }, [token])

  return (
    <Card className="w-full max-w-md border-border bg-card shadow-xl animate-in fade-in zoom-in duration-300">
      <CardHeader className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          {status === "loading" && (
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          )}
          {status === "success" && (
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          )}
          {status === "error" && (
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          )}
        </div>
        
        <CardTitle className="text-2xl font-bold">
          {status === "loading" ? "Verifying..." : status === "success" ? "Success!" : "Verification Failed"}
        </CardTitle>
        <CardDescription>
          {message}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex justify-center pb-6">
        {status === "loading" ? (
           <p className="text-sm text-muted-foreground">Please wait a moment...</p>
        ) : (
          <Button 
            onClick={() => router.push(status === "success" ? "/login" : "/signup")}
            className="w-full"
          >
            {status === "success" ? "Go to Login" : "Back to Signup"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Wrap bằng Suspense để tránh lỗi useSearchParams trong Next.js App Router
export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}