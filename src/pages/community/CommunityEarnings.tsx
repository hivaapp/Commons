import { useState, useMemo } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Divider } from '../../components/ui/Divider';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatRupeesExact, formatRupees } from '../../lib/format';
import { useCommunityEarnings } from '../../hooks/community/useCommunityEarnings';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';

// ---------- Component ----------

export default function CommunityEarnings() {
    const [showAll, setShowAll] = useState(false);
    const { profile, payouts } = useCommunityEarnings();

    const isLoading = profile.isLoading || payouts.isLoading;

    const qualityScore = profile.data?.quality_score ?? 0;
    const totalEarned = profile.data?.total_earned_paise ?? 0;
    const totalTasks = profile.data?.total_tasks_completed ?? 0;

    // Pending balance = sum of pending payouts
    const pendingBalance = useMemo(() => {
        return (payouts.data ?? [])
            .filter((p) => p.status === 'pending' || p.status === 'processing')
            .reduce((sum, p) => sum + (p.amount_paise ?? 0), 0);
    }, [payouts.data]);

    // Monthly chart data from paid payouts
    const chartData = useMemo(() => {
        const grouped: Record<string, number> = {};
        (payouts.data ?? [])
            .filter((p) => p.status === 'paid')
            .forEach((p) => {
                const month = p.created_at.slice(0, 7);
                grouped[month] = (grouped[month] || 0) + (p.amount_paise ?? 0);
            });
        return Object.entries(grouped)
            .map(([month, total]) => ({
                month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short' }),
                amount: total / 100,
            }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6);
    }, [payouts.data]);

    const paidPayouts = (payouts.data ?? []).filter((p) => p.status === 'paid');
    const displayedPayouts = showAll ? paidPayouts : paidPayouts.slice(0, 5);

    if (isLoading) {
        return (
            <div>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="mt-2 h-4 w-24" />
                <div className="mt-6 grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i}>
                            <Skeleton className="h-7 w-16" />
                            <Skeleton className="mt-1 h-3 w-12" />
                        </div>
                    ))}
                </div>
                <Skeleton className="mt-8 h-[160px] w-full" />
            </div>
        );
    }

    return (
        <div>
            {/* ── Quality score ── */}
            <p className="text-[28px] font-bold leading-tight text-commons-text">
                {qualityScore.toFixed(1)}/10
            </p>
            <p className="mt-0.5 text-[11px] text-commons-textMid">Quality score</p>

            {/* ── Stat row ── */}
            <div className="mt-6 grid grid-cols-3 gap-4">
                <div>
                    <p className="text-[22px] font-bold text-commons-success">
                        {formatRupees(pendingBalance)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-commons-textMid">
                        Pending balance
                    </p>
                </div>
                <div>
                    <p className="text-[22px] font-bold text-commons-text">
                        {formatRupees(totalEarned)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-commons-textMid">
                        All-time total
                    </p>
                </div>
                <div>
                    <p className="text-[22px] font-bold text-commons-text">
                        {totalTasks}
                    </p>
                    <p className="mt-0.5 text-[11px] text-commons-textMid">
                        Tasks done
                    </p>
                </div>
            </div>

            {/* ── Monthly chart ── */}
            {chartData.length > 0 && (
                <>
                    <Divider className="my-6" />
                    <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-commons-textMid">
                        Monthly earnings
                    </p>
                    <div className="h-[160px]">
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
                                        '₹' + (value ?? 0).toLocaleString('en-IN'),
                                        'Earned',
                                    ]}
                                />
                                <Bar
                                    dataKey="amount"
                                    fill="#D97757"
                                    radius={[3, 3, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}

            <Divider className="my-6" />

            {/* ── Payout history ── */}
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-commons-textMid">
                Payout history
            </p>

            {paidPayouts.length === 0 ? (
                <p className="py-6 text-center text-[14px] text-commons-textMid">
                    No payouts yet — complete tasks to earn.
                </p>
            ) : (
                <div className="divide-y divide-commons-border">
                    {displayedPayouts.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 py-3">
                            <span className="min-w-0 flex-1 truncate text-[14px] text-commons-text">
                                {(p.campaigns as any)?.title ?? 'Task'}
                            </span>
                            <span className="shrink-0 text-[14px] font-medium text-commons-text">
                                {formatRupeesExact(p.amount_paise ?? 0)}
                            </span>
                            <Badge variant="success">Paid</Badge>
                        </div>
                    ))}
                </div>
            )}

            {!showAll && paidPayouts.length > 5 && (
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
