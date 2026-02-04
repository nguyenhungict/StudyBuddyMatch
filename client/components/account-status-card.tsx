"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Shield, CheckCircle, Clock, Info } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { getAuthHeaders } from "@/lib/auth-headers"

interface AccountStatus {
    warnCount: number
    lastViolationAt: string | null
    daysUntilReset: number | null
    isClean: boolean
}

export function AccountStatusCard() {
    const [status, setStatus] = useState<AccountStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    useEffect(() => {
        if (user?.id) {
            fetchAccountStatus()
        }
    }, [user?.id])

    const fetchAccountStatus = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888"
            const response = await fetch(`${apiUrl}/users/account-status`, {
                headers: getAuthHeaders(),
            })

            if (response.ok) {
                const data = await response.json()
                setStatus(data)
            }
        } catch (error) {
            console.error("Failed to fetch account status:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Card className="border-border shadow-sm bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                        <Shield className="h-5 w-5 text-primary" />
                        Account Status
                    </CardTitle>
                    <CardDescription>
                        View your account warning status
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                        Loading...
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!status) {
        return null
    }

    // THEME-AWARE STATUS STYLES (Supports Light + Dark Mode)
    const getStatusStyles = (warnings: number) => {
        if (warnings === 0) return {
            container: "bg-green-500/10 border-green-500/20",
            icon: "text-green-600 dark:text-green-500",
            text: "text-green-700 dark:text-green-400",
            progress: "bg-green-500"
        }
        if (warnings === 1) return {
            container: "bg-yellow-500/10 border-yellow-500/20",
            icon: "text-yellow-600 dark:text-yellow-500",
            text: "text-yellow-700 dark:text-yellow-400",
            progress: "bg-yellow-500"
        }
        if (warnings === 2) return {
            container: "bg-orange-500/10 border-orange-500/20",
            icon: "text-orange-600 dark:text-orange-500",
            text: "text-orange-700 dark:text-orange-400",
            progress: "bg-orange-500"
        }
        return {
            container: "bg-red-500/10 border-red-500/20",
            icon: "text-red-600 dark:text-red-500",
            text: "text-red-700 dark:text-red-400",
            progress: "bg-red-500"
        }
    }

    const { container, icon, text, progress } = getStatusStyles(status.warnCount)

    const getStatusIcon = (warnings: number) => {
        if (warnings === 0) return <CheckCircle className={`h-12 w-12 ${icon}`} />
        if (warnings < 3) return <AlertTriangle className={`h-12 w-12 ${icon}`} />
        return <AlertTriangle className={`h-12 w-12 ${icon}`} />
    }

    const getStatusMessage = (warnings: number) => {
        if (warnings === 0) return "Your account is in good standing!"
        if (warnings === 1) return "You have received 1 warning. Please follow community guidelines."
        if (warnings === 2) return "You have received 2 warnings. One more warning will result in a temporary ban."
        return "You have reached the maximum warnings. Your account may be temporarily banned."
    }

    return (
        <Card className="border-border shadow-sm bg-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <Shield className="h-5 w-5 text-primary" />
                    Account Status
                </CardTitle>
                <CardDescription>
                    Track your account warning status and community standing
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Warning Counter */}
                <div className={`rounded-lg border p-6 ${container}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            {getStatusIcon(status.warnCount)}
                            <div>
                                <h3 className={`text-2xl font-bold ${text}`}>
                                    {status.warnCount}/3 Warnings
                                </h3>
                                <p className={`text-sm mt-1 ${text}`}>
                                    {getStatusMessage(status.warnCount)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-black/5 dark:bg-white/10 rounded-full h-3 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${progress}`}
                            style={{ width: `${Math.max((status.warnCount / 3) * 100, 5)}%` }} // Min width 5% to show bar
                        />
                    </div>
                </div>

                {/* Reset Information */}
                {status.lastViolationAt && status.daysUntilReset !== null && (
                    <div className="rounded-lg border border-border bg-muted/50 p-4">
                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-medium text-sm mb-1 text-foreground">Warning Reset Timer</h4>
                                <p className="text-sm text-muted-foreground">
                                    {status.daysUntilReset > 0 ? (
                                        <>
                                            Your warnings will be reset in{" "}
                                            <span className="font-semibold text-foreground">
                                                {status.daysUntilReset} day{status.daysUntilReset !== 1 ? "s" : ""}
                                            </span>
                                            {" "}if you maintain good behavior.
                                        </>
                                    ) : (
                                        "Your warnings are eligible for reset!"
                                    )}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Last violation:{" "}
                                    {new Date(status.lastViolationAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Info Box */}
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="flex-1 text-sm text-blue-900 dark:text-blue-100">
                            <p className="font-medium mb-2">Community Guidelines Reminder</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200 opacity-90">
                                <li>Warnings are issued for violations of community guidelines</li>
                                <li>3 warnings will result in a temporary ban</li>
                                <li>Ban duration increases with repeat offenses (1, 3, then 7 days)</li>
                                <li>Warnings reset after 30 days of good behavior</li>
                                <li>Follow our guidelines to keep your account in good standing</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
