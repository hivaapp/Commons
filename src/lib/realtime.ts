import { supabase } from './supabase';

// ---------- Types ----------

export interface Notification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    body: string;
    data: Record<string, unknown>;
    read: boolean;
    created_at: string;
}

// ---------- Task count subscription ----------

export function subscribeToTaskCount(
    campaignId: string,
    onUpdate: (count: number) => void
) {
    return supabase
        .channel(`campaign-tasks-${campaignId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'tasks',
                filter: `campaign_id=eq.${campaignId}`,
            },
            () => {
                // Re-fetch count on any change
                supabase
                    .from('tasks')
                    .select('id', { count: 'exact' })
                    .eq('campaign_id', campaignId)
                    .eq('status', 'submitted')
                    .then(({ count }) => onUpdate(count ?? 0));
            }
        )
        .subscribe();
}

// ---------- Campaign participant subscription ----------

export function subscribeToCampaignParticipants(
    campaignId: string,
    onUpdate: (count: number) => void
) {
    return supabase
        .channel(`campaign-participants-${campaignId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'tasks',
                filter: `campaign_id=eq.${campaignId}`,
            },
            () => {
                supabase
                    .from('tasks')
                    .select('id', { count: 'exact' })
                    .eq('campaign_id', campaignId)
                    .then(({ count }) => onUpdate(count ?? 0));
            }
        )
        .subscribe();
}

// ---------- Notification subscription ----------

export function subscribeToNotifications(
    userId: string,
    onNotification: (n: Notification) => void
) {
    return supabase
        .channel(`notifications-${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`,
            },
            (payload) => onNotification(payload.new as Notification)
        )
        .subscribe();
}

// ---------- Campaign status subscription ----------

export function subscribeToCampaignStatus(
    campaignId: string,
    onUpdate: (status: string) => void
) {
    return supabase
        .channel(`campaign-status-${campaignId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'campaigns',
                filter: `id=eq.${campaignId}`,
            },
            (payload) => {
                const newStatus = (payload.new as { status: string }).status;
                onUpdate(newStatus);
            }
        )
        .subscribe();
}
