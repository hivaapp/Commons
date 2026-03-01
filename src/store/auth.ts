import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'creator' | 'community' | 'brand';

export interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: UserRole;
    created_at: string;
}

interface AuthState {
    user: User | null;
    profile: UserProfile | null;
    role: UserRole | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setProfile: (profile: UserProfile | null) => void;
    setLoading: (loading: boolean) => void;
    signOut: () => void;
}

const getPersistedRole = (): UserRole | null => {
    try {
        const role = localStorage.getItem('commons_role');
        if (role === 'creator' || role === 'community' || role === 'brand') {
            return role;
        }
    } catch {
        // localStorage not available
    }
    return null;
};

const getPersistedUserId = (): string | null => {
    try {
        return localStorage.getItem('commons_user_id');
    } catch {
        return null;
    }
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    profile: null,
    role: getPersistedRole(),
    isLoading: true,

    setUser: (user) => {
        if (user) {
            try {
                localStorage.setItem('commons_user_id', user.id);
            } catch {
                // localStorage not available
            }
        }
        set({ user });
    },

    setProfile: (profile) => {
        const role = profile?.role ?? null;
        if (role) {
            try {
                localStorage.setItem('commons_role', role);
            } catch {
                // localStorage not available
            }
        }
        set({ profile, role });
    },

    setLoading: (isLoading) => set({ isLoading }),

    signOut: () => {
        try {
            localStorage.removeItem('commons_role');
            localStorage.removeItem('commons_user_id');
        } catch {
            // localStorage not available
        }
        set({ user: null, profile: null, role: null, isLoading: false });
    },
}));

export const getPersistedAuth = () => ({
    role: getPersistedRole(),
    userId: getPersistedUserId(),
});
