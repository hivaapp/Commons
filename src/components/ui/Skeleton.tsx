import { cn } from '../../lib/utils';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn('skeleton-shimmer rounded-md', className)}
            aria-hidden="true"
        />
    );
}

export function SkeletonText({ className }: SkeletonProps) {
    return <Skeleton className={cn('h-4 w-full', className)} />;
}

export function SkeletonStat({ className }: SkeletonProps) {
    return <Skeleton className={cn('h-8 w-24', className)} />;
}

export function SkeletonCard({ className }: SkeletonProps) {
    return (
        <div className={cn('rounded-lg border border-commons-border bg-white p-4', className)}>
            <SkeletonText className="w-2/3" />
            <SkeletonText className="mt-2 w-1/2" />
            <SkeletonText className="mt-4 w-full" />
            <SkeletonText className="mt-2 w-4/5" />
        </div>
    );
}

// ---------- Named skeletons ----------

/** 4 stat cards row matching Creator Dashboard layout */
export function StatCardSkeleton() {
    return (
        <div className="space-y-1">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-14" />
        </div>
    );
}

/** Campaign card skeleton matching the list card layout */
export function CampaignCardSkeleton() {
    return (
        <div className="rounded-lg border border-commons-border bg-white p-4">
            <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="mt-3 flex gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
            </div>
            <div className="mt-3 flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-16 rounded-md" />
            </div>
        </div>
    );
}

/** Table skeleton with header and rows */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="overflow-hidden rounded-lg border border-commons-border">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-commons-border bg-commons-surfaceAlt px-4 py-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 border-b border-commons-border px-4 py-3 last:border-b-0"
                >
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-3 w-14" />
                </div>
            ))}
        </div>
    );
}

/** Chart area skeleton */
export function ChartSkeleton({ className }: SkeletonProps) {
    return (
        <div className={cn('rounded-lg border border-commons-border bg-white p-4', className)}>
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-48 w-full rounded-md" />
        </div>
    );
}

/** Creator dashboard full skeleton */
export function CreatorDashboardSkeleton() {
    return (
        <div>
            {/* Greeting */}
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-1 h-3 w-64" />

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>

            {/* Campaign cards */}
            <div className="mt-8 space-y-3">
                {[1, 2, 3].map((i) => (
                    <CampaignCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

/** Community discover skeleton */
export function DiscoverSkeleton() {
    return (
        <div>
            <Skeleton className="h-10 w-full rounded-md" />
            <div className="mt-4 flex gap-2">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-7 w-16 rounded-full" />
                ))}
            </div>
            <div className="mt-6 space-y-3">
                {[1, 2, 3].map((i) => (
                    <CampaignCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

/** Brand dashboard skeleton */
export function BrandDashboardSkeleton() {
    return (
        <div>
            <Skeleton className="h-6 w-48" />

            <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>

            <div className="mt-8">
                <Skeleton className="h-4 w-32 mb-4" />
                <TableSkeleton rows={4} />
            </div>
        </div>
    );
}
