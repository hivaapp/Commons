import { useState, useMemo } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Divider } from '../../components/ui/Divider';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatRupeesExact, formatRupees, formatDate } from '../../lib/format';
import { useCreatorEarnings } from '../../hooks/creator/useCreatorEarnings';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';

// ---------- Types ----------

const statusBadge: Record<string, { variant: 'success' | 'warning' | 'neutral'; label: string }> = {
    paid: { variant: 'success', label: 'Paid' },
    pending: { variant: 'warning', label: 'Pending' },
    processing: { variant: 'neutral', label: 'Processing' },
};

// ---------- Component ----------

export default function CreatorEarnings() {
    const [showAll, setShowAll] = useState(false);
    const { payouts, monthlyTotals } = useCreatorEarnings();

    const isLoading = payouts.isLoading || monthlyTotals.isLoading;

    // Chart data from monthly totals
    const chartData = useMemo(() => {
        if (!monthlyTotals.data) return [];
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const months = monthlyTotals.data.map((m) => ({
            month: new Date(m.month + '-01').toLocaleDateString('en-IN', { month: 'short' }),
            amount: m.total / 100, // paise to rupees for chart display
        }));
        return isMobile ? months.slice(-6) : months;
    }, [monthlyTotals.data]);

    const totalEarned = useMemo(() => {
        return (payouts.data ?? [])
            .filter((p) => p.status === 'paid')
            .reduce((sum, p) => sum + (p.amount_paise ?? 0), 0);
    }, [payouts.data]);

    const thisMonthKey = new Date().toISOString().slice(0, 7);
    const thisMonth = monthlyTotals.data?.find((m) => m.month === thisMonthKey)?.total ?? 0;

    // Split payouts into upcoming (pending/processing) and past (paid)
    const upcomingPayouts = (payouts.data ?? []).filter(
        (p) => p.status === 'pending' || p.status === 'processing'
    );
    const pastPayouts = (payouts.data ?? []).filter((p) => p.status === 'paid');
    const displayedHistory = showAll ? pastPayouts : pastPayouts.slice(0, 4);

    if (isLoading) {
        return (
            <div>
                <Skeleton className="h-8 w-40" />
                <Skeleton className="mt-2 h-4 w-28" />
                <Skeleton className="mt-8 h-[160px] w-full" />
                <Divider className="my-6" />
                <Skeleton className="h-3 w-32" />
                {[1, 2].map((i) => <Skeleton key={i} className="mt-3 h-10 w-full" />)}
            </div>
        );
    }

    return (
        <div>
            {/* ── Top stat ── */}
            <p className="text-[28px] font-bold leading-tight text-commons-success">
                {formatRupees(totalEarned)} total earned
            </p>
            <p className="mt-1 text-[14px] text-commons-textMid">
                {formatRupeesExact(thisMonth)} this month
            </p>

            {/* ── Monthly chart ── */}
            {chartData.length > 0 && (
                <div className="mt-8 h-[160px] md:h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barCategoryGap="20%">
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#6B6860' }}
                            />
                            <YAxis hide />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                                contentStyle={{
                                    background: '#fff',
                                    border: '1px solid #E6E2D9',
                                    borderRadius: 6,
                                    fontSize: 13,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                }}
                                formatter={(value: number | undefined) => [
                                    '₹' + (value ?? 0).toLocaleString('en-IN'), 'Earned'
                                ]}
                                labelStyle={{ color: '#21201C', fontWeight: 600 }}
                            />
                            <Bar
                                dataKey="amount"
                                fill="#D97757"
                                radius={[3, 3, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            <Divider className="my-6" />

            {/* ── Upcoming payouts ── */}
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-commons-textMid">
                Upcoming payouts
            </p>

            {upcomingPayouts.length === 0 ? (
                <p className="py-4 text-[14px] text-commons-textMid">
                    No pending payouts.
                </p>
            ) : (
                <div className="divide-y divide-commons-border">
                    {upcomingPayouts.map((p) => (
                        <div
                            key={p.id}
                            className="flex items-center justify-between py-3"
                        >
                            <span className="truncate text-[14px] text-commons-text">
                                {(p.campaigns as any)?.title ?? 'Campaign'}
                            </span>
                            <div className="flex shrink-0 items-center gap-3">
                                <span className="text-[14px] font-semibold text-commons-success">
                                    {formatRupeesExact(p.amount_paise ?? 0)}
                                </span>
                                <Badge variant={statusBadge[p.status]?.variant ?? 'neutral'}>
                                    {statusBadge[p.status]?.label ?? p.status}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Divider className="my-6" />

            {/* ── Past payouts ── */}
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-commons-textMid">
                Past payouts
            </p>

            {pastPayouts.length === 0 ? (
                <p className="py-4 text-[14px] text-commons-textMid">
                    No past payouts yet.
                </p>
            ) : (
                <div className="divide-y divide-commons-border">
                    {displayedHistory.map((p) => {
                        const badge = statusBadge[p.status] ?? statusBadge.paid;
                        return (
                            <div
                                key={p.id}
                                className="flex items-center gap-3 py-3"
                            >
                                <span className="min-w-0 flex-1 truncate text-[14px] text-commons-text">
                                    {(p.campaigns as any)?.title ?? 'Campaign'}
                                </span>
                                <span className="hidden shrink-0 text-[13px] text-commons-textMid sm:block">
                                    {p.completed_at ? formatDate(p.completed_at) : formatDate(p.created_at)}
                                </span>
                                <span className="shrink-0 text-[14px] font-medium text-commons-text">
                                    {formatRupeesExact(p.amount_paise ?? 0)}
                                </span>
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                            </div>
                        );
                    })}
                </div>
            )}

            {!showAll && pastPayouts.length > 4 && (
                <button
                    onClick={() => setShowAll(true)}
                    className="mt-4 w-full py-2 text-center text-[14px] font-medium text-commons-brand hover:text-commons-brandHover"
                >
                    Load more
                </button>
            )}
        </div>
    );
}
