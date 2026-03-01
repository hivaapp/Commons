import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';
import { formatRupeesExact } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';

// ---------- Types ----------

type CampaignStatus = 'active' | 'completed' | 'draft' | 'paused';
type FilterTab = 'all' | CampaignStatus;

const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'draft', label: 'Draft' },
];

const statusBadge: Record<string, { variant: 'success' | 'neutral' | 'warning'; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    completed: { variant: 'success', label: 'Completed' },
    draft: { variant: 'neutral', label: 'Draft' },
    paused: { variant: 'warning', label: 'Paused' },
};

const statusBarColor: Record<string, string> = {
    active: 'bg-commons-brand',
    completed: 'bg-commons-success',
    draft: 'bg-commons-textLight',
    paused: 'bg-commons-warning',
};

// ---------- Component ----------

export default function CreatorCampaigns() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<FilterTab>('all');

    const { data: campaigns, isLoading } = useQuery({
        queryKey: ['creator-all-campaigns', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('campaigns')
                .select(`
                    id, title, campaign_type, status, budget_paise,
                    target_participants, current_participants,
                    created_at,
                    brand_profiles ( company_name )
                `)
                .eq('creator_id', user!.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });

    const filtered =
        activeTab === 'all'
            ? (campaigns ?? [])
            : (campaigns ?? []).filter((c) => c.status === activeTab);

    if (isLoading) {
        return (
            <div>
                <Skeleton className="h-5 w-24" />
                <div className="mt-5 space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-md" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* ── Tab bar ── */}
            <div className="-mx-6 overflow-x-auto px-6 md:-mx-8 md:px-8">
                <div className="flex gap-5 border-b border-commons-border">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                'shrink-0 border-b-2 pb-2.5 text-[13px] font-medium transition-colors focus:outline-none',
                                activeTab === tab.key
                                    ? 'border-commons-brand text-commons-brand'
                                    : 'border-transparent text-commons-textMid hover:text-commons-text',
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Campaign list ── */}
            {filtered.length === 0 ? (
                <div className="py-16 text-center">
                    <p className="text-[14px] text-commons-textMid">
                        No campaigns found
                    </p>
                    <p className="mt-1 text-[13px] text-commons-textLight">
                        Campaigns matching this filter will appear here.
                    </p>
                </div>
            ) : (
                <div className="mt-1 divide-y divide-commons-border">
                    {filtered.map((c) => {
                        const participants = c.current_participants ?? 0;
                        const target = c.target_participants ?? 0;
                        const pct = target > 0 ? Math.round((participants / target) * 100) : 0;
                        const badge = statusBadge[c.status] ?? statusBadge.draft;
                        const barColor = statusBarColor[c.status] ?? statusBarColor.draft;
                        const brandName = (c.brand_profiles as any)?.company_name ?? '';

                        return (
                            <button
                                key={c.id}
                                onClick={() => navigate(`/creator/campaigns/${c.id}`)}
                                className="flex w-full flex-col gap-1 py-3.5 text-left transition-colors hover:bg-commons-surfaceAlt/40 focus:outline-none"
                            >
                                {/* Line 1 */}
                                <div className="flex items-center justify-between">
                                    <span className="truncate text-[14px] font-semibold text-commons-text">
                                        {c.title}
                                    </span>
                                    <Badge variant={badge.variant}>
                                        {badge.label}
                                    </Badge>
                                </div>

                                {/* Line 2 */}
                                <span className="text-[13px] text-commons-textMid">
                                    {brandName}{brandName ? ' · ' : ''}{c.campaign_type ?? ''} · {formatRupeesExact(c.budget_paise ?? 0)}
                                </span>

                                {/* Progress bar */}
                                <div className="mt-0.5 h-[3px] w-full overflow-hidden rounded-full bg-commons-surfaceAlt">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all',
                                            barColor,
                                        )}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
