import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';

export default function AuthCallbackPage() {
    const navigate = useNavigate();
    const { setUser, setProfile } = useAuthStore();
    const [status, setStatus] = useState('Signing you in…');

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session?.user) {
                    setStatus('No session found. Redirecting…');
                    setTimeout(() => navigate('/auth/login', { replace: true }), 1000);
                    return;
                }

                setUser(session.user);

                // Fetch profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    setProfile({
                        id: profile.id,
                        email: profile.email || '',
                        full_name: profile.full_name,
                        avatar_url: profile.avatar_url,
                        role: profile.role as 'creator' | 'community' | 'brand',
                        created_at: profile.created_at || '',
                    });

                    const role = profile.role;
                    if (role === 'creator') navigate('/creator/dashboard', { replace: true });
                    else if (role === 'community') navigate('/community/discover', { replace: true });
                    else if (role === 'brand') navigate('/brand/dashboard', { replace: true });
                    else navigate('/', { replace: true });
                } else {
                    // New Google user — needs to register role
                    navigate('/auth/register', { replace: true });
                }
            } catch {
                setStatus('Something went wrong. Redirecting…');
                setTimeout(() => navigate('/auth/login', { replace: true }), 2000);
            }
        };

        handleCallback();
    }, [navigate, setUser, setProfile]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-commons-bg">
            <div className="text-center">
                <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-commons-border border-t-commons-brand" />
                <p className="text-sm text-commons-textMid">{status}</p>
            </div>
        </div>
    );
}
