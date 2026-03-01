import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';

/**
 * Brand Dashboard: profile stats + campaign list.
 */
export function useBrandDashboard() {
    const { user } = useAuthStore();

    const stats = useQuery({
        queryKey: ['brand-dashboard-stats', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('brand_profiles')
                .select('total_campaigns, total_spent_paise, reputation_score')
                .eq('id', user!.id)
                .single();
            if (error) throw error;

            // Active campaign count
            const { count } = await supabase
                .from('campaigns')
                .select('id', { count: 'exact', head: true })
                .eq('brand_id', user!.id)
                .eq('status', 'active');

            // Total participants across active campaigns
            const { data: active } = await supabase
                .from('campaigns')
                .select('current_participants')
                .eq('brand_id', user!.id)
                .eq('status', 'active');

            const totalParticipants =
                active?.reduce((sum, c) => sum + (c.current_participants || 0), 0) ?? 0;

            return { ...data, activeCampaigns: count ?? 0, totalParticipants };
        },
    });

    const campaigns = useQuery({
        queryKey: ['brand-campaigns', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('campaigns')
                .select(`
          id, title, campaign_type, status, budget_paise,
          target_participants, current_participants, accepted_submissions,
          ends_at, created_at,
          creator_profiles ( id, handle )
        `)
                .eq('brand_id', user!.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });

    return { stats, campaigns };
}
