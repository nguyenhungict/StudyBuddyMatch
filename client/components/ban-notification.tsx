'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertCircle } from 'lucide-react'

interface BanNotificationProps {
    open: boolean
    isPermanent: boolean
    bannedUntil?: string
    onClose: () => void
}

export function BanNotification({ open, isPermanent, bannedUntil, onClose }: BanNotificationProps) {
    const message = isPermanent
        ? 'Your account has been permanently banned due to violations of community guidelines.'
        : `Your account has been temporarily banned until ${bannedUntil ? new Date(bannedUntil).toLocaleString() : 'further notice'}.`

    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-xl">Account Banned</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-base leading-relaxed">
                        {message}
                        <br /><br />
                        You will be logged out now.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction
                        onClick={onClose}
                        className="bg-primary hover:bg-primary/90"
                    >
                        OK
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
