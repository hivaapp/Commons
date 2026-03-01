import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';

/**
 * Notifications: list, unread count, mark-read mutations, and realtime subscription.
 */
export function useNotifications() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const notifications = useQuery({
        queryKey: ['notifications', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false })
                .limit(20);
            if (error) throw error;
            return data ?? [];
        },
    });

    // Realtime: invalidate on new notifications
    useEffect(() => {
        if (!user?.id) return;
        const channel = supabase
            .channel(`notifs-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
                }
            )
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, queryClient]);

    const markRead = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', id)
                .eq('user_id', user!.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        },
    });

    const markAllRead = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user!.id)
                .eq('read', false);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        },
    });

    const unreadCount = notifications.data?.filter((n: { read: boolean }) => !n.read).length ?? 0;

    return { notifications, unreadCount, markRead, markAllRead };
}
