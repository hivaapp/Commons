import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Divider } from '../../components/ui/Divider';
import { Skeleton } from '../../components/ui/Skeleton';
import { ArrowLeft, Download, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRupeesExact, formatDuration, formatDate } from '../../lib/format';
import { useCampaignDetail } from '../../hooks/creator/useCampaignDetail';
import { useUpdateCampaignStatus } from '../../hooks/brand/useBrandMutations';
import { useToast } from '../../components/ui/ToastProvider';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

// ---------- Types ----------

type TabKey = 'overview' | 'results' | 'insights' | 'billing';

const statusBadgeMap: Record<string, { variant: 'success' | 'warning' | 'error' | 'neutral'; label: string }> = {
    approved: { variant: 'success', label: 'Approved' },
    pending_review: { variant: 'warning', label: 'Pending' },
    rejected: { variant: 'error', label: 'Rejected' },
    in_progress: { variant: 'neutral', label: 'In progress' },
};

const campaignStatusMap: Record<string, { variant: 'success' | 'warning' | 'neutral'; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    pending_review: { variant: 'warning', label: 'Pending review' },
    completed: { variant: 'neutral', label: 'Completed' },
    draft: { variant: 'neutral', label: 'Draft' },
    paused: { variant: 'warning', label: 'Paused' },
};

const TABS: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'results', label: 'Live Results' },
    { key: 'insights', label: 'Insights' },
    { key: 'billing', label: 'Billing' },
];

// ---------- Sub-components ----------

function OverviewTabContent({ campaign }: { campaign: any }) {
    const c = campaign;
    return (
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

            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-commons-textMid">Settings</p>
            <div className="space-y-2">
                {[
                    { label: 'Campaign type', value: c.campaign_type ?? '—' },
                    { label: 'Per task reward', value: formatRupeesExact(c.per_task_paise ?? 0) },
                    { label: 'Estimated time', value: c.estimated_minutes ? `${c.estimated_minutes} min` : '—' },
                    { label: 'Ends', value: c.ends_at ? formatDate(c.ends_at) : '—' },
                ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                        <span className="text-[14px] text-commons-textMid">{row.label}</span>
                        <span className="text-[14px] text-commons-text">{row.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LiveResultsTabContent({ campaign, tasks }: { campaign: any; tasks: any[] }) {
    const c = campaign;
    const participants = c.current_participants ?? 0;
    const target = c.target_participants ?? 0;
    const pct = target > 0 ? Math.round((participants / target) * 100) : 0;

    const approvedCount = tasks.filter((t) => t.status === 'approved').length;
    const pendingCount = tasks.filter((t) => t.status === 'pending_review').length;
    const rejectedCount = tasks.filter((t) => t.status === 'rejected').length;
    const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;

    // Simple hourly chart from task submission times
    const chartData = useMemo(() => {
        const data: { time: string; submissions: number }[] = [];
        const now = new Date();
        for (let i = 23; i >= 0; i--) {
            const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
            const label = hour.getHours().toString().padStart(2, '0') + ':00';
            const count = tasks.filter((t) => {
                if (!t.submitted_at) return false;
                const tDate = new Date(t.submitted_at);
                return tDate.getHours() === hour.getHours() &&
                    tDate.toDateString() === hour.toDateString();
            }).length;
            data.push({ time: label, submissions: count });
        }
        return data;
    }, [tasks]);

    return (
        <div>
            {/* Participant count */}
            <div className="mb-4">
                <p className="text-[28px] font-bold text-commons-text">
                    {participants} <span className="text-[16px] font-normal text-commons-textMid">of {target}</span>
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-commons-surfaceAlt">
                    <div
                        className="h-full rounded-full bg-commons-brand transition-all duration-500"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            {/* Area chart */}
            <div className="mb-6 mt-6">
                <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-commons-textMid">
                    Submissions per hour (last 24hrs)
                </p>
                <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="fillBrand" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D97757" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#D97757" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="time"
                            tick={{ fontSize: 11, fill: '#AAA49C' }}
                            axisLine={false}
                            tickLine={false}
                            interval={5}
                        />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{
                                background: '#fff',
                                border: '1px solid #E6E2D9',
                                borderRadius: 6,
                                fontSize: 12,
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="submissions"
                            stroke="#D97757"
                            strokeWidth={2}
                            fill="url(#fillBrand)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Status breakdown */}
            <div className="mb-6 grid grid-cols-4 gap-4">
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

            <Divider className="my-5" />

            {/* Submissions list */}
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-commons-textMid">
                Submissions
            </p>
            {tasks.length === 0 ? (
                <p className="py-6 text-center text-[14px] text-commons-textMid">No submissions yet</p>
            ) : (
                <div className="divide-y divide-commons-border">
                    {tasks.map((s, i) => {
                        const badge = statusBadgeMap[s.status] ?? statusBadgeMap.in_progress;
                        return (
                            <div key={s.id} className="flex items-center gap-3 py-3">
                                <span className="min-w-0 flex-1 truncate text-[14px] text-commons-text">
                                    Participant #{(tasks.length - i).toString().padStart(4, '0')}
                                </span>
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                                <span className="w-12 text-right text-[13px] text-commons-textMid">
                                    {s.quality_score != null ? s.quality_score.toFixed(2) : '—'}
                                </span>
                                <span className="w-14 text-right text-[13px] text-commons-textLight">
                                    {s.time_spent_seconds ? formatDuration(s.time_spent_seconds) : '—'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function InsightsTabContent({ campaign, tasks }: { campaign: any; tasks: any[] }) {
    const participants = campaign.current_participants ?? 0;
    const qualityTasks = tasks.filter((t) => t.quality_score != null);
    const avgQuality = qualityTasks.length > 0
        ? (qualityTasks.reduce((s, t) => s + t.quality_score, 0) / qualityTasks.length).toFixed(1)
        : '—';

    const timeTasks = tasks.filter((t) => t.time_spent_seconds != null);
    const avgSeconds = timeTasks.length > 0
        ? Math.round(timeTasks.reduce((s, t) => s + t.time_spent_seconds, 0) / timeTasks.length)
        : 0;

    return (
        <div>
            <div className="py-10 text-center">
                <p className="text-[16px] font-semibold text-commons-text">
                    {campaign.status === 'completed' ? 'Campaign complete' : 'Campaign in progress'} — {participants} participants
                </p>
                <div className="mx-auto mt-6 max-w-[280px] space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[14px] text-commons-textMid">Average quality score</span>
                        <span className="text-[14px] font-semibold text-commons-text">{avgQuality}/10</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[14px] text-commons-textMid">Average time spent</span>
                        <span className="text-[14px] font-semibold text-commons-text">
                            {avgSeconds > 0 ? formatDuration(avgSeconds) : '—'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-2 space-y-2">
                <Button variant="secondary" fullWidth className="gap-2">
                    <Download className="h-4 w-4" />
                    Export responses CSV
                </Button>
                <Button variant="secondary" fullWidth className="gap-2">
                    <Download className="h-4 w-4" />
                    Download report PDF
                </Button>
            </div>
        </div>
    );
}

function BillingTabContent({ campaign }: { campaign: any }) {
    const budget = campaign.budget_paise ?? 0;
    const community = Math.round(budget * 0.64);
    const creator = Math.round(budget * 0.24);
    const platform = budget - community - creator;

    return (
        <div>
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-commons-textMid">
                Budget breakdown
            </p>
            <div className="space-y-2">
                {[
                    { label: 'Community payouts', value: formatRupeesExact(community), pct: '64%' },
                    { label: 'Creator fee', value: formatRupeesExact(creator), pct: '24%' },
                    { label: 'Platform fee', value: formatRupeesExact(platform), pct: '12%' },
                ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                        <span className="text-[14px] text-commons-textMid">{row.label}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-[14px] text-commons-text">{row.value}</span>
                            <span className="w-8 text-right text-[12px] text-commons-textLight">({row.pct})</span>
                        </div>
                    </div>
                ))}

                <div className="my-2 border-t border-commons-textLight/30" />

                <div className="flex items-center justify-between">
                    <span className="text-[14px] font-semibold text-commons-text">Total</span>
                    <span className="text-[14px] font-semibold text-commons-text">{formatRupeesExact(budget)}</span>
                </div>
            </div>

            <Divider className="my-5" />

            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-commons-textMid">
                Payment status
            </p>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[14px] text-commons-textMid">Escrow deposit</span>
                    <Badge variant="success">Paid</Badge>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[14px] text-commons-textMid">Creator payout</span>
                    <Badge variant="warning">Pending</Badge>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[14px] text-commons-textMid">Community payouts</span>
                    <Badge variant="warning">In progress</Badge>
                </div>
            </div>
        </div>
    );
}

// ---------- Dispute Modal ----------

function DisputeModal({ open, onClose, tasks }: { open: boolean; onClose: () => void; tasks: any[] }) {
    const [reason, setReason] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const approvedTasks = tasks.filter((t) => t.status === 'approved');
    const maxDisputable = Math.floor(approvedTasks.length * 0.1) || 1;

    if (!open) return null;

    const toggle = (id: string) => {
        setSelected((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : prev.length < maxDisputable
                    ? [...prev, id]
                    : prev,
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />
            <div className="relative w-full max-w-[440px] animate-slide-up rounded-xl bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-commons-text">Dispute submissions</h3>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-commons-textMid hover:bg-commons-surfaceAlt"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <p className="mb-3 text-[13px] text-commons-textMid">
                    Select up to {maxDisputable} submission(s) to flag.
                </p>

                <div className="max-h-[200px] divide-y divide-commons-border overflow-y-auto">
                    {approvedTasks.map((s, i) => (
                        <label key={s.id} className="flex cursor-pointer items-center gap-2 py-2">
                            <input
                                type="checkbox"
                                checked={selected.includes(s.id)}
                                onChange={() => toggle(s.id)}
                                className="h-4 w-4 rounded border-commons-border text-commons-brand focus:ring-commons-brand"
                            />
                            <span className="text-[13px] text-commons-text">
                                Participant #{(approvedTasks.length - i).toString().padStart(4, '0')}
                            </span>
                        </label>
                    ))}
                </div>

                <div className="mt-3">
                    <label className="mb-1 block text-[12px] text-commons-textMid">Reason</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        placeholder="Explain why you're disputing these submissions..."
                        className="w-full rounded-md border border-commons-border bg-white px-3 py-2 text-[14px] placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                    />
                </div>

                <Button fullWidth className="mt-3" disabled={selected.length === 0 || !reason.trim()}>
                    Submit dispute
                </Button>
            </div>
        </div>
    );
}

// ---------- Main ----------

export default function BrandCampaignDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabKey>('overview');
    const [showDispute, setShowDispute] = useState(false);

    const { campaign, tasks } = useCampaignDetail(id);
    const updateStatus = useUpdateCampaignStatus();
    const toast = useToast();

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
                    onClick={() => navigate('/brand/campaigns')}
                    className="mt-2 text-[13px] text-commons-brand hover:text-commons-brandHover"
                >
                    Back to campaigns
                </button>
            </div>
        );
    }

    const c = campaign.data;
    const taskList = tasks.data ?? [];
    const status = campaignStatusMap[c.status] ?? campaignStatusMap.active;
    const creatorHandle = (c.creator_profiles as any)?.handle ?? '';

    const daysLeft = c.ends_at
        ? Math.max(0, Math.ceil((new Date(c.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    const avgQuality = (() => {
        const qt = taskList.filter((t) => t.quality_score != null);
        return qt.length > 0
            ? (qt.reduce((s, t) => s + t.quality_score!, 0) / qt.length).toFixed(1)
            : '—';
    })();

    return (
        <div>
            {/* Back */}
            <button
                onClick={() => navigate('/brand/campaigns')}
                className="mb-4 flex items-center gap-1 text-[13px] text-commons-textMid hover:text-commons-text"
            >
                <ArrowLeft className="h-4 w-4" />
                Campaigns
            </button>

            {/* Header */}
            <h1 className="text-[20px] font-bold text-commons-text">{c.title}</h1>
            <div className="mt-1 flex items-center gap-2">
                {creatorHandle && <span className="text-[14px] text-commons-textMid">@{creatorHandle}</span>}
                <Badge variant={status.variant}>{status.label}</Badge>
            </div>

            {/* Pause / Resume */}
            {(c.status === 'active' || c.status === 'paused') && (
                <button
                    onClick={() => {
                        const newStatus = c.status === 'active' ? 'paused' : 'active';
                        updateStatus.mutate(
                            { campaignId: c.id, status: newStatus },
                            {
                                onSuccess: () => toast.success('Campaign updated'),
                                onError: (err: any) => toast.error('Update failed', err?.message ?? 'Please try again'),
                            },
                        );
                    }}
                    disabled={updateStatus.isPending}
                    className="mt-2 text-[13px] font-medium text-commons-brand hover:text-commons-brandHover disabled:opacity-50"
                >
                    {updateStatus.isPending
                        ? 'Updating…'
                        : c.status === 'active'
                            ? 'Pause campaign'
                            : 'Resume campaign'}
                </button>
            )}

            {/* Key stats inline */}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-commons-textMid">
                <span>
                    <span className="font-medium text-commons-text">{formatRupeesExact(c.budget_paise ?? 0)}</span> budget
                </span>
                <span>
                    <span className="font-medium text-commons-text">{c.current_participants ?? 0}/{c.target_participants ?? 0}</span> participants
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

            {/* Tab bar */}
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
                {activeTab === 'overview' && <OverviewTabContent campaign={c} />}
                {activeTab === 'results' && <LiveResultsTabContent campaign={c} tasks={taskList} />}
                {activeTab === 'insights' && (
                    <div>
                        <InsightsTabContent campaign={c} tasks={taskList} />
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => setShowDispute(true)}
                                className="text-[13px] text-commons-textMid hover:text-commons-text"
                            >
                                Dispute submissions
                            </button>
                        </div>
                    </div>
                )}
                {activeTab === 'billing' && <BillingTabContent campaign={c} />}
            </div>

            {/* Dispute modal */}
            <DisputeModal open={showDispute} onClose={() => setShowDispute(false)} tasks={taskList} />
        </div>
    );
}
