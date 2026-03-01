import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../store/auth';

interface RoleRouteProps {
    allowedRole: UserRole;
}

const roleHomeMap: Record<UserRole, string> = {
    creator: '/creator/dashboard',
    community: '/community/discover',
    brand: '/brand/dashboard',
};

export function RoleRoute({ allowedRole }: RoleRouteProps) {
    const { role, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-commons-bg">
                <div className="skeleton-shimmer h-6 w-32 rounded-md" />
            </div>
        );
    }

    if (role !== allowedRole) {
        const redirectTo = role ? roleHomeMap[role] : '/auth/login';
        return <Navigate to={redirectTo} replace />;
    }

    return <Outlet />;
}
