"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Shield,
    Flag,
    Eye,
    MessageSquare,
    FileText,
    User,
    ArrowLeft,
    Inbox,
} from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { ModerationReviewDialog } from "@/components/moderation-review-dialog"
import { ViolationKeywordsManager } from "@/components/violation-keywords-manager"
import Link from "next/link"
import { getAuthHeaders } from "@/lib/auth-headers"

interface ModerationReport {
    id: string
    type: string
    source: string
    targetId: string
    targetType: string
    reporterId: string
    status: string
    createdAt: string
    severity?: string
    violationCount?: number
    target?: {
        email: string
        profile?: {
            username?: string
        }
    }
}

export default function AdminReportsPage() {
    const [reports, setReports] = useState<ModerationReport[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [filterType, setFilterType] = useState<string>("all")
    const [filterSource, setFilterSource] = useState<string>("all")
    const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null)
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888"

    useEffect(() => {
        fetchReports()
    }, [filterStatus, filterType, filterSource])

    const fetchReports = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterStatus !== "all") params.append("status", filterStatus)
            if (filterType !== "all") params.append("type", filterType)
            if (filterSource !== "all") params.append("source", filterSource)

            const response = await fetch(`${apiUrl}/admin/moderations?${params}`, {
                headers: getAuthHeaders(),
            })
            if (response.ok) {
                const data = await response.json()
                // Filter out RESOURCE reports as they are managed in Documents Management
                const filteredReports = (data.data || []).filter((r: ModerationReport) => r.source !== 'RESOURCE')
                setReports(filteredReports)
            }
        } catch (error) {
            console.error("Error fetching reports:", error)
            // Use mock data if API fails
            const { getMockReports } = await import('@/lib/mock-admin-data')
            const mockReports = getMockReports({
                status: filterStatus !== 'all' ? filterStatus : undefined,
                type: filterType !== 'all' ? filterType : undefined,
            })
            setReports(mockReports)
        } finally {
            setLoading(false)
        }
    }

    const handleReviewReport = (report: ModerationReport) => {
        setSelectedReport(report)
        setReviewDialogOpen(true)
    }

    const handleReviewSubmitted = () => {
        fetchReports()
        toast.success("Review has been submitted successfully")
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; icon: any }> = {
            PENDING: { variant: "secondary", icon: Clock },
            RESOLVED: { variant: "default", icon: CheckCircle },
            REJECTED: { variant: "destructive", icon: AlertCircle },
        }
        const config = variants[status] || variants.PENDING
        const Icon = config.icon
        return (
            <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                <Icon className="h-3 w-3" />
                {status}
            </Badge>
        )
    }

    const getTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            SPAM: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
            HATE_SPEECH: "bg-red-500/10 text-red-700 dark:text-red-400",
            HARASSMENT: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
            INAPPROPRIATE_CONTENT: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
            SCAM: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
            FAKE_INFORMATION: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
            OTHER: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
        }
        return (
            <Badge className={colors[type] || "bg-gray-500/10 text-gray-700"}>
                {type.replace(/_/g, " ")}
            </Badge>
        )
    }

    const getTargetIcon = (targetType: string) => {
        const icons: Record<string, any> = {
            MESSAGE: MessageSquare,
            POST: FileText,
            COMMENT: MessageSquare,
            USER: User,
            RESOURCE: FileText,
        }
        const Icon = icons[targetType] || AlertCircle
        return <Icon className="h-4 w-4" />
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="container max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-card-foreground">Report Management</h1>
                            <p className="text-muted-foreground">Review and process violation reports</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <Tabs defaultValue="reports" className="space-y-4">
                    <TabsList className="bg-muted">
                        <TabsTrigger value="reports" className="flex items-center gap-2">
                            <Flag className="h-4 w-4" />
                            Reports
                        </TabsTrigger>
                        <TabsTrigger value="keywords" className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Violation Keywords
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="reports" className="space-y-4">
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Report List</CardTitle>
                                        <CardDescription>Review and process violation reports</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                                            <SelectTrigger className="w-[150px]">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All</SelectItem>
                                                <SelectItem value="PENDING">Pending</SelectItem>
                                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={filterType} onValueChange={setFilterType}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Violation Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All</SelectItem>
                                                <SelectItem value="SPAM">Spam</SelectItem>
                                                <SelectItem value="HATE_SPEECH">Hate Speech</SelectItem>
                                                <SelectItem value="HARASSMENT">Harassment</SelectItem>
                                                <SelectItem value="INAPPROPRIATE_CONTENT">Inappropriate Content</SelectItem>
                                                <SelectItem value="SCAM">Scam</SelectItem>
                                                <SelectItem value="FAKE_INFORMATION">Fake Information</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={filterSource} onValueChange={setFilterSource}>
                                            <SelectTrigger className="w-[150px]">
                                                <SelectValue placeholder="Report Source" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Sources</SelectItem>
                                                <SelectItem value="MESSAGE">Messages</SelectItem>
                                                <SelectItem value="USER_REPORT">User Reports</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                                ) : reports.length === 0 ? (
                                    <EmptyState
                                        icon={Inbox}
                                        title="No Reports Found"
                                        description="There are no reports matching your current filters. Try adjusting the filters or check back later."
                                        action={{
                                            label: "Refresh",
                                            onClick: fetchReports
                                        }}
                                    />
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Source</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Created Date</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reports.map((report) => (
                                                <TableRow key={report.id}>
                                                    <TableCell className="text-sm">
                                                        {report.target?.email || 'Unknown'}
                                                    </TableCell>
                                                    <TableCell>{getTypeBadge(report.type)}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {getTargetIcon(report.targetType)}
                                                            <span className="text-sm">{report.target?.profile?.username || 'Unknown User'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{report.source}</Badge>
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {new Date(report.createdAt).toLocaleDateString("vi-VN")}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleReviewReport(report)}
                                                            disabled={report.status === "RESOLVED"}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            Review
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="keywords">
                        <ViolationKeywordsManager apiUrl={apiUrl} />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Review Dialog */}
            {selectedReport && (
                <ModerationReviewDialog
                    open={reviewDialogOpen}
                    onOpenChange={setReviewDialogOpen}
                    report={selectedReport}
                    onReviewSubmitted={handleReviewSubmitted}
                />
            )}
        </div>
    )
}
