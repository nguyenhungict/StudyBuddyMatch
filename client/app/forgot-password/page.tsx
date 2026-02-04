"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { KeyRound, Mail, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react"
import { authService } from "@/lib/auth"

export default function ForgotPasswordPage() {
  const router = useRouter()
  
  // step 1: Nhập email, step 2: Nhập OTP, step 3: Thành công
  const [step, setStep] = useState<1 | 2 | 3>(1) // <--- Thêm Step 3
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Form Data
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // --- BƯỚC 1: GỬI YÊU CẦU ---
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMsg("")
    setLoading(true)

    try {
      await authService.forgotPassword(email)
      setSuccessMsg("Mã xác thực 4 số đã được gửi vào email của bạn.")
      setStep(2) // Sang bước nhập OTP
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể gửi yêu cầu. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  // --- BƯỚC 2: RESET PASSWORD ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await authService.resetPassword(otp, newPassword)
      // Thành công -> Sang bước 3 
      setStep(3) 
    } catch (err: any) {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : msg || "Đổi mật khẩu thất bại.")
    } finally {
      setLoading(false)
    }
  }

  // --- GIAO DIỆN BƯỚC 3: THÀNH CÔNG ---
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <Card className="w-full max-w-md border-border bg-card shadow-xl animate-in fade-in zoom-in duration-300">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">Password Reset!</CardTitle>
            <CardDescription className="text-base">
              Your password has been successfully updated. You can now use your new password to log in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push("/login")} 
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Go to Login Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- GIAO DIỆN NHẬP LIỆU (BƯỚC 1 & 2) ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md border-border bg-card shadow-xl animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
              <KeyRound className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === 1 ? "Forgot Password?" : "Reset Password"}
          </CardTitle>
          <CardDescription>
            {step === 1 
              ? "Enter your email to receive a 4-digit verification code." 
              : `Enter the code sent to ${email} and your new password.`}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* HIỂN THỊ LỖI */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-red-600 text-sm animate-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* HIỂN THỊ THÔNG BÁO ĐÃ GỬI MAIL (Ở Bước 2) */}
          {step === 2 && successMsg && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2 text-blue-700 text-sm">
              <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORM BƯỚC 1 */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Code"}
              </Button>
            </form>
          )}

          {/* FORM BƯỚC 2 */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code (4 digits)</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="XXXX"
                  className="text-center text-xl tracking-widest font-mono font-bold"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 chars, 1 uppercase..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset Password"}
              </Button>
              
              <div className="text-center mt-2">
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="text-xs text-muted-foreground hover:text-primary underline"
                >
                  Change email or resend code
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}