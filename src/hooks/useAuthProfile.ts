import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';

/**
 * Fetches the current user's profile + role-specific profile on login.
 * Stores the combined result in Zustand auth store.
 */
export function useAuthProfile() {
    const { user, setProfile } = useAuthStore();

    return useQuery({
        queryKey: ['profile', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user!.id)
                .single();
            if (error) throw error;

            // Fetch role-specific profile
            const table =
                data.role === 'creator'
                    ? 'creator_profiles'
                    : data.role === 'community'
                        ? 'community_profiles'
                        : 'brand_profiles';

            const { data: roleProfile, error: roleError } = await supabase
                .from(table)
                .select('*')
                .eq('id', user!.id)
                .single();

            if (roleError && roleError.code !== 'PGRST116') {
                // PGRST116 = not found — means role profile doesn't exist yet
                throw roleError;
            }

            const combined = { ...data, ...(roleProfile ?? {}) };
            setProfile(combined);
            return combined;
        },
        staleTime: 5 * 60 * 1000,
    });
}
