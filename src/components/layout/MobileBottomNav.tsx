import { NavLink, useLocation } from 'react-router-dom';
import { Home, Megaphone, Wallet, User, Compass, ClipboardList, LayoutDashboard, Users } from 'lucide-react';
import { useAuthStore, type UserRole } from '../../store/auth';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
    label: string;
    to: string;
    icon: LucideIcon;
}

const navByRole: Record<UserRole, NavItem[]> = {
    creator: [
        { label: 'Home', to: '/creator/dashboard', icon: Home },
        { label: 'Campaigns', to: '/creator/campaigns', icon: Megaphone },
        { label: 'Earnings', to: '/creator/earnings', icon: Wallet },
        { label: 'Profile', to: '/creator/settings', icon: User },
    ],
    community: [
        { label: 'Discover', to: '/community/discover', icon: Compass },
        { label: 'My Tasks', to: '/community/history', icon: ClipboardList },
        { label: 'Earnings', to: '/community/earnings', icon: Wallet },
        { label: 'Profile', to: '/community/settings', icon: User },
    ],
    brand: [
        { label: 'Dashboard', to: '/brand/dashboard', icon: LayoutDashboard },
        { label: 'Campaigns', to: '/brand/campaigns', icon: Megaphone },
        { label: 'Creators', to: '/brand/settings', icon: Users },
        { label: 'Profile', to: '/brand/settings', icon: User },
    ],
};

export function MobileBottomNav() {
    const { role } = useAuthStore();
    const location = useLocation();

    if (!role) return null;

    // Hide bottom nav during task flow for full focus
    if (location.pathname.startsWith('/community/task/')) return null;

    const items = navByRole[role];

    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center border-t border-commons-border bg-white md:hidden"
            aria-label="Mobile navigation"
        >
            {items.map((item) => {
                const isActive = location.pathname.startsWith(item.to);
                const Icon = item.icon;

                return (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={item.label}
                        className="flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-commons-brand focus-visible:ring-inset rounded-md"
                    >
                        <Icon
                            className={cn(
                                'h-5 w-5 transition-colors',
                                isActive ? 'text-commons-brand' : 'text-commons-textMid',
                            )}
                            strokeWidth={isActive ? 2 : 1.5}
                            aria-hidden="true"
                        />
                        <span
                            className={cn(
                                'text-[10px] transition-colors',
                                isActive ? 'font-medium text-commons-brand' : 'text-commons-textMid',
                            )}
                        >
                            {item.label}
                        </span>
                    </NavLink>
                );
            })}
        </nav>
    );
}
