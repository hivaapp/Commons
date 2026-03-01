import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';

/**
 * Community Discover: eligible campaigns for the current user.
 * Fetches from campaigns table with client-side type filtering.
 */
export function useCommunityDiscover(filter?: string) {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['community-discover', user?.id, filter],
        enabled: !!user?.id,
        queryFn: async () => {
            // Fetch active campaigns the user hasn't already joined
            const { data: joinedIds } = await supabase
                .from('tasks')
                .select('campaign_id')
                .eq('participant_id', user!.id);

            const joined = new Set((joinedIds ?? []).map((t) => t.campaign_id));

            let query = supabase
                .from('campaigns')
                .select(`
          id, title, campaign_type, status, budget_paise, per_task_paise,
          target_participants, current_participants, task_instructions,
          estimated_minutes, screening_question, screening_category,
          task_min_seconds, ends_at,
          creator_profiles ( id, handle, full_name ),
          brand_profiles ( id, company_name, company_logo_url )
        `)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (filter && filter !== 'all') {
                query = query.eq('campaign_type', filter);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Filter out already-joined campaigns and full campaigns
            return (data ?? []).filter(
                (c) => !joined.has(c.id) && (c.current_participants ?? 0) < (c.target_participants ?? Infinity)
            );
        },
        staleTime: 60_000, // 1 min
    });
}
