import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

// ---------- Notification type config ----------

const NOTIF_CONFIG: Record<string, { emoji: string; color: string }> = {
    campaign_new_invitation: { emoji: '🏢', color: 'bg-[#EEF2FF]' },
    campaign_participant_joined: { emoji: '👥', color: 'bg-commons-successBg' },
    campaign_goal_reached: { emoji: '🎯', color: 'bg-commons-warningBg' },
    task_approved: { emoji: '✅', color: 'bg-commons-successBg' },
    task_rejected: { emoji: '❌', color: 'bg-commons-errorBg' },
    payout_sent: { emoji: '💸', color: 'bg-commons-successBg' },
    campaign_going_live: { emoji: '🚀', color: 'bg-[#EEF2FF]' },
    quality_score_change: { emoji: '📊', color: 'bg-commons-warningBg' },
};

function getNotifConfig(type: string) {
    return NOTIF_CONFIG[type] ?? { emoji: '🔔', color: 'bg-commons-surfaceAlt' };
}

// ---------- Component ----------

export function NotificationCenter() {
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { notifications, unreadCount, markRead, markAllRead } =
        useNotifications();

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open]);

    const handleNotifClick = useCallback(
        (id: string) => {
            markRead.mutate(id);
        },
        [markRead]
    );

    const items = notifications.data ?? [];

    return (
        <div className="relative">
            {/* Bell button */}
            <button
                ref={buttonRef}
                onClick={() => setOpen((v) => !v)}
                className="relative flex h-10 w-10 items-center justify-center rounded-md text-commons-textMid transition-colors hover:text-commons-text focus:outline-none focus-visible:ring-2 focus-visible:ring-commons-brand"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={open}
                aria-haspopup="true"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-commons-brand px-1 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Panel */}
            {open && (
                <div
                    ref={panelRef}
                    className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[calc(100vw-32px)] animate-slide-down rounded-lg border border-commons-border bg-white shadow-sm"
                    role="dialog"
                    aria-label="Notifications"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-commons-border px-4 py-3">
                        <h3 className="text-sm font-semibold text-commons-text">
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllRead.mutate()}
                                disabled={markAllRead.isPending}
                                className="flex items-center gap-1 text-[12px] text-commons-brand hover:text-commons-brandHover transition-colors disabled:opacity-50"
                            >
                                <Check className="h-3 w-3" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {items.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <Bell className="mx-auto h-8 w-8 text-commons-textLight" />
                                <p className="mt-2 text-[13px] text-commons-textMid">
                                    No notifications yet
                                </p>
                            </div>
                        ) : (
                            <ul role="list">
                                {items.map((n: {
                                    id: string;
                                    type: string | null;
                                    title: string | null;
                                    body: string | null;
                                    read: boolean | null;
                                    data: Record<string, unknown> | null;
                                    created_at: string | null;
                                }) => {
                                    const config = getNotifConfig(n.type ?? '');
                                    const isRead = n.read ?? false;

                                    return (
                                        <li key={n.id}>
                                            <button
                                                onClick={() => handleNotifClick(n.id)}
                                                className={cn(
                                                    'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-commons-surfaceAlt',
                                                    !isRead && 'bg-commons-brandTint/40'
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm',
                                                        config.color
                                                    )}
                                                    aria-hidden="true"
                                                >
                                                    {config.emoji}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p
                                                        className={cn(
                                                            'text-[13px] text-commons-text',
                                                            !isRead && 'font-medium'
                                                        )}
                                                    >
                                                        {n.title}
                                                    </p>
                                                    {n.body && (
                                                        <p className="mt-0.5 line-clamp-2 text-[12px] text-commons-textMid">
                                                            {n.body}
                                                        </p>
                                                    )}
                                                    <p className="mt-1 text-[11px] text-commons-textLight">
                                                        {n.created_at
                                                            ? formatDistanceToNow(new Date(n.created_at), {
                                                                addSuffix: true,
                                                            })
                                                            : ''}
                                                    </p>
                                                </div>
                                                {!isRead && (
                                                    <span
                                                        className="mt-2 h-2 w-2 shrink-0 rounded-full bg-commons-brand"
                                                        aria-label="Unread"
                                                    />
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                        <div className="border-t border-commons-border px-4 py-2">
                            <button className="flex w-full items-center justify-center gap-1 py-1 text-[12px] text-commons-textMid hover:text-commons-text transition-colors">
                                View all
                                <ExternalLink className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
