'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Trash2, Edit, AlertCircle, FileText, User, LockKeyhole, AlertTriangle, ChevronRight, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { getAuthHeaders } from '@/lib/auth-headers'
import { cn } from "@/lib/utils"

interface Report {
    id: string
    type: string
    targetType: string
    targetId: string
    reason?: string
    details?: string
    status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'
    createdAt: string
    updatedAt: string
}

export default function MyReportsPage() {
    const router = useRouter()
    const [reports, setReports] = React.useState<Report[]>([])
    const [loading, setLoading] = React.useState(true)
    const [editingReport, setEditingReport] = React.useState<Report | null>(null)
    const [editReason, setEditReason] = React.useState('')
    const [editDetails, setEditDetails] = React.useState('')
    const [isUpdating, setIsUpdating] = React.useState(false)
    const [deletingId, setDeletingId] = React.useState<string | null>(null)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'

    React.useEffect(() => {
        fetchReports()
    }, [])

    const fetchReports = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${apiUrl}/reports/my-reports`, {
                headers: getAuthHeaders(),
            })
            if (response.ok) {
                const data = await response.json()
                setReports(data.data || [])
            }
        } catch (error) {
            console.error('Error fetching reports:', error)
            toast.error('Failed to load reports')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (report: Report) => {
        setEditingReport(report)
        setEditReason(report.reason || '')
        setEditDetails(report.details || '')
    }

    const handleUpdate = async () => {
        if (!editingReport) return

        setIsUpdating(true)
        try {
            const response = await fetch(`${apiUrl}/reports/${editingReport.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({
                    reason: editReason,
                    details: editDetails,
                }),
            })

            if (response.ok) {
                toast.success('Report updated successfully')
                setEditingReport(null)
                fetchReports()
            } else {
                const error = await response.json()
                throw new Error(error.message || 'Failed to update report')
            }
        } catch (error) {
            console.error('Error updating report:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to update report')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this report?')) return

        setDeletingId(id)
        try {
            const response = await fetch(`${apiUrl}/reports/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            })

            if (response.ok) {
                toast.success('Report deleted successfully')
                fetchReports()
            } else {
                const error = await response.json()
                throw new Error(error.message || 'Failed to delete report')
            }
        } catch (error) {
            console.error('Error deleting report:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to delete report')
        } finally {
            setDeletingId(null)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            PENDING: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20',
            UNDER_REVIEW: 'bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20',
            RESOLVED: 'bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20',
            DISMISSED: 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20',
        }
        return (
            <Badge variant="outline" className={cn("border", variants[status] || 'bg-muted text-muted-foreground')}>
                {status.replace('_', ' ')}
            </Badge>
        )
    }

    const canEdit = (report: Report) => {
        return report.status === 'PENDING'
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
                    <p className="text-muted-foreground mt-2">Manage your account reports and status.</p>
                </div>

                <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
                    {/* SIDEBAR NAVIGATION (Copied from Settings for consistency) */}
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
                                isActive={true}
                                onClick={() => { }}
                            />
                        </div>

                        <div className="rounded-xl border border-border bg-card p-2 shadow-sm mt-4">
                            <div className="px-4 py-2 mb-2">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Security</h3>
                            </div>
                            <SidebarItem
                                icon={LockKeyhole}
                                label="Password & Security"
                                onClick={() => router.push('/settings')}
                                isExternal
                            />
                            <SidebarItem
                                icon={AlertTriangle}
                                label="Account Status"
                                onClick={() => router.push('/settings')} // Redirect to settings tab
                                isExternal
                            />
                        </div>
                    </nav>

                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-border bg-card shadow-sm">
                            <CardHeader className="border-b border-border pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                        <ShieldCheck className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-foreground">Report History</CardTitle>
                                        <CardDescription className="mt-1 text-muted-foreground">
                                            {reports.length} report{reports.length !== 1 ? 's' : ''} submitted
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="text-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                                        <p className="text-muted-foreground">Loading reports...</p>
                                    </div>
                                ) : reports.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FileText className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground">No reports found</h3>
                                        <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                            You haven't submitted any reports yet. Reports help us keep the community safe.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="w-[120px] text-muted-foreground">Type</TableHead>
                                                    <TableHead className="text-muted-foreground">Target</TableHead>
                                                    <TableHead className="text-muted-foreground">Status</TableHead>
                                                    <TableHead className="text-muted-foreground">Submitted</TableHead>
                                                    <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {reports.map((report) => (
                                                    <TableRow key={report.id} className="hover:bg-muted/30 border-border">
                                                        <TableCell>
                                                            <span className="font-medium text-foreground text-sm capitalize">
                                                                {report.type.replace(/_/g, ' ').toLowerCase()}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-foreground text-sm capitalize">{report.targetType.toLowerCase()}</span>
                                                                <span className="text-xs text-muted-foreground truncate max-w-[150px] font-mono opacity-70">
                                                                    ID: {report.targetId.substring(0, 8)}...
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {canEdit(report) ? (
                                                                    <>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            onClick={() => handleEdit(report)}
                                                                            className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary"
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            onClick={() => handleDelete(report.id)}
                                                                            disabled={deletingId === report.id}
                                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                        >
                                                                            {deletingId === report.id ? (
                                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                            ) : (
                                                                                <Trash2 className="h-4 w-4" />
                                                                            )}
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <Badge variant="secondary" className="bg-muted text-muted-foreground border-none font-normal text-[10px]">
                                                                        Locked
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Edit Dialog - Styled for Theme */}
            <Dialog open={!!editingReport} onOpenChange={(open) => !open && setEditingReport(null)}>
                <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Edit Report</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Update your report details. You can only edit pending reports.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-reason" className="text-foreground">Reason</Label>
                            <Textarea
                                id="edit-reason"
                                value={editReason}
                                onChange={(e) => setEditReason(e.target.value)}
                                rows={3}
                                className="bg-background border-input text-foreground focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-details" className="text-foreground">Additional Details</Label>
                            <Textarea
                                id="edit-details"
                                value={editDetails}
                                onChange={(e) => setEditDetails(e.target.value)}
                                rows={4}
                                className="bg-background border-input text-foreground focus:ring-primary"
                            />
                        </div>
                        <div className="flex items-start gap-2 rounded-md bg-yellow-500/10 p-3 text-sm border border-yellow-500/20">
                            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                            <p className="text-yellow-700 dark:text-yellow-400">
                                Once a report is under review, you cannot edit or delete it.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditingReport(null)}
                            disabled={isUpdating}
                            className="border-border text-foreground hover:bg-secondary"
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={isUpdating} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {isUpdating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Report'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
