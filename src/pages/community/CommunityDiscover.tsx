import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Search, Clock, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRupeesExact } from '../../lib/format';
import { useCommunityDiscover } from '../../hooks/community/useCommunityDiscover';
import { useJoinCampaign } from '../../hooks/community/useCommunityMutations';
import { prefetchCampaignDetail } from '../../lib/queryClient';
import { useToast } from '../../components/ui/ToastProvider';

// ---------- Types ----------

type FilterKey = 'all' | 'Research' | 'Review' | 'Referral' | 'Content' | 'Beta Test' | 'Vote';

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'Research', label: 'Research' },
    { key: 'Review', label: 'Review' },
    { key: 'Referral', label: 'Referral' },
    { key: 'Content', label: 'Content' },
    { key: 'Beta Test', label: 'Beta Test' },
    { key: 'Vote', label: 'Vote' },
];

// ---------- Skeleton ----------

function DiscoverSkeleton() {
    return (
        <div>
            <Skeleton className="h-10 w-full rounded-md" />
            <div className="mt-4 flex gap-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-7 w-16 rounded-full" />)}
            </div>
            <div className="mt-6 space-y-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
            </div>
        </div>
    );
}

// ---------- Component ----------

export default function CommunityDiscover() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<FilterKey>('all');
    const [search, setSearch] = useState('');

    const { data: campaigns, isLoading } = useCommunityDiscover(filter === 'all' ? undefined : filter);
    const joinCampaign = useJoinCampaign();
    const toast = useToast();

    if (isLoading) return <DiscoverSkeleton />;

    // Client-side search
    const filtered = (campaigns ?? []).filter((c) =>
        !search || c.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {/* ── Search bar ── */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-commons-textLight" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search campaigns…"
                    className="h-10 w-full rounded-md border border-commons-border bg-white pl-9 pr-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                />
            </div>

            {/* ── Filter chips ── */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {FILTER_CHIPS.map((chip) => (
                    <button
                        key={chip.key}
                        onClick={() => setFilter(chip.key)}
                        className={cn(
                            'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors',
                            filter === chip.key
                                ? 'bg-commons-brand text-white'
                                : 'bg-commons-surfaceAlt text-commons-textMid hover:text-commons-text',
                        )}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>

            {/* ── Campaign cards ── */}
            {filtered.length === 0 ? (
                <div className="mt-8">
                    <EmptyState
                        icon={Search}
                        heading="No campaigns found"
                        description={search ? 'Try different search terms or filters.' : 'New campaigns will appear here.'}
                    />
                </div>
            ) : (
                <div className="mt-6 space-y-3">
                    {filtered.map((c) => {
                        const creatorName = (c.creator_profiles as any)?.handle ?? (c.creator_profiles as any)?.full_name ?? '';
                        const brandName = (c.brand_profiles as any)?.company_name ?? '';
                        const spotsLeft = (c.target_participants ?? 0) - (c.current_participants ?? 0);

                        return (
                            <div
                                key={c.id}
                                className="rounded-lg border border-commons-border bg-white p-4"
                                onMouseEnter={() => prefetchCampaignDetail(c.id)}
                            >
                                {/* Row 1 */}
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[14px] font-semibold text-commons-text">
                                            {c.title}
                                        </p>
                                        <p className="mt-0.5 text-[13px] text-commons-textMid">
                                            {brandName || creatorName} · {c.campaign_type ?? 'Campaign'}
                                        </p>
                                    </div>
                                    <Badge variant="success">
                                        {formatRupeesExact(c.per_task_paise ?? 0)}
                                    </Badge>
                                </div>

                                {/* Row 2 — meta */}
                                <div className="mt-2 flex gap-3 text-[12px] text-commons-textMid">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {c.estimated_minutes ?? '?'} min
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {spotsLeft} spots left
                                    </span>
                                </div>

                                {/* Row 3 — actions */}
                                <div className="mt-3 flex items-center justify-between">
                                    <button
                                        onClick={() => navigate(`/community/task/${c.id}`)}
                                        className="text-[13px] text-commons-textMid hover:text-commons-text"
                                    >
                                        View details
                                    </button>
                                    <button
                                        onClick={() => {
                                            joinCampaign.mutate(c.id, {
                                                onSuccess: () => {
                                                    navigate(`/community/task/${c.id}`);
                                                },
                                                onError: (err: any) => {
                                                    toast.error('Could not join campaign', err?.message ?? 'Please try again');
                                                },
                                            });
                                        }}
                                        disabled={joinCampaign.isPending}
                                        className="rounded-md bg-commons-brand px-3 py-1.5 text-[13px] font-medium text-white hover:bg-commons-brandHover disabled:opacity-50"
                                    >
                                        {joinCampaign.isPending ? 'Joining…' : 'Join'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
