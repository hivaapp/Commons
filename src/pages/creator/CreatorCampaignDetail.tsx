import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Divider } from '../../components/ui/Divider';
import { Skeleton } from '../../components/ui/Skeleton';
import { ArrowLeft, Share2, Users, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRupeesExact, formatDuration, formatDate } from '../../lib/format';
import { useCampaignDetail } from '../../hooks/creator/useCampaignDetail';

// ---------- Types ----------

type TabKey = 'overview' | 'participants' | 'share';

const statusBadge: Record<string, { variant: 'success' | 'warning' | 'neutral'; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    paused: { variant: 'warning', label: 'Paused' },
    completed: { variant: 'neutral', label: 'Completed' },
    draft: { variant: 'neutral', label: 'Draft' },
};

const taskStatusMap: Record<string, { variant: 'success' | 'warning' | 'error' | 'neutral'; label: string }> = {
    approved: { variant: 'success', label: 'Approved' },
    submitted: { variant: 'warning', label: 'Pending' },
    rejected: { variant: 'error', label: 'Rejected' },
    in_progress: { variant: 'neutral', label: 'In progress' },
};

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: Clock },
    { key: 'participants', label: 'Participants', icon: Users },
    { key: 'share', label: 'Share', icon: Share2 },
];

// ---------- Component ----------

export default function CreatorCampaignDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabKey>('overview');

    const { campaign, tasks } = useCampaignDetail(id);

    if (campaign.isLoading) {
        return (
            <div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-4 h-6 w-64" />
                <Skeleton className="mt-2 h-4 w-40" />
                <Skeleton className="mt-6 h-40 w-full" />
            </div>
        );
    }

    if (!campaign.data) {
        return (
            <div className="py-16 text-center">
                <p className="text-[14px] text-commons-textMid">Campaign not found</p>
                <button
                    onClick={() => navigate('/creator/campaigns')}
                    className="mt-2 text-[13px] text-commons-brand hover:text-commons-brandHover"
                >
                    Back to campaigns
                </button>
            </div>
        );
    }

    const c = campaign.data;
    const taskList = tasks.data ?? [];
    const badge = statusBadge[c.status ?? 'draft'] ?? statusBadge.draft;
    const brandName = (c.brand_profiles as any)?.company_name ?? 'Brand';
    const participants = c.current_participants ?? 0;
    const target = c.target_participants ?? 0;
    const pct = target > 0 ? Math.round((participants / target) * 100) : 0;

    // Stats
    const approvedCount = taskList.filter((t) => t.status === 'approved').length;
    const pendingCount = taskList.filter((t) => t.status === 'submitted').length;
    const rejectedCount = taskList.filter((t) => t.status === 'rejected').length;
    const inProgressCount = taskList.filter((t) => t.status === 'in_progress').length;

    const avgQuality =
        taskList.filter((t) => t.quality_score != null).length > 0
            ? (
                taskList
                    .filter((t) => t.quality_score != null)
                    .reduce((sum, t) => sum + (t.quality_score ?? 0), 0) /
                taskList.filter((t) => t.quality_score != null).length
            ).toFixed(1)
            : '—';

    const daysLeft = c.ends_at
        ? Math.max(0, Math.ceil((new Date(c.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    return (
        <div>
            {/* Back */}
            <button
                onClick={() => navigate('/creator/campaigns')}
                className="mb-4 flex items-center gap-1 text-[13px] text-commons-textMid hover:text-commons-text"
            >
                <ArrowLeft className="h-4 w-4" />
                Campaigns
            </button>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-[20px] font-bold text-commons-text">{c.title}</h1>
                    <div className="mt-1 flex items-center gap-2 text-[14px] text-commons-textMid">
                        <span>{brandName}</span>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                </div>
            </div>

            {/* Key stats */}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-commons-textMid">
                <span>
                    <span className="font-medium text-commons-text">{formatRupeesExact(c.budget_paise ?? 0)}</span> budget
                </span>
                <span>
                    <span className="font-medium text-commons-text">{participants}/{target}</span> participants
                </span>
                <span>
                    <span className="font-medium text-commons-text">{avgQuality}</span> avg quality
                </span>
                {daysLeft !== null && (
                    <span>
                        <span className="font-medium text-commons-text">{daysLeft} day{daysLeft !== 1 ? 's' : ''}</span> left
                    </span>
                )}
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-commons-surfaceAlt">
                <div
                    className="h-full rounded-full bg-commons-brand transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>

            {/* Tabs */}
            <div className="mt-6 flex gap-5 border-b border-commons-border">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'border-b-2 pb-2.5 text-[13px] font-medium transition-colors focus:outline-none',
                            activeTab === tab.key
                                ? 'border-commons-brand text-commons-brand'
                                : 'border-transparent text-commons-textMid hover:text-commons-text',
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="mt-5">
                {activeTab === 'overview' && (
                    <div>
                        {c.description && (
                            <>
                                <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-commons-textMid">Brief</p>
                                <p className="text-[14px] leading-relaxed text-commons-text">{c.description}</p>
                                <Divider className="my-5" />
                            </>
                        )}

                        {c.task_instructions && (
                            <>
                                <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-commons-textMid">Task instructions</p>
                                <p className="text-[14px] leading-relaxed text-commons-text">{c.task_instructions}</p>
                                <Divider className="my-5" />
                            </>
                        )}

                        {/* Settings */}
                        <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-commons-textMid">Settings</p>
                        <div className="space-y-2">
                            {[
                                { label: 'Campaign type', value: c.campaign_type ?? '—' },
                                { label: 'Per task', value: formatRupeesExact(c.per_task_paise ?? 0) },
                                { label: 'Estimated time', value: c.task_duration_minutes ? `${c.task_duration_minutes} min` : '—' },
                                { label: 'Ends', value: c.ends_at ? formatDate(c.ends_at) : '—' },
                            ].map((row) => (
                                <div key={row.label} className="flex items-center justify-between">
                                    <span className="text-[14px] text-commons-textMid">{row.label}</span>
                                    <span className="text-[14px] text-commons-text">{row.value}</span>
                                </div>
                            ))}
                        </div>

                        <Divider className="my-5" />

                        {/* Status breakdown */}
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { label: 'Approved', value: approvedCount, color: 'text-commons-success' },
                                { label: 'Pending', value: pendingCount, color: 'text-commons-warning' },
                                { label: 'Rejected', value: rejectedCount, color: 'text-commons-error' },
                                { label: 'In progress', value: inProgressCount, color: 'text-commons-textMid' },
                            ].map((s) => (
                                <div key={s.label} className="text-left">
                                    <p className={cn('text-[28px] font-bold leading-tight', s.color)}>{s.value}</p>
                                    <p className="mt-0.5 text-[11px] text-commons-textMid">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'participants' && (
                    <div>
                        <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-commons-textMid">
                            Submissions ({taskList.length})
                        </p>
                        {taskList.length === 0 ? (
                            <p className="py-8 text-center text-[14px] text-commons-textMid">No submissions yet</p>
                        ) : (
                            <div className="divide-y divide-commons-border">
                                {taskList.map((t, i) => {
                                    const tBadge = taskStatusMap[t.status ?? 'in_progress'] ?? taskStatusMap.in_progress;
                                    return (
                                        <div key={t.id} className="flex items-center gap-3 py-3">
                                            <span className="min-w-0 flex-1 truncate text-[14px] text-commons-text">
                                                Participant #{(taskList.length - i).toString().padStart(4, '0')}
                                            </span>
                                            <Badge variant={tBadge.variant}>{tBadge.label}</Badge>
                                            <span className="w-12 text-right text-[13px] text-commons-textMid">
                                                {t.quality_score != null ? t.quality_score.toFixed(2) : '—'}
                                            </span>
                                            <span className="w-14 text-right text-[13px] text-commons-textLight">
                                                {t.time_spent_seconds ? formatDuration(t.time_spent_seconds) : '—'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'share' && (
                    <div className="py-6 text-center">
                        <p className="text-[14px] text-commons-textMid">Share this campaign with your community</p>
                        <div className="mx-auto mt-4 max-w-[320px] space-y-2">
                            <Button
                                variant="secondary"
                                fullWidth
                                className="gap-2"
                                onClick={() => {
                                    const url = `${window.location.origin}/join/${c.id}`;
                                    navigator.clipboard.writeText(url);
                                }}
                            >
                                <Share2 className="h-4 w-4" />
                                Copy invite link
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
