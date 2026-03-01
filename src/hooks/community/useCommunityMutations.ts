import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';

/**
 * Join a campaign (creates a task row).
 */
export function useJoinCampaign() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (campaignId: string) => {
            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    campaign_id: campaignId,
                    participant_id: user!.id,
                    status: 'in_progress',
                    started_at: new Date().toISOString(),
                })
                .select()
                .single();
            if (error) throw error;

            // Increment campaign participant count
            await supabase.rpc('increment_campaign_participants', { p_campaign_id: campaignId });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-discover'] });
        },
    });
}

/**
 * Submit a completed task.
 */
export function useSubmitTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            taskId,
            responses,
            timeSpentSeconds,
            proofUrls,
        }: {
            taskId: string;
            responses: Record<string, string | number | boolean | null>;
            timeSpentSeconds: number;
            proofUrls?: string[];
        }) => {
            // Update task with submission data
            const { data, error } = await supabase
                .from('tasks')
                .update({
                    status: 'submitted',
                    responses,
                    time_spent_seconds: timeSpentSeconds,
                    proof_urls: proofUrls ?? [],
                    submitted_at: new Date().toISOString(),
                })
                .eq('id', taskId)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-history'] });
            queryClient.invalidateQueries({ queryKey: ['community-discover'] });
        },
    });
}

/**
 * Update community profile settings (UPI, bank, preferences).
 */
export function useUpdateCommunityProfile() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (updates: Record<string, unknown>) => {
            const { error } = await supabase
                .from('community_profiles')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', user!.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-profile'] });
        },
    });
}
