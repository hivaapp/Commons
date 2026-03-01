import { QueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: (failureCount, error) => {
                // Don't retry on 4xx errors
                if (error && 'status' in error && typeof error.status === 'number') {
                    if (error.status >= 400 && error.status < 500) {
                        return false;
                    }
                }
                return failureCount < 2;
            },
            refetchOnWindowFocus: false,
        },
    },
});

// ---------- Prefetch helpers ----------

/**
 * Prefetch campaign detail on hover.
 * Call this on mouseEnter of campaign cards.
 */
export function prefetchCampaignDetail(campaignId: string) {
    queryClient.prefetchQuery({
        queryKey: ['campaign', campaignId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('campaigns')
                .select(
                    `*, creator_profiles(*), brand_profiles(*)`
                )
                .eq('id', campaignId)
                .single();
            if (error) throw error;
            return data;
        },
        staleTime: 60_000, // 1 minute
    });
}
