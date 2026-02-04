"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, User, FileText, AlertTriangle, ChevronRight } from "lucide-react"
import { authService } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { AccountStatusCard } from "@/components/account-status-card"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const router = useRouter()

  const [currentPass, setCurrentPass] = useState("")
  const [newPass, setNewPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<"security" | "account-status">("security")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    if (newPass !== confirmPass) {
      setError("Mật khẩu xác nhận không khớp.")
      setLoading(false)
      return
    }

    try {
      await authService.changePassword(currentPass, newPass)
      setSuccess("Đổi mật khẩu thành công!")
      setCurrentPass("")
      setNewPass("")
      setConfirmPass("")
    } catch (err: any) {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : msg || "Đổi mật khẩu thất bại.")
    } finally {
      setLoading(false)
    }
  }

  const SidebarItem = ({
    icon: Icon,
    label,
    isActive,
    onClick,
    isExternal = false
  }: {
    icon: any,
    label: string,
    isActive?: boolean,
    onClick: () => void,
    isExternal?: boolean
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all",
        isActive
          ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
        {label}
      </div>
      {isExternal && <ChevronRight className="h-4 w-4 opacity-50" />}
    </button>
  )

  return (
    <div className="min-h-screen bg-transparent py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and security preferences.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* SIDEBAR NAVIGATION */}
          <nav className="flex flex-col space-y-2 lg:sticky lg:top-24 h-fit">
            <div className="rounded-xl border border-border bg-card p-2 shadow-sm">
              <div className="px-4 py-2 mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</h3>
              </div>
              <SidebarItem
                icon={User}
                label="Edit Profile"
                onClick={() => router.push('/profile-setup')}
                isExternal
              />
              <SidebarItem
                icon={FileText}
                label="My Reports"
                onClick={() => router.push('/my-reports')}
                isExternal
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-2 shadow-sm mt-4">
              <div className="px-4 py-2 mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Security</h3>
              </div>
              <SidebarItem
                icon={LockKeyhole}
                label="Password & Security"
                isActive={activeTab === "security"}
                onClick={() => setActiveTab("security")}
              />
              <SidebarItem
                icon={AlertTriangle}
                label="Account Status"
                isActive={activeTab === "account-status"}
                onClick={() => setActiveTab("account-status")}
              />
            </div>
          </nav>

          {/* MAIN CONTENT AREA */}
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === "security" && (
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="border-b border-border pb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Change Password</CardTitle>
                      <CardDescription className="mt-1">
                        Ensure your account is secure by using a strong password.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  {error && (
                    <div className="mb-6 p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 flex items-center gap-3 animate-in fade-in zoom-in-95">
                      <AlertTriangle className="h-5 w-5" />
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mb-6 p-4 bg-green-500/10 text-green-600 text-sm rounded-lg border border-green-500/20 flex items-center gap-3 animate-in fade-in zoom-in-95">
                      <ShieldCheck className="h-5 w-5" />
                      {success}
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label className="text-foreground">Current Password</Label>
                      <div className="relative group">
                        <Input
                          type={showCurrent ? "text" : "password"}
                          value={currentPass}
                          onChange={(e) => setCurrentPass(e.target.value)}
                          required
                          className="bg-background border-input pr-10 transition-all focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent(!showCurrent)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      {/* New Password */}
                      <div className="space-y-2">
                        <Label className="text-foreground">New Password</Label>
                        <div className="relative group">
                          <Input
                            type={showNew ? "text" : "password"}
                            value={newPass}
                            onChange={(e) => setNewPass(e.target.value)}
                            placeholder="Min 8 chars"
                            required
                            className="bg-background border-input pr-10 transition-all focus:ring-2 focus:ring-primary/20"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm New Password */}
                      <div className="space-y-2">
                        <Label className="text-foreground">Confirm New Password</Label>
                        <div className="relative group">
                          <Input
                            type={showConfirm ? "text" : "password"}
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                            required
                            className="bg-background border-input pr-10 transition-all focus:ring-2 focus:ring-primary/20"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-4">
                      <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
                      <Button type="submit" disabled={loading} className="min-w-[140px] shadow-lg shadow-primary/20">
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeTab === "account-status" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <AccountStatusCard />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}