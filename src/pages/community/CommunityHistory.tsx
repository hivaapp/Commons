import { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRupeesExact, formatDuration, formatDate } from '../../lib/format';
import { useCommunityHistory } from '../../hooks/community/useCommunityHistory';

// ---------- Types ----------

type FilterKey = 'all' | 'approved' | 'submitted' | 'rejected';

const FILTER_TABS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'approved', label: 'Approved' },
    { key: 'submitted', label: 'Pending' },
    { key: 'rejected', label: 'Rejected' },
];

const statusBadge: Record<string, { variant: 'success' | 'warning' | 'error' | 'neutral'; label: string }> = {
    approved: { variant: 'success', label: 'Approved' },
    submitted: { variant: 'warning', label: 'Pending' },
    rejected: { variant: 'error', label: 'Rejected' },
    in_progress: { variant: 'neutral', label: 'In progress' },
};

// ---------- Component ----------

export default function CommunityHistory() {
    const [filter, setFilter] = useState<FilterKey>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const { data: tasks, isLoading } = useCommunityHistory(filter === 'all' ? undefined : filter);

    if (isLoading) {
        return (
            <div>
                <div className="flex gap-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-5 w-16" />)}
                </div>
                <div className="mt-6 space-y-2">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            </div>
        );
    }

    const taskList = tasks ?? [];

    return (
        <div>
            {/* ── Tabs ── */}
            <div className="flex gap-5 border-b border-commons-border">
                {FILTER_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={cn(
                            'border-b-2 pb-2.5 text-[13px] font-medium transition-colors focus:outline-none',
                            filter === tab.key
                                ? 'border-commons-brand text-commons-brand'
                                : 'border-transparent text-commons-textMid hover:text-commons-text',
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Task list ── */}
            {taskList.length === 0 ? (
                <div className="mt-8">
                    <EmptyState
                        icon={Clock}
                        heading="No tasks yet"
                        description={
                            filter === 'all'
                                ? 'Complete campaigns to see your history here.'
                                : `No ${filter.replace('_', ' ')} tasks.`
                        }
                    />
                </div>
            ) : (
                <div className="mt-1 divide-y divide-commons-border">
                    {taskList.map((t) => {
                        const badge = statusBadge[t.status ?? 'in_progress'] ?? statusBadge.in_progress;
                        const campaignTitle = (t.campaigns as any)?.title ?? 'Task';
                        const brandName = (t.campaigns as any)?.brand_profiles?.company_name ?? '';
                        const isRejected = t.status === 'rejected';
                        const isExpanded = expandedId === t.id;

                        return (
                            <div key={t.id}>
                                <button
                                    onClick={isRejected ? () => setExpandedId(isExpanded ? null : t.id) : undefined}
                                    className={cn(
                                        'flex w-full items-center gap-3 py-3 text-left',
                                        isRejected && 'cursor-pointer hover:bg-commons-surfaceAlt/40',
                                    )}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[14px] text-commons-text">
                                            {campaignTitle}
                                        </p>
                                        <p className="mt-0.5 text-[12px] text-commons-textMid">
                                            {brandName}{brandName ? ' · ' : ''}
                                            {t.submitted_at ? formatDate(t.submitted_at) : ''}
                                            {t.time_spent_seconds ? ` · ${formatDuration(t.time_spent_seconds)}` : ''}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[14px] font-medium text-commons-text">
                                        {formatRupeesExact(t.payout_amount_paise ?? (t.campaigns as any)?.per_task_paise ?? 0)}
                                    </span>
                                    <Badge variant={badge.variant}>{badge.label}</Badge>
                                    {isRejected && (
                                        isExpanded
                                            ? <ChevronUp className="h-4 w-4 shrink-0 text-commons-textLight" />
                                            : <ChevronDown className="h-4 w-4 shrink-0 text-commons-textLight" />
                                    )}
                                </button>

                                {/* Rejection expansion */}
                                {isRejected && isExpanded && (
                                    <div className="ml-0 border-l-2 border-commons-error pl-4 pb-3">
                                        <p className="text-[13px] text-commons-error">
                                            {t.rejection_reason || 'No reason provided'}
                                        </p>
                                        {t.rejection_category && (
                                            <p className="mt-1 text-[12px] text-commons-textMid">
                                                Category: {t.rejection_category}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
