import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';

/**
 * Community task history with optional status filter.
 */
export function useCommunityHistory(statusFilter?: string) {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['community-history', user?.id, statusFilter],
        enabled: !!user?.id,
        queryFn: async () => {
            let query = supabase
                .from('tasks')
                .select(`
          id, status, quality_score, time_spent_seconds,
          submitted_at, rejection_reason, rejection_category,
          payout_amount_paise,
          campaigns (
            id, title, campaign_type, per_task_paise,
            brand_profiles ( company_name )
          )
        `)
                .eq('participant_id', user!.id)
                .order('submitted_at', { ascending: false });

            if (statusFilter && statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data ?? [];
        },
    });
}
