import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import type { Database } from '../../lib/database.types';

type CampaignType = Database['public']['Enums']['campaign_type'];

/**
 * Community Discover: eligible campaigns for the current user.
 * Uses the SECURITY DEFINER RPC `get_community_discover_campaigns`
 * which bypasses RLS to properly filter campaigns (handles banned users,
 * blocked brands/categories, already-joined campaigns, and capacity).
 */
export function useCommunityDiscover(filter?: CampaignType) {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['community-discover', user?.id, filter],
        enabled: !!user?.id,
        queryFn: async () => {
            // Use the RPC that handles all filtering server-side
            const { data, error } = await supabase
                .rpc('get_community_discover_campaigns', {
                    p_participant_id: user!.id,
                });
            if (error) throw error;

            let campaigns = data ?? [];

            // Apply client-side type filter if specified
            if (filter) {
                campaigns = campaigns.filter((c) => c.campaign_type === filter);
            }

            // Fetch brand/creator names for the filtered campaigns
            // Since the RPC returns raw campaign rows, we need to join brand info
            const brandIds = [...new Set(campaigns.map((c) => c.brand_id).filter(Boolean))];
            const creatorIds = [...new Set(campaigns.map((c) => c.creator_id).filter(Boolean))] as string[];

            const [brandsResult, creatorsResult] = await Promise.all([
                brandIds.length > 0
                    ? supabase
                        .from('brand_profiles')
                        .select('id, company_name, company_logo_url')
                        .in('id', brandIds)
                    : { data: [] },
                creatorIds.length > 0
                    ? supabase
                        .from('creator_profiles')
                        .select('id, handle')
                        .in('id', creatorIds)
                    : { data: [] },
            ]);

            const brandMap = new Map(
                (brandsResult.data ?? []).map((b: any) => [b.id, b]),
            );
            const creatorMap = new Map(
                (creatorsResult.data ?? []).map((c: any) => [c.id, c]),
            );

            // Merge brand/creator info into campaign objects
            return campaigns.map((c) => ({
                ...c,
                brand_profiles: brandMap.get(c.brand_id) ?? null,
                creator_profiles: c.creator_id ? creatorMap.get(c.creator_id) ?? null : null,
            }));
        },
        staleTime: 60_000, // 1 min
    });
}
