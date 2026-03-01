import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Divider } from '../../components/ui/Divider';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { ChevronRight, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRupees, formatRupeesExact } from '../../lib/format';
import { useCreatorDashboard } from '../../hooks/creator/useCreatorDashboard';
import { useAuthStore } from '../../store/auth';
import { useAcceptInvitation, useDeclineInvitation } from '../../hooks/creator/useCreatorMutations';
import { useToast } from '../../components/ui/ToastProvider';

// ---------- Stat explanations ----------

const STAT_EXPLANATIONS: Record<string, { title: string; body: string }> = {
    totalEarned: {
        title: 'Total Earned',
        body: 'Lifetime revenue from all completed and active campaigns, including your creator fee and bonuses.',
    },
    communityEarned: {
        title: 'Community Earned',
        body: 'Total earnings distributed to your community members across all campaigns you\'ve launched.',
    },
    activationRate: {
        title: 'Activation Rate',
        body: 'The percentage of your community that actively participates when you launch a new campaign. Higher is better.',
    },
    trustScore: {
        title: 'Trust Score',
        body: 'A composite score based on campaign completion rate, community satisfaction, and brand feedback. Score above 800 is excellent.',
    },
};

// ---------- Greeting time ----------

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

function getTrustScoreColor(score: number): string {
    if (score >= 800) return 'text-commons-success';
    if (score >= 600) return 'text-commons-warning';
    return 'text-commons-error';
}

// ---------- Bottom‑sheet overlay ----------

function BottomSheet({
    open,
    onClose,
    title,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
            <div
                className="absolute inset-0 bg-black/20"
                onClick={onClose}
            />
            <div className="relative w-full max-w-[420px] animate-slide-up rounded-t-xl bg-white px-6 pb-8 pt-5 md:rounded-xl">
                <div className="mb-1 flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-commons-text">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-commons-textMid hover:bg-commons-surfaceAlt"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="text-[14px] leading-relaxed text-commons-textMid">
                    {children}
                </div>
            </div>
        </div>
    );
}

// ---------- Skeleton ----------

function DashboardSkeleton() {
    return (
        <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-2 h-4 w-32" />
            <div className="mb-8 mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i}>
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="mt-1 h-3 w-16" />
                    </div>
                ))}
            </div>
            <Skeleton className="h-4 w-64" />
            <Divider className="my-6" />
            <Skeleton className="h-3 w-28" />
            {[1, 2].map((i) => (
                <Skeleton key={i} className="mt-3 h-14 w-full" />
            ))}
        </div>
    );
}

// ---------- Component ----------

export default function CreatorDashboard() {
    const navigate = useNavigate();
    const { profile } = useAuthStore();
    const [sheetKey, setSheetKey] = useState<string | null>(null);

    const { stats, campaigns, invitations } = useCreatorDashboard();
    const acceptInvitation = useAcceptInvitation();
    const declineInvitation = useDeclineInvitation();
    const toast = useToast();

    const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

    if (stats.isLoading || campaigns.isLoading) return <DashboardSkeleton />;

    const statsData = stats.data;
    const campaignList = campaigns.data ?? [];
    const invitationList = invitations.data ?? [];
    const activeCampaignsCount = campaignList.length;

    const totalEarned = statsData?.total_earned ?? 0;
    const communityEarned = statsData?.community_earned_total ?? 0;
    const activationRate = Math.round((statsData?.avg_activation_rate ?? 0) * 100);
    const trustScore = (statsData as any)?.trust_score ?? 0;

    const firstInvitation = invitationList[0];

    return (
        <div>
            {/* ── SECTION 1 — Greeting ── */}
            <h1 className="text-[20px] font-bold text-commons-text">
                {getGreeting()}, {firstName}
            </h1>
            <p className="mt-1 text-[14px] text-commons-textMid">
                {activeCampaignsCount} active campaign{activeCampaignsCount !== 1 ? 's' : ''} · Trust Score{' '}
                {trustScore}
            </p>

            {/* ── SECTION 2 — Key numbers (2×2 mobile, 4‑inline desktop) ── */}
            <div className="mb-8 mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                <button
                    onClick={() => setSheetKey('totalEarned')}
                    className="text-left focus:outline-none"
                >
                    <p className="text-[28px] font-bold leading-tight text-commons-success">
                        {formatRupees(totalEarned)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-commons-textMid">
                        Total earned
                    </p>
                </button>

                <button
                    onClick={() => setSheetKey('communityEarned')}
                    className="text-left focus:outline-none"
                >
                    <p className="text-[28px] font-bold leading-tight text-commons-success">
                        {formatRupees(communityEarned)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-commons-textMid">
                        Community earned
                    </p>
                </button>

                <button
                    onClick={() => setSheetKey('activationRate')}
                    className="text-left focus:outline-none"
                >
                    <p className="text-[28px] font-bold leading-tight text-commons-text">
                        {activationRate.toFixed(1)}%
                    </p>
                    <p className="mt-0.5 text-[11px] text-commons-textMid">
                        Activation rate
                    </p>
                </button>

                <button
                    onClick={() => setSheetKey('trustScore')}
                    className="text-left focus:outline-none"
                >
                    <p
                        className={cn(
                            'text-[28px] font-bold leading-tight',
                            getTrustScoreColor(trustScore),
                        )}
                    >
                        {trustScore}
                    </p>
                    <p className="mt-0.5 text-[11px] text-commons-textMid">
                        Trust score
                    </p>
                </button>
            </div>

            {/* ── SECTION 3 — Community earnings highlight ── */}
            {communityEarned > 0 && (
                <p className="text-[14px] text-commons-success">
                    Your community earned {formatRupeesExact(communityEarned)} across all campaigns
                </p>
            )}
            <Divider className="my-6" />

            {/* ── SECTION 4 — Active campaigns ── */}
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-commons-textMid">
                Active campaigns
            </p>

            {campaignList.length === 0 ? (
                <div className="py-16 text-center">
                    <p className="text-[14px] text-commons-textMid">
                        No active campaigns
                    </p>
                    <p className="mt-1 text-[13px] text-commons-textLight">
                        You'll receive brand invitations here.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-commons-border">
                    {campaignList.map((c) => {
                        const pct = c.target_participants
                            ? Math.round(((c.current_participants ?? 0) / c.target_participants) * 100)
                            : 0;
                        const brandName = (c.brand_profiles as any)?.company_name ?? 'Brand';
                        return (
                            <button
                                key={c.id}
                                onClick={() => navigate(`/creator/campaigns/${c.id}`)}
                                className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-commons-surfaceAlt/40 focus:outline-none"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-[14px] font-medium text-commons-text">
                                            {brandName}
                                        </span>
                                        <Badge variant="neutral">{c.campaign_type ?? 'Campaign'}</Badge>
                                    </div>
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-commons-surfaceAlt">
                                            <div
                                                className="h-full rounded-full bg-commons-brand transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="shrink-0 text-[12px] text-commons-textMid">
                                            {c.current_participants ?? 0}/{c.target_participants ?? 0}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                    <span className="text-[14px] font-semibold text-commons-success">
                                        {formatRupeesExact(c.creator_fee_paise ?? 0)}
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-commons-textLight" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── SECTION 5 — Pending brand offer ── */}
            {firstInvitation && (
                <>
                    <div className="mt-6" />
                    <div className="flex items-center justify-between rounded-md border border-[#F0C9B8] bg-commons-brandTint p-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-[14px] text-commons-text">
                                <span className="font-medium">
                                    {(firstInvitation.campaigns as any)?.brand_profiles?.company_name ?? 'A brand'}
                                </span>{' '}
                                sent you a campaign offer
                            </p>
                            <p className="mt-0.5 text-[13px] text-commons-textMid">
                                {formatRupeesExact((firstInvitation.campaigns as any)?.budget_paise ?? 0)} budget · Your
                                estimated fee: {formatRupeesExact(firstInvitation.creator_fee_paise ?? 0)}
                            </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                            <button
                                onClick={() =>
                                    declineInvitation.mutate(firstInvitation.id, {
                                        onSuccess: () => toast.info('Invitation declined'),
                                        onError: (err: any) => toast.error('Failed to decline', err.message),
                                    })
                                }
                                disabled={declineInvitation.isPending}
                                className="text-[13px] font-medium text-commons-textMid hover:text-commons-text disabled:opacity-50"
                            >
                                {declineInvitation.isPending ? '…' : 'Decline'}
                            </button>
                            <button
                                onClick={() =>
                                    acceptInvitation.mutate(
                                        {
                                            invitationId: firstInvitation.id,
                                            campaignId: (firstInvitation.campaigns as any)?.id,
                                        },
                                        {
                                            onSuccess: () => toast.success('Invitation accepted', 'Campaign added to your dashboard'),
                                            onError: (err: any) => toast.error('Failed to accept', err.message),
                                        }
                                    )
                                }
                                disabled={acceptInvitation.isPending}
                                className="text-[14px] font-medium text-commons-brand hover:text-commons-brandHover disabled:opacity-50"
                            >
                                {acceptInvitation.isPending ? '…' : 'Accept →'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ── Bottom sheet ── */}
            <BottomSheet
                open={sheetKey !== null}
                onClose={() => setSheetKey(null)}
                title={sheetKey ? STAT_EXPLANATIONS[sheetKey].title : ''}
            >
                {sheetKey && <p>{STAT_EXPLANATIONS[sheetKey].body}</p>}
            </BottomSheet>
        </div>
    );
}
