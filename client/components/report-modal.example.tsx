/**
 * Example usage of ReportModal component
 * 
 * This file demonstrates how to use the ReportModal component in your pages.
 * You can import and use it like this:
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ReportModal, ReportTargetType } from '@/components/report-modal'
import { Flag } from 'lucide-react'

export function ReportButtonExample() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  // Example: Report a message
  const handleReportMessage = () => {
    setIsReportModalOpen(true)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleReportMessage}
        className="text-muted-foreground hover:text-destructive"
      >
        <Flag className="h-4 w-4" />
        <span className="sr-only">Report</span>
      </Button>

      <ReportModal
        open={isReportModalOpen}
        onOpenChange={setIsReportModalOpen}
        targetType={ReportTargetType.MESSAGE}
        targetId="message-id-123"
        targetContent="This is the message content that is being reported..."
        onReportSubmitted={() => {
          console.log('Report submitted successfully')
          // You can add additional logic here, like refreshing the page or showing a notification
        }}
      />
    </>
  )
}

/**
 * Example: Report a user profile
 */
export function ReportUserExample() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsReportModalOpen(true)}
      >
        Report User
      </Button>

      <ReportModal
        open={isReportModalOpen}
        onOpenChange={setIsReportModalOpen}
        targetType={ReportTargetType.USER}
        targetId="user-id-456"
      />
    </>
  )
}

/**
 * Example: Report a post
 */
export function ReportPostExample() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsReportModalOpen(true)}
      >
        Report Post
      </Button>

      <ReportModal
        open={isReportModalOpen}
        onOpenChange={setIsReportModalOpen}
        targetType={ReportTargetType.POST}
        targetId="post-id-789"
        targetContent="This is the post content..."
      />
    </>
  )
}

