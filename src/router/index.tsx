import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { RoleRoute } from './RoleRoute';
import { AppShell } from '../components/layout/AppShell';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Public pages
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import CallbackPage from '../pages/auth/CallbackPage';
import NotFound from '../pages/NotFound';

// Onboarding pages
import CreatorOnboarding from '../pages/creator/Onboarding';
import CommunityOnboarding from '../pages/community/Onboarding';
import BrandOnboarding from '../pages/brand/Onboarding';

// Creator pages
import CreatorDashboard from '../pages/creator/CreatorDashboard';
import CreatorCampaigns from '../pages/creator/CreatorCampaigns';
import CreatorCampaignDetail from '../pages/creator/CreatorCampaignDetail';
import CreatorEarnings from '../pages/creator/CreatorEarnings';
import CreatorSettings from '../pages/creator/CreatorSettings';

// Community pages
import CommunityDiscover from '../pages/community/CommunityDiscover';
import CommunityTask from '../pages/community/CommunityTask';
import CommunityEarnings from '../pages/community/CommunityEarnings';
import CommunityHistory from '../pages/community/CommunityHistory';
import CommunitySettings from '../pages/community/CommunitySettings';

// Brand pages
import BrandDashboard from '../pages/brand/BrandDashboard';
import BrandCampaigns from '../pages/brand/BrandCampaigns';
import BrandCampaignNew from '../pages/brand/BrandCampaignNew';
import BrandCampaignDetail from '../pages/brand/BrandCampaignDetail';
import BrandSettings from '../pages/brand/BrandSettings';
import CampaignPayment from '../pages/brand/CampaignPayment';

/** Wrap a page element with ErrorBoundary */
function withErrorBoundary(element: React.ReactNode) {
    return <ErrorBoundary>{element}</ErrorBoundary>;
}

export const router = createBrowserRouter([
    // Public routes
    {
        path: '/',
        element: <LandingPage />,
    },
    {
        element: <PublicOnlyRoute />,
        children: [
            { path: '/auth/login', element: <LoginPage /> },
            { path: '/auth/register', element: <RegisterPage /> },
        ],
    },
    {
        path: '/auth/callback',
        element: <CallbackPage />,
    },

    // Onboarding routes (protected, no AppShell)
    {
        element: <ProtectedRoute />,
        children: [
            {
                path: '/creator/onboarding',
                element: withErrorBoundary(<CreatorOnboarding />),
            },
            {
                path: '/community/onboarding',
                element: withErrorBoundary(<CommunityOnboarding />),
            },
            {
                path: '/brand/onboarding',
                element: withErrorBoundary(<BrandOnboarding />),
            },
        ],
    },

    // Creator routes (protected, role=creator)
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <RoleRoute allowedRole="creator" />,
                children: [
                    {
                        element: <AppShell />,
                        children: [
                            {
                                path: '/creator',
                                element: <Navigate to="/creator/dashboard" replace />,
                            },
                            {
                                path: '/creator/dashboard',
                                element: withErrorBoundary(<CreatorDashboard />),
                            },
                            {
                                path: '/creator/campaigns',
                                element: withErrorBoundary(<CreatorCampaigns />),
                            },
                            {
                                path: '/creator/campaigns/:id',
                                element: withErrorBoundary(<CreatorCampaignDetail />),
                            },
                            {
                                path: '/creator/earnings',
                                element: withErrorBoundary(<CreatorEarnings />),
                            },
                            {
                                path: '/creator/settings',
                                element: withErrorBoundary(<CreatorSettings />),
                            },
                        ],
                    },
                ],
            },
        ],
    },

    // Community routes (protected, role=community)
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <RoleRoute allowedRole="community" />,
                children: [
                    {
                        element: <AppShell />,
                        children: [
                            {
                                path: '/community',
                                element: <Navigate to="/community/discover" replace />,
                            },
                            {
                                path: '/community/discover',
                                element: withErrorBoundary(<CommunityDiscover />),
                            },
                            {
                                path: '/community/task/:campaignId',
                                element: withErrorBoundary(<CommunityTask />),
                            },
                            {
                                path: '/community/earnings',
                                element: withErrorBoundary(<CommunityEarnings />),
                            },
                            {
                                path: '/community/history',
                                element: withErrorBoundary(<CommunityHistory />),
                            },
                            {
                                path: '/community/settings',
                                element: withErrorBoundary(<CommunitySettings />),
                            },
                        ],
                    },
                ],
            },
        ],
    },

    // Brand routes (protected, role=brand)
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <RoleRoute allowedRole="brand" />,
                children: [
                    {
                        element: <AppShell />,
                        children: [
                            {
                                path: '/brand',
                                element: <Navigate to="/brand/dashboard" replace />,
                            },
                            {
                                path: '/brand/dashboard',
                                element: withErrorBoundary(<BrandDashboard />),
                            },
                            {
                                path: '/brand/campaigns',
                                element: withErrorBoundary(<BrandCampaigns />),
                            },
                            {
                                path: '/brand/campaigns/new',
                                element: withErrorBoundary(<BrandCampaignNew />),
                            },
                            {
                                path: '/brand/campaigns/:id',
                                element: withErrorBoundary(<BrandCampaignDetail />),
                            },
                            {
                                path: '/brand/campaigns/pay/:id',
                                element: withErrorBoundary(<CampaignPayment />),
                            },
                            {
                                path: '/brand/settings',
                                element: withErrorBoundary(<BrandSettings />),
                            },
                        ],
                    },
                ],
            },
        ],
    },

    // Catch-all 404
    { path: '*', element: <NotFound /> },
]);
