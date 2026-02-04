"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { GraduationCap, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export default function LoginPage() {
  const { login } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login({
        email: formData.email,
        password: formData.password,
      })
      // Success -> AuthContext redirects automatically
    } catch (err: any) {
      console.log("Login Error:", err.response)

      const serverMsg = err.response?.data?.message
      const serverError = err.response?.data?.error

      if (serverMsg) {
        if (Array.isArray(serverMsg)) {
          setError(serverMsg[0])
        } else {
          setError(serverMsg)
        }
      } else if (serverError) {
        setError(serverError)
      } else {
        setError("Cannot connect to server. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 relative overflow-hidden px-4 py-8">
      {/* Background Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-amber-600/10 dark:bg-amber-600/10 rounded-full blur-[100px]" />
      </div>

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
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600 dark:text-zinc-400">Sign in to continue your learning journey</CardDescription>
          </CardHeader>
          <CardContent>

            {/* ERROR AREA */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-red-800 dark:text-red-400">Login Failed</h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            )}
            {/* ------------ */}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-zinc-300 font-medium">Email</Label>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700 dark:text-zinc-300 font-medium">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>
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
              </div>

              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  id="remember"
                  className="rounded border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-500 focus:ring-amber-500/50"
                />
                <label htmlFor="remember" className="text-gray-600 dark:text-zinc-400 cursor-pointer select-none">
                  Remember me
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-amber-500 text-black font-bold hover:bg-amber-400 transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/20 text-md"
                disabled={loading}
              >
                {loading ? "Checking..." : "Sign In"}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center text-sm border-t border-gray-200 dark:border-white/10 pt-6">
              <span className="text-gray-600 dark:text-zinc-500">Don't have an account? </span>
              <Link href="/signup" className="text-amber-600 dark:text-amber-500 font-bold hover:text-amber-700 dark:hover:text-amber-400 hover:underline transition-colors">Sign up</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}