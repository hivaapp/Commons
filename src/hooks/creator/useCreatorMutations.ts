import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';

/**
 * Accept a brand invitation.
 */
export function useAcceptInvitation() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async ({ invitationId, campaignId }: { invitationId: string; campaignId: string }) => {
            const { error: invErr } = await supabase
                .from('campaign_invitations')
                .update({ status: 'accepted', responded_at: new Date().toISOString() })
                .eq('id', invitationId);
            if (invErr) throw invErr;

            const { error: campErr } = await supabase
                .from('campaigns')
                .update({ creator_id: user!.id })
                .eq('id', campaignId);
            if (campErr) throw campErr;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['creator-invitations'] });
            queryClient.invalidateQueries({ queryKey: ['creator-active-campaigns'] });
        },
    });
}

/**
 * Decline a brand invitation.
 */
export function useDeclineInvitation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (invitationId: string) => {
            const { error } = await supabase
                .from('campaign_invitations')
                .update({ status: 'declined', responded_at: new Date().toISOString() })
                .eq('id', invitationId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['creator-invitations'] });
        },
    });
}

/**
 * Update creator profile (autosave on blur).
 */
export function useUpdateCreatorProfile() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    return useMutation({
        mutationFn: async (updates: Record<string, unknown>) => {
            const { error } = await supabase
                .from('creator_profiles')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', user!.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['creator-dashboard-stats'] });
        },
    });
}
