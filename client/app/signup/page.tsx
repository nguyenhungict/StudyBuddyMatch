"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GraduationCap, Eye, EyeOff, CheckCircle2, Mail, AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import { authService } from "@/lib/auth"

export default function SignupPage() {
  const router = useRouter()

  // State management
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showVerification, setShowVerification] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setErrors(["Passwords do not match!"])
      setLoading(false)
      return
    }

    try {
      await authService.register({
        email: formData.email,
        password: formData.password,
        fullName: formData.name
      })

      setShowVerification(true)

    } catch (err: any) {
      const message = err.response?.data?.message || "Registration failed."

      if (Array.isArray(message)) {
        setErrors(message)
      } else {
        setErrors([message])
      }
    } finally {
      setLoading(false)
    }
  }

  // --- BACKGROUND COMPONENT (Reusable) ---
  const Background = () => (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-[100px]" />
    </div>
  )

  // --- SCREEN 2: VERIFICATION (Success) ---
  if (showVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4 py-8 relative overflow-hidden">
        <Background />

        <Card className="relative z-10 w-full max-w-md border-gray-200 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in duration-300">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center border border-blue-200 dark:border-blue-500/30">
                <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Verify Your Email</CardTitle>
            <CardDescription className="text-gray-600 dark:text-zinc-400">
              We've sent a verification link to your email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
              <p className="text-sm text-center text-blue-700 dark:text-blue-300 font-bold mb-2">{formData.email}</p>
              <p className="text-xs text-center text-blue-600 dark:text-blue-400/80">
                Please check your inbox and click the verification link to activate your account.
              </p>
            </div>

            <div className="space-y-3 text-sm text-gray-600 dark:text-zinc-400">
              <p className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <span>Check your inbox (and spam folder)</span>
              </p>
              <p className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <span>Click the verification link in the email</span>
              </p>
              <p className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <span>Come back here and Log In</span>
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-white/10">
              <Button
                onClick={() => router.push("/login")}
                className="w-full h-12 bg-amber-500 text-black font-bold hover:bg-amber-400 shadow-lg shadow-amber-500/20"
              >
                Go to Login Page
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-zinc-500 mb-2">Didn't receive the email?</p>
              <Button variant="link" size="sm" className="text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 h-auto p-0" onClick={() => alert("Please check Spam folder or wait a few minutes.")}>
                Resend verification email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- SCREEN 1: REGISTRATION FORM ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 relative overflow-hidden px-4 py-8">
      <Background />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <Card className="border-gray-200 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Create Account</CardTitle>
            <CardDescription className="text-gray-600 dark:text-zinc-400">
              Join Study Buddy Match and find your perfect study partner
            </CardDescription>
          </CardHeader>
          <CardContent>

            {/* ERROR AREA */}
            {errors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-red-800 dark:text-red-400 mb-1">Registration Failed</h4>
                    <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                      {errors.map((err, index) => (
                        <li key={index}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            {/* ------------ */}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 dark:text-zinc-300 font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-50 dark:bg-zinc-950/50 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-amber-500/20 h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-zinc-300 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-gray-50 dark:bg-zinc-950/50 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-amber-500/20 h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-zinc-300 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-gray-50 dark:bg-zinc-950/50 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-amber-500/20 pr-10 h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-zinc-500">
                  Must be at least 8 characters, include uppercase, number, and special character.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-zinc-300 font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="bg-gray-50 dark:bg-zinc-950/50 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-amber-500/20 pr-10 h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-amber-500 text-black font-bold hover:bg-amber-400 shadow-lg shadow-amber-500/20 text-md transition-all hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm border-t border-gray-200 dark:border-white/10 pt-6">
              <span className="text-gray-600 dark:text-zinc-500">Already have an account? </span>
              <Link href="/login" className="text-amber-600 dark:text-amber-500 font-bold hover:text-amber-700 dark:hover:text-amber-400 hover:underline transition-colors">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}