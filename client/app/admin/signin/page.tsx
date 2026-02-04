"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Eye, EyeOff, Info, AlertCircle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function AdminSignInPage() {
    const { login } = useAuth()
    const router = useRouter()

    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    // Điền nhanh thông tin admin
    const fillAdminCredentials = () => {
        setFormData({
            email: "admin@studybuddy.com",
            password: "Admin@123",
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            await login({
                email: formData.email,
                password: formData.password,
            })

            // Sau khi đăng nhập thành công, kiểm tra role
            // Tạm thời kiểm tra email (sau này sẽ check role từ backend)
            if (formData.email === "admin@studybuddy.com") {
                router.push("/admin/dashboard")
            } else {
                // Không phải admin
                setError("Invalid account!")
                toast.error("Invalid account! Only admin can access this page.")
            }
        } catch (err: any) {
            console.log("Lỗi đăng nhập:", err.response)

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
                setError("Không thể kết nối đến server. Vui lòng thử lại.")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
            <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 shadow-2xl backdrop-blur">
                <CardHeader className="text-center space-y-2">
                    <div className="flex justify-center mb-2">
                        <div className="h-16 w-16 rounded-full bg-yellow-500/10 flex items-center justify-center border-2 border-yellow-500/20">
                            <Shield className="h-8 w-8 text-yellow-500" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-white">Admin Portal</CardTitle>
                    <CardDescription className="text-slate-400">Sign in to access admin dashboard</CardDescription>
                </CardHeader>
                <CardContent>

                    {/* --- KHU VỰC HIỂN THỊ LỖI (MÀU ĐỎ) --- */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-red-300">Đăng nhập thất bại</h4>
                                <p className="text-sm text-red-400 mt-1">{error}</p>
                            </div>
                        </div>
                    )}
                    {/* ------------------------------------- */}

                    <div className="mb-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 text-sm">
                                <p className="font-semibold text-white mb-1">Admin Test Account</p>
                                <div className="text-xs text-slate-400 space-y-0.5">
                                    <p><span className="font-medium">Email:</span> admin@studybuddy.com</p>
                                    <p><span className="font-medium">Password:</span> Admin@123</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    onClick={fillAdminCredentials}
                                    className="h-auto p-0 mt-1 text-yellow-500 font-medium hover:text-yellow-400"
                                >
                                    Click to auto-fill
                                </Button>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-white">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@studybuddy.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-yellow-500 text-slate-900 hover:bg-yellow-400 font-semibold"
                            disabled={loading}
                        >
                            {loading ? "Checking..." : "Sign In as Admin"}
                        </Button>
                    </form>

                    {/* Warning message */}
                    <div className="mt-6 p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                        <p className="text-xs text-slate-400 text-center">
                            <Shield className="h-3 w-3 inline mr-1" />
                            This portal is restricted to authorized administrators only
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
