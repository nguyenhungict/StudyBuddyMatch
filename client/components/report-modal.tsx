'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Cookies from 'js-cookie'

export enum ReportType {
  SPAM = 'SPAM',
  HATE_SPEECH = 'HATE_SPEECH',
  HARASSMENT = 'HARASSMENT',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  SCAM = 'SCAM',
  FAKE_INFORMATION = 'FAKE_INFORMATION',
  OTHER = 'OTHER',
}

export enum ReportTargetType {
  MESSAGE = 'MESSAGE',
  COMMENT = 'COMMENT',
  POST = 'POST',
  USER = 'USER',
  RESOURCE = 'RESOURCE',
}

interface ReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetType: ReportTargetType
  targetId: string
  targetContent?: string
  reportedUserId?: string  // For MESSAGE reports from MongoDB
  onReportSubmitted?: () => void
}

export function ReportModal({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetContent,
  reportedUserId,
  onReportSubmitted,
}: ReportModalProps) {
  const [reportType, setReportType] = React.useState<ReportType | ''>('')
  const [reason, setReason] = React.useState('')
  const [details, setDetails] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reportType) {
      toast.error('Please select a report type')
      return
    }

    setIsSubmitting(true)

    try {
      // Get API base URL from environment or use default
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'
      const token = Cookies.get('accessToken') || localStorage.getItem('accessToken')

      const response = await fetch(`${apiUrl}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: reportType,
          targetType,
          targetId,
          reason: reason || undefined,
          details: details || undefined,
          reportedUserId: reportedUserId || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to submit report')
      }

      const data = await response.json()

      toast.success('Report submitted successfully. Thank you for helping keep our community safe.')

      // Reset form
      setReportType('')
      setReason('')
      setDetails('')
      onOpenChange(false)

      if (onReportSubmitted) {
        onReportSubmitted()
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to submit report. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const reportTypeLabels: Record<ReportType, string> = {
    [ReportType.SPAM]: 'Spam',
    [ReportType.HATE_SPEECH]: 'Hate Speech',
    [ReportType.HARASSMENT]: 'Harassment',
    [ReportType.INAPPROPRIATE_CONTENT]: 'Inappropriate Content',
    [ReportType.SCAM]: 'Scam',
    [ReportType.FAKE_INFORMATION]: 'Fake Information',
    [ReportType.OTHER]: 'Other',
  }

  const targetTypeLabels: Record<ReportTargetType, string> = {
    [ReportTargetType.MESSAGE]: 'message',
    [ReportTargetType.COMMENT]: 'comment',
    [ReportTargetType.POST]: 'post',
    [ReportTargetType.USER]: 'user',
    [ReportTargetType.RESOURCE]: 'document',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report {targetTypeLabels[targetType]}</DialogTitle>
          <DialogDescription>
            Help us keep the community safe by reporting inappropriate content or behavior.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type *</Label>
            <Select
              value={reportType}
              onValueChange={(value) => setReportType(value as ReportType)}
              required
            >
              <SelectTrigger id="report-type">
                <SelectValue placeholder="Select a report type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(reportTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Briefly describe why you're reporting this..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional Details (Optional)</Label>
            <Textarea
              id="details"
              placeholder="Any additional information that might help us review this report..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
            />
          </div>

          {targetContent && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium mb-1">Content being reported:</p>
              <p className="text-muted-foreground line-clamp-3">{targetContent}</p>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-md bg-yellow-50 dark:bg-yellow-950/20 p-3 text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-yellow-800 dark:text-yellow-200">
              False reports may result in action against your account. Please only report content
              that violates our community guidelines.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !reportType}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
