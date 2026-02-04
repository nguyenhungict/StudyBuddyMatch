'use client'

import * as React from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  Loader2,
  Ban,
  AlertTriangle,
  Volume2,
  Trash2,
  CheckCircle,
  MessageSquare,
  FileText,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { getAuthHeaders } from '@/lib/auth-headers'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'

export enum ModerationAction {
  WARN = 'WARN',
  BAN = 'BAN',
  MUTE = 'MUTE',
  DELETE_CONTENT = 'DELETE_CONTENT',
  NONE = 'NONE',
}

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
  reason?: string
  target?: {
    email: string
    warnCount?: number
    banCount?: number
    lastViolationAt?: string
    profile?: {
      username?: string
    }
  }
}

interface ModerationReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: ModerationReport
  onReviewSubmitted?: () => void
}

export function ModerationReviewDialog({
  open,
  onOpenChange,
  report,
  onReviewSubmitted,
}: ModerationReviewDialogProps) {
  const [action, setAction] = React.useState<ModerationAction | ''>('')
  const [note, setNote] = React.useState('')
  const [banDuration, setBanDuration] = React.useState<1 | 3 | 7>(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Confirmation dialog
  const { confirm, dialog } = useConfirmDialog()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!action) {
      toast.error('Please select an action')
      return
    }

    // Confirm for BAN and WARN actions
    if (action === ModerationAction.BAN || action === ModerationAction.WARN) {
      const actionText = action === ModerationAction.BAN
        ? `ban this user for ${banDuration} day(s)`
        : 'issue a warning to this user'

      const confirmed = await confirm({
        title: "Confirm Action",
        description: `Are you sure you want to ${actionText}? This action will be logged and the user will be notified.`,
        confirmText: "Yes, Proceed",
        cancelText: "Cancel",
        variant: action === ModerationAction.BAN ? "destructive" : "default"
      })

      if (!confirmed) return
    }

    setIsSubmitting(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'

      const response = await fetch(`${apiUrl}/admin/moderations/${report.id}/review`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action,
          note: note || undefined,
          banDuration: action === ModerationAction.BAN ? banDuration : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to submit review')
      }

      toast.success('Review submitted successfully')

      setAction('')
      setNote('')
      setBanDuration(1)
      onOpenChange(false)

      if (onReviewSubmitted) {
        onReviewSubmitted()
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to submit review. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const actionLabels: Record<ModerationAction, { label: string; icon: any; color: string }> = {
    [ModerationAction.WARN]: {
      label: 'Warn User',
      icon: AlertTriangle,
      color: 'text-yellow-600'
    },
    [ModerationAction.BAN]: {
      label: 'Ban Account',
      icon: Ban,
      color: 'text-red-600'
    },
    [ModerationAction.DELETE_CONTENT]: {
      label: 'Delete Content',
      icon: Trash2,
      color: 'text-purple-600'
    },
    [ModerationAction.NONE]: {
      label: 'No Action (Dismiss Report)',
      icon: CheckCircle,
      color: 'text-green-600'
    },
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      SPAM: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
      HATE_SPEECH: 'bg-red-500/10 text-red-700 dark:text-red-400',
      HARASSMENT: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
      INAPPROPRIATE_CONTENT: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
      SCAM: 'bg-pink-500/10 text-pink-700 dark:text-pink-400',
      FAKE_INFORMATION: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
      OTHER: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
    }
    return (
      <Badge className={colors[type] || 'bg-gray-500/10 text-gray-700'}>
        {type.replace(/_/g, ' ')}
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
    <>
      {/* Confirmation Dialog */}
      {dialog}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Moderation Report</DialogTitle>
            <DialogDescription>
              Assess the report and decide on the appropriate action
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Report Details */}
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Email:</span>
                <span className="text-sm">{report.target?.email || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Violation Type:</span>
                {getTypeBadge(report.type)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Name:</span>
                <div className="flex items-center gap-2">
                  {getTargetIcon(report.targetType)}
                  <span className="text-sm">{report.target?.profile?.username || 'Unknown User'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Source:</span>
                <Badge variant="outline">{report.source}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Created Date:</span>
                <span className="text-sm">
                  {new Date(report.createdAt).toLocaleString('en-US')}
                </span>
              </div>
              {report.severity && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Severity:</span>
                  <Badge
                    variant={
                      report.severity === 'critical' ? 'destructive' :
                        report.severity === 'high' ? 'destructive' :
                          report.severity === 'medium' ? 'secondary' : 'outline'
                    }
                  >
                    {report.severity.toUpperCase()}
                  </Badge>
                </div>
              )}
              {report.reason && (
                <div className="pt-2 border-t border-border">
                  <span className="text-sm font-medium text-muted-foreground block mb-1">
                    Reason:
                  </span>
                  <p className="text-sm text-foreground">{report.reason}</p>
                </div>
              )}
            </div>

            {/* Violation History */}
            {report.target && (
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Violation History
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Warnings</p>
                    <p className="text-lg font-bold flex items-center gap-2">
                      {report.target.warnCount || 0}/3
                      {(report.target.warnCount ?? 0) >= 2 && (
                        <span className="text-yellow-600 dark:text-yellow-500">⚠️</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Bans</p>
                    <p className="text-lg font-bold flex items-center gap-2">
                      {report.target.banCount || 0}
                      {(report.target.banCount ?? 0) > 0 && (
                        <span className="text-red-600 dark:text-red-500">🔴</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Last Violation</p>
                    <p className="text-sm font-semibold">
                      {report.target.lastViolationAt
                        ? formatDistanceToNow(new Date(report.target.lastViolationAt), { addSuffix: true })
                        : 'Never'}
                    </p>
                  </div>
                </div>

                {/* Smart suggestions */}
                {report.target.warnCount === 2 && (
                  <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded text-xs text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Warning: One more warn will trigger automatic ban!</span>
                  </div>
                )}

                {(report.target.banCount ?? 0) >= 2 && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs text-red-800 dark:text-red-200 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Alert: Repeat offender - Consider stricter action!</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Selection */}
            <div className="space-y-2">
              <Label htmlFor="action">Action *</Label>
              <Select
                value={action}
                onValueChange={(value) => setAction(value as ModerationAction)}
                required
              >
                <SelectTrigger id="action">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(actionLabels)
                    .filter(([key]) => {
                      // Only show DELETE_CONTENT for RESOURCES (Documents)
                      const isResource = report.source === 'RESOURCE' || report.targetType === 'RESOURCE'
                      if (key === ModerationAction.DELETE_CONTENT && !isResource) return false

                      return true
                    })
                    .map(([value, config]) => {
                      const Icon = config.icon
                      return (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${config.color}`} />
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
            </div>

            {/* Ban Duration Selection - only show when action is BAN */}
            {action === ModerationAction.BAN && (
              <div className="space-y-2">
                <Label htmlFor="banDuration">Ban Duration *</Label>
                <Select
                  value={banDuration.toString()}
                  onValueChange={(value) => setBanDuration(Number(value) as 1 | 3 | 7)}
                >
                  <SelectTrigger id="banDuration">
                    <SelectValue placeholder="Select ban duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  User will be temporarily banned for the selected duration
                </p>
              </div>
            )}

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Add notes about your decision..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
              />
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 rounded-md bg-yellow-50 dark:bg-yellow-950/20 p-3 text-sm">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-yellow-800 dark:text-yellow-200">
                This action will affect user. Please review carefully before deciding.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !action}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
