import { useNavigate } from 'react-router-dom';
import { Divider } from '../../components/ui/Divider';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { ChevronRight } from 'lucide-react';
import { formatRupees, formatRupeesExact, formatRelativeTime } from '../../lib/format';
import { useBrandDashboard } from '../../hooks/brand/useBrandDashboard';
import { useAuthStore } from '../../store/auth';

// ---------- Skeleton ----------

function DashboardSkeleton() {
    return (
        <div>
            <Skeleton className="h-6 w-40" />
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i}>
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="mt-1 h-3 w-16" />
                    </div>
                ))}
            </div>
            <Divider className="my-6" />
            <Skeleton className="h-3 w-28" />
            {[1, 2].map((i) => <Skeleton key={i} className="mt-3 h-14 w-full" />)}
        </div>
    );
}

const statusBadge: Record<string, { variant: 'success' | 'warning' | 'neutral'; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    pending_review: { variant: 'warning', label: 'Pending' },
    completed: { variant: 'neutral', label: 'Completed' },
    draft: { variant: 'neutral', label: 'Draft' },
    paused: { variant: 'warning', label: 'Paused' },
};

// ---------- Component ----------

export default function BrandDashboard() {
    const navigate = useNavigate();
    const { profile } = useAuthStore();
    const { stats, campaigns } = useBrandDashboard();

    if (stats.isLoading || campaigns.isLoading) return <DashboardSkeleton />;

    const companyName = (profile as any)?.company_name ?? profile?.full_name ?? 'there';
    const statsData = stats.data;
    const campaignList = (campaigns.data ?? []) as any[];
    const activeCampaigns = campaignList.filter((c: any) => c.status === 'active');

    return (
        <div>
            {/* ── Header ── */}
            <h1 className="text-[20px] font-bold text-commons-text">
                {companyName}
            </h1>

            {/* ── Key stats ── */}
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                    <p className="text-[28px] font-bold leading-tight text-commons-text">
                        {statsData?.activeCampaigns ?? 0}
                    </p>
                    <p className="mt-0.5 text-[11px] text-commons-textMid">Active campaigns</p>
                </div>
                <div>
                    <p className="text-[28px] font-bold leading-tight text-commons-text">
                        {formatRupees(statsData?.total_spent_paise ?? 0)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-commons-textMid">Total spent</p>
                </div>
                <div>
                    <p className="text-[28px] font-bold leading-tight text-commons-text">
                        {statsData?.totalParticipants ?? 0}
                    </p>
                    <p className="mt-0.5 text-[11px] text-commons-textMid">Total participants</p>
                </div>
                <div>
                    <p className="text-[28px] font-bold leading-tight text-commons-text">
                        {statsData?.reputation_score ?? 0}
                    </p>
                    <p className="mt-0.5 text-[11px] text-commons-textMid">Reputation</p>
                </div>
            </div>

            <Divider className="my-6" />

            {/* ── Active campaigns ── */}
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-commons-textMid">
                Active campaigns
            </p>

            {activeCampaigns.length === 0 ? (
                <div className="py-10 text-center">
                    <p className="text-[14px] text-commons-textMid">No active campaigns</p>
                    <button
                        onClick={() => navigate('/brand/campaigns/new')}
                        className="mt-2 text-[13px] font-medium text-commons-brand hover:text-commons-brandHover"
                    >
                        Create your first campaign →
                    </button>
                </div>
            ) : (
                <div className="divide-y divide-commons-border">
                    {activeCampaigns.map((c) => {
                        const pct = c.target_participants
                            ? Math.round(((c.current_participants ?? 0) / c.target_participants) * 100)
                            : 0;
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
                                        <Badge variant="success">Active</Badge>
                                    </div>
                                    <div className="mt-0.5 text-[13px] text-commons-textMid">
                                        {creatorHandle ? `@${creatorHandle} · ` : ''}{formatRupeesExact(c.budget_paise ?? 0)} · {c.current_participants ?? 0}/{c.target_participants ?? 0}
                                    </div>
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-commons-surfaceAlt">
                                            <div
                                                className="h-full rounded-full bg-commons-brand transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="shrink-0 text-[12px] text-commons-textMid">{pct}%</span>
                                    </div>
                                </div>
                                <ChevronRight className="h-4 w-4 shrink-0 text-commons-textLight" />
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Recent activity ── */}
            {campaignList.length > 0 && (
                <>
                    <Divider className="my-6" />
                    <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-commons-textMid">
                        Recent campaigns
                    </p>
                    <div className="divide-y divide-commons-border">
                        {campaignList.slice(0, 5).map((c) => {
                            const badge = statusBadge[c.status] ?? statusBadge.draft;
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => navigate(`/brand/campaigns/${c.id}`)}
                                    className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-commons-surfaceAlt/40 focus:outline-none"
                                >
                                    <div className="min-w-0 flex-1">
                                        <span className="truncate text-[14px] text-commons-text">{c.title}</span>
                                    </div>
                                    <Badge variant={badge.variant}>{badge.label}</Badge>
                                    <span className="shrink-0 text-[12px] text-commons-textLight">
                                        {formatRelativeTime(c.created_at)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
