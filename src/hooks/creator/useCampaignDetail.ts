import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

/**
 * Campaign detail: full campaign data + tasks list (with polling).
 */
export function useCampaignDetail(campaignId: string | undefined) {
    const campaign = useQuery({
        queryKey: ['campaign', campaignId],
        enabled: !!campaignId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('campaigns')
                .select(`
          *,
          brand_profiles ( id, company_name, company_logo_url, website ),
          creator_profiles ( id, handle, trust_score, activation_rate )
        `)
                .eq('id', campaignId!)
                .single();
            if (error) throw error;
            return data;
        },
    });

    const tasks = useQuery({
        queryKey: ['campaign-tasks', campaignId],
        enabled: !!campaignId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select('id, status, quality_score, time_spent_seconds, submitted_at, rejection_reason')
                .eq('campaign_id', campaignId!)
                .order('submitted_at', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
        refetchInterval: 30_000, // poll every 30s for live updates
    });

    return { campaign, tasks };
}
