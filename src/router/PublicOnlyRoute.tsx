import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../store/auth';

const roleHome: Record<UserRole, string> = {
    creator: '/creator/dashboard',
    community: '/community/discover',
    brand: '/brand/dashboard',
};

export function PublicOnlyRoute() {
    const { user, role, isLoading } = useAuthStore();
    if (isLoading) return null;
    if (user && role) return <Navigate to={roleHome[role]} replace />;
    return <Outlet />;
}
