'use client'

import * as React from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
    onConfirm: () => void
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    onConfirm,
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm()
        onOpenChange(false)
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-base">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={
                            variant === 'destructive'
                                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                : ''
                        }
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

// Hook for easier usage
export function useConfirmDialog() {
    const [isOpen, setIsOpen] = React.useState(false)
    const [config, setConfig] = React.useState<Omit<ConfirmDialogProps, 'open' | 'onOpenChange' | 'onConfirm'>>({
        title: '',
        description: '',
    })
    const resolveRef = React.useRef<((value: boolean) => void) | undefined>(undefined)

    const confirm = React.useCallback(
        (options: Omit<ConfirmDialogProps, 'open' | 'onOpenChange' | 'onConfirm'>) => {
            setConfig(options)
            setIsOpen(true)
            return new Promise<boolean>((resolve) => {
                resolveRef.current = resolve
            })
        },
        []
    )

    const handleConfirm = React.useCallback(() => {
        resolveRef.current?.(true)
        setIsOpen(false)
    }, [])

    const handleCancel = React.useCallback(() => {
        resolveRef.current?.(false)
        setIsOpen(false)
    }, [])

    const dialog = (
        <ConfirmDialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) handleCancel()
                else setIsOpen(open)
            }}
            {...config}
            onConfirm={handleConfirm}
        />
    )

    return { confirm, dialog }
}
