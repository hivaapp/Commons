import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';

/**
 * Creator Earnings: payouts list + monthly totals for charting.
 */
export function useCreatorEarnings() {
    const { user } = useAuthStore();

    const payouts = useQuery({
        queryKey: ['creator-payouts', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('payouts')
                .select(`
          id, amount_paise, status, created_at, completed_at,
          stripe_transfer_id,
          campaigns ( id, title )
        `)
                .eq('recipient_id', user!.id)
                .eq('recipient_role', 'creator')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });

    // Monthly totals derived from payouts (last 12 months)
    const monthlyTotals = useQuery({
        queryKey: ['creator-monthly-totals', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('payouts')
                .select('amount_paise, created_at, status')
                .eq('recipient_id', user!.id)
                .eq('recipient_role', 'creator')
                .eq('status', 'paid')
                .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
            if (error) throw error;

            // Group by month
            const grouped: Record<string, number> = {};
            data?.forEach((p) => {
                const month = p.created_at.slice(0, 7); // "2024-03"
                grouped[month] = (grouped[month] || 0) + p.amount_paise;
            });
            return Object.entries(grouped)
                .map(([month, total]) => ({ month, total }))
                .sort((a, b) => a.month.localeCompare(b.month))
                .slice(-12);
        },
    });

    return { payouts, monthlyTotals };
}
