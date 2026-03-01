import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';

/**
 * Creator Dashboard data: stats, active campaigns, and pending invitations.
 */
export function useCreatorDashboard() {
    const { user } = useAuthStore();

    // Creator profile stats
    const stats = useQuery({
        queryKey: ['creator-dashboard-stats', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('creator_profiles')
                .select('trust_score, activation_rate, total_earned_paise, total_community_earned_paise')
                .eq('id', user!.id)
                .single();
            if (error) throw error;
            return data;
        },
    });

    // Active campaigns
    const campaigns = useQuery({
        queryKey: ['creator-active-campaigns', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('campaigns')
                .select(`
          id, title, campaign_type, status, budget_paise,
          creator_fee_paise, per_task_paise, target_participants,
          current_participants, accepted_submissions,
          ends_at, created_at,
          brand_profiles ( id, company_name, company_logo_url )
        `)
                .eq('creator_id', user!.id)
                .in('status', ['active', 'paused'])
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });

    // Pending invitations
    const invitations = useQuery({
        queryKey: ['creator-invitations', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('campaign_invitations')
                .select(`
          id, status, match_score, creator_fee_paise, created_at,
          campaigns (
            id, title, campaign_type, budget_paise, per_task_paise,
            target_participants, task_instructions,
            brand_profiles ( company_name, company_logo_url )
          )
        `)
                .eq('creator_id', user!.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });

    return { stats, campaigns, invitations };
}
