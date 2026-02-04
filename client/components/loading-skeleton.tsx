import { Card, CardContent } from "@/components/ui/card"

export function StatCardSkeleton() {
    return (
        <Card className="border-border bg-card">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-3">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-14 w-14 rounded-full bg-muted animate-pulse" />
                </div>
            </CardContent>
        </Card>
    )
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
    return (
        <Card className="border-border bg-card">
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                    <div
                        className="bg-muted animate-pulse rounded mt-4"
                        style={{ height: `${height}px` }}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
