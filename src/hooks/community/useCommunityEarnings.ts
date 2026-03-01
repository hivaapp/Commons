import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';

/**
 * Community Earnings: profile stats (quality score, totals) + payout history.
 */
export function useCommunityEarnings() {
    const { user } = useAuthStore();

    const profile = useQuery({
        queryKey: ['community-profile', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('community_profiles')
                .select('quality_score, total_earned_paise, total_tasks_completed, consecutive_accepted')
                .eq('id', user!.id)
                .single();
            if (error) throw error;
            return data;
        },
    });

    const payouts = useQuery({
        queryKey: ['community-payouts', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('payouts')
                .select(`
          id, amount_paise, status, created_at, completed_at, failure_reason,
          campaigns ( id, title )
        `)
                .eq('recipient_id', user!.id)
                .eq('recipient_role', 'community')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });

    return { profile, payouts };
}
