import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Megaphone, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRupeesExact } from '../../lib/format';
import { useBrandDashboard } from '../../hooks/brand/useBrandDashboard';

// ---------- Types ----------

type CampaignStatus = 'active' | 'pending_review' | 'completed' | 'draft' | 'paused';
type FilterKey = 'all' | CampaignStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'pending_review', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
    { key: 'draft', label: 'Draft' },
];

const statusBadgeMap: Record<string, { variant: 'success' | 'warning' | 'neutral'; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    pending_review: { variant: 'warning', label: 'Pending review' },
    completed: { variant: 'neutral', label: 'Completed' },
    draft: { variant: 'neutral', label: 'Draft' },
    paused: { variant: 'warning', label: 'Paused' },
};

// ---------- Component ----------

export default function BrandCampaigns() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<FilterKey>('all');
    const { campaigns } = useBrandDashboard();

    if (campaigns.isLoading) {
        return (
            <div>
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-9 w-28 rounded-md" />
                </div>
                <div className="mt-5 space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
            </div>
        );
    }

    const allCampaigns = campaigns.data ?? [];
    const filtered = filter === 'all'
        ? allCampaigns
        : allCampaigns.filter((c) => c.status === filter);

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-[20px] font-bold text-commons-text">Campaigns</h1>
                <Link to="/brand/campaigns/new">
                    <Button variant="primary">New Campaign</Button>
                </Link>
            </div>

            {/* Filter tabs */}
            <div className="mt-5 flex gap-4 overflow-x-auto">
                {FILTERS.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={cn(
                            'shrink-0 text-[13px] font-medium transition-colors focus:outline-none',
                            filter === f.key
                                ? 'text-commons-brand'
                                : 'text-commons-textMid hover:text-commons-text',
                        )}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="mt-8">
                    <EmptyState
                        icon={Megaphone}
                        heading="No campaigns yet"
                        description="Create your first campaign to reach creators and their communities."
                    />
                </div>
            ) : (
                <div className="mt-4 divide-y divide-commons-border">
                    {filtered.map((c) => {
                        const pct = c.target_participants
                            ? Math.round(((c.current_participants ?? 0) / (c.target_participants ?? 1)) * 100)
                            : 0;
                        const badge = statusBadgeMap[c.status] ?? statusBadgeMap.draft;
                        const creatorHandle = (c.creator_profiles as any)?.handle ?? '';

                        return (
                            <button
                                key={c.id}
                                onClick={() => navigate(`/brand/campaigns/${c.id}`)}
                                className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-commons-surfaceAlt/40 focus:outline-none"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-[14px] font-medium text-commons-text">
                                            {c.title}
                                        </span>
                                        <Badge variant={badge.variant}>{badge.label}</Badge>
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-2 text-[13px] text-commons-textMid">
                                        {creatorHandle && <span>@{creatorHandle}</span>}
                                        {creatorHandle && <span>·</span>}
                                        <span>{formatRupeesExact(c.budget_paise ?? 0)}</span>
                                        <span>·</span>
                                        <span>{c.current_participants ?? 0}/{c.target_participants ?? 0} participants</span>
                                    </div>
                                    {c.status === 'active' && (
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-commons-surfaceAlt">
                                                <div
                                                    className="h-full rounded-full bg-commons-brand transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="shrink-0 text-[12px] text-commons-textMid">
                                                {pct}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <ChevronRight className="h-4 w-4 shrink-0 text-commons-textLight" />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
