import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';

/**
 * Save a campaign draft (create or update).
 */
export function useSaveCampaignDraft() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (data: Record<string, unknown> & { id?: string }) => {
            if (data.id) {
                // Update existing draft
                const { data: updated, error } = await supabase
                    .from('campaigns')
                    .update({ ...data, updated_at: new Date().toISOString() })
                    .eq('id', data.id)
                    .eq('brand_id', user!.id)
                    .select()
                    .single();
                if (error) throw error;
                return updated;
            } else {
                // Create new draft
                const { data: created, error } = await supabase
                    .from('campaigns')
                    .insert({ ...data, brand_id: user!.id, status: 'draft' })
                    .select()
                    .single();
                if (error) throw error;
                return created;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brand-campaigns', user?.id] });
        },
    });
}

/**
 * Invite a creator to a campaign.
 */
export function useInviteCreator() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            campaignId,
            creatorId,
            matchScore,
        }: {
            campaignId: string;
            creatorId: string;
            matchScore: number;
        }) => {
            const { data: creator } = await supabase
                .from('creator_profiles')
                .select('tier')
                .eq('id', creatorId)
                .single();

            const feeRate =
                creator?.tier === 'premier' ? 0.28 : creator?.tier === 'established' ? 0.24 : 0.2;

            const { data: campaign } = await supabase
                .from('campaigns')
                .select('budget_paise')
                .eq('id', campaignId)
                .single();

            const creatorFeePaise = Math.round((campaign?.budget_paise ?? 0) * feeRate);

            const { error } = await supabase.from('campaign_invitations').insert({
                campaign_id: campaignId,
                creator_id: creatorId,
                match_score: matchScore,
                creator_fee_paise: creatorFeePaise,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brand-campaigns'] });
        },
    });
}

/**
 * Update campaign status (pause / resume).
 */
export function useUpdateCampaignStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ campaignId, status }: { campaignId: string; status: string }) => {
            const { error } = await supabase
                .from('campaigns')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', campaignId);
            if (error) throw error;
        },
        onSuccess: (_: unknown, { campaignId }: { campaignId: string; status: string }) => {
            queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
            queryClient.invalidateQueries({ queryKey: ['brand-campaigns'] });
        },
    });
}
