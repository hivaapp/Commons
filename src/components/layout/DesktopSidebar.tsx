import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../../store/auth';
import { cn } from '../../lib/utils';

interface SidebarLink {
    label: string;
    to: string;
}

const linksByRole: Record<UserRole, SidebarLink[]> = {
    creator: [
        { label: 'Dashboard', to: '/creator/dashboard' },
        { label: 'Campaigns', to: '/creator/campaigns' },
        { label: 'Earnings', to: '/creator/earnings' },
        { label: 'Settings', to: '/creator/settings' },
    ],
    community: [
        { label: 'Discover', to: '/community/discover' },
        { label: 'My Tasks', to: '/community/history' },
        { label: 'Earnings', to: '/community/earnings' },
        { label: 'History', to: '/community/history' },
        { label: 'Settings', to: '/community/settings' },
    ],
    brand: [
        { label: 'Dashboard', to: '/brand/dashboard' },
        { label: 'Campaigns', to: '/brand/campaigns' },
        { label: 'Settings', to: '/brand/settings' },
    ],
};

export function DesktopSidebar() {
    const { role } = useAuthStore();
    const location = useLocation();

    if (!role) return null;

    const links = linksByRole[role];

    return (
        <aside
            className="hidden md:flex md:w-[200px] md:flex-col md:fixed md:inset-y-0 md:left-0 bg-commons-surfaceAlt"
            role="navigation"
            aria-label="Main navigation"
        >
            {/* Logo */}
            <div className="flex h-14 items-center px-6">
                <span className="text-[17px] font-semibold text-commons-text">
                    commons
                </span>
            </div>

            {/* Navigation */}
            <nav className="mt-2 flex flex-1 flex-col px-2" aria-label="Sidebar">
                {links.map((link) => {
                    const isActive =
                        location.pathname === link.to ||
                        (link.to !== '/' && location.pathname.startsWith(link.to));

                    return (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                                'flex h-10 items-center rounded-none px-4 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-commons-brand focus-visible:ring-inset',
                                isActive
                                    ? 'border-l-2 border-commons-brand bg-commons-brandTint text-commons-brand font-medium'
                                    : 'border-l-2 border-transparent text-commons-textMid hover:bg-commons-border hover:text-commons-text',
                            )}
                        >
                            {link.label}
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
}
