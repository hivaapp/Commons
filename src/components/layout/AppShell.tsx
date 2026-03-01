import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { DesktopSidebar } from './DesktopSidebar';
import { NotificationCenter } from '../notifications/NotificationCenter';

export function AppShell() {
    return (
        <div className="min-h-screen bg-commons-bg">
            {/* Skip to main content — accessibility */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-commons-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-none"
            >
                Skip to main content
            </a>

            {/* Desktop Sidebar */}
            <DesktopSidebar />

            {/* Desktop notification bell (top-right, only visible on desktop) */}
            <div className="hidden md:flex fixed top-3 right-6 z-50">
                <NotificationCenter />
            </div>

            {/* Mobile TopBar */}
            <TopBar />

            {/* Main Content */}
            <main id="main-content" className="pb-20 md:ml-[200px] md:pb-0">
                <div className="mx-auto max-w-prose px-6 py-6 md:px-8 md:py-8">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <MobileBottomNav />
        </div>
    );
}
