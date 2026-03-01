import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore, type UserRole } from '../../store/auth';
import { NotificationCenter } from '../notifications/NotificationCenter';

const homeRoutes: Record<UserRole, string> = {
    creator: '/creator/dashboard',
    community: '/community/discover',
    brand: '/brand/dashboard',
};

export function TopBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { role } = useAuthStore();

    const isHomePage = role ? location.pathname === homeRoutes[role] : true;

    return (
        <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-commons-border bg-white px-4 md:hidden">
            <div className="flex items-center">
                {isHomePage ? (
                    <span className="text-[17px] font-semibold text-commons-text">
                        commons
                    </span>
                ) : (
                    <button
                        onClick={() => navigate(-1)}
                        className="flex h-10 w-10 items-center justify-center -ml-2 text-commons-textMid transition-colors hover:text-commons-text focus:outline-none focus-visible:ring-2 focus-visible:ring-commons-brand rounded-md"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                )}
            </div>
            <div className="-mr-2">
                <NotificationCenter />
            </div>
        </header>
    );
}
