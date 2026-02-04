"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ReportModal, ReportTargetType } from "@/components/report-modal"
import { Flag, MessageSquare, FileText, User } from "lucide-react"

export default function TestReportPage() {
  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const [postModalOpen, setPostModalOpen] = useState(false)
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const [userModalOpen, setUserModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Flag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-card-foreground">Test Report Modal</h1>
              <p className="text-muted-foreground">Demo các loại báo cáo khác nhau</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Report Message */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle>Báo cáo tin nhắn</CardTitle>
              </div>
              <CardDescription>
                Báo cáo tin nhắn có nội dung vi phạm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Tin nhắn mẫu:</p>
                <p className="text-sm">
                  "Click here for free money! Limited offer, act now! Guaranteed no risk!"
                </p>
              </div>
              <Button
                onClick={() => setMessageModalOpen(true)}
                className="w-full"
                variant="outline"
              >
                <Flag className="h-4 w-4 mr-2" />
                Báo cáo tin nhắn này
              </Button>
            </CardContent>
          </Card>

          {/* Report Post */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle>Báo cáo bài viết</CardTitle>
              </div>
              <CardDescription>
                Báo cáo bài viết có nội dung không phù hợp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Bài viết mẫu:</p>
                <p className="text-sm">
                  "This post contains hate speech and discriminatory content against certain groups..."
                </p>
              </div>
              <Button
                onClick={() => setPostModalOpen(true)}
                className="w-full"
                variant="outline"
              >
                <Flag className="h-4 w-4 mr-2" />
                Báo cáo bài viết này
              </Button>
            </CardContent>
          </Card>

          {/* Report Comment */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle>Báo cáo bình luận</CardTitle>
              </div>
              <CardDescription>
                Báo cáo bình luận có tính chất quấy rối
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Bình luận mẫu:</p>
                <p className="text-sm">
                  "You're so stupid! I will find you and make you regret this..."
                </p>
              </div>
              <Button
                onClick={() => setCommentModalOpen(true)}
                className="w-full"
                variant="outline"
              >
                <Flag className="h-4 w-4 mr-2" />
                Báo cáo bình luận này
              </Button>
            </CardContent>
          </Card>

          {/* Report User */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-red-600" />
                </div>
                <CardTitle>Báo cáo người dùng</CardTitle>
              </div>
              <CardDescription>
                Báo cáo người dùng có hành vi vi phạm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Người dùng:</p>
                <p className="text-sm font-medium">@suspicious_user_123</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Liên tục gửi spam và nội dung lừa đảo
                </p>
              </div>
              <Button
                onClick={() => setUserModalOpen(true)}
                className="w-full"
                variant="outline"
              >
                <Flag className="h-4 w-4 mr-2" />
                Báo cáo người dùng này
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mt-6 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Flag className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-2">Về tính năng báo cáo:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Tất cả báo cáo sẽ được xem xét bởi đội ngũ moderation</li>
                  <li>Hệ thống tự động quét và phát hiện vi phạm</li>
                  <li>Báo cáo giả có thể dẫn đến hành động với tài khoản của bạn</li>
                  <li>Thông tin báo cáo được bảo mật và ẩn danh</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Modals */}
      <ReportModal
        open={messageModalOpen}
        onOpenChange={setMessageModalOpen}
        targetType={ReportTargetType.MESSAGE}
        targetId="msg-demo-123"
        targetContent="Click here for free money! Limited offer, act now! Guaranteed no risk!"
        onReportSubmitted={() => {
          console.log("Message report submitted")
        }}
      />

      <ReportModal
        open={postModalOpen}
        onOpenChange={setPostModalOpen}
        targetType={ReportTargetType.POST}
        targetId="post-demo-456"
        targetContent="This post contains hate speech and discriminatory content against certain groups..."
        onReportSubmitted={() => {
          console.log("Post report submitted")
        }}
      />

      <ReportModal
        open={commentModalOpen}
        onOpenChange={setCommentModalOpen}
        targetType={ReportTargetType.COMMENT}
        targetId="comment-demo-789"
        targetContent="You're so stupid! I will find you and make you regret this..."
        onReportSubmitted={() => {
          console.log("Comment report submitted")
        }}
      />

      <ReportModal
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        targetType={ReportTargetType.USER}
        targetId="user-demo-321"
        onReportSubmitted={() => {
          console.log("User report submitted")
        }}
      />
    </div>
  )
}
