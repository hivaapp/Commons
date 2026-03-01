import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const navigate = useNavigate();
    const { setUser, setProfile } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Enter your email address first, then click Forgot password.');
            return;
        }
        setResetLoading(true);
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback`,
        });
        setResetLoading(false);
        if (resetError) {
            setError(resetError.message);
        } else {
            setResetSent(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;
            if (!data.user) throw new Error('No user returned');

            setUser(data.user);

            // Fetch profile to get role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError) throw profileError;

            setProfile({
                id: profile.id,
                email: profile.email || '',
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                role: profile.role as 'creator' | 'community' | 'brand',
                created_at: profile.created_at || '',
            });

            // Redirect based on role
            const role = profile.role;
            if (role === 'creator') navigate('/creator/dashboard', { replace: true });
            else if (role === 'community') navigate('/community/discover', { replace: true });
            else if (role === 'brand') navigate('/brand/dashboard', { replace: true });
            else navigate('/', { replace: true });
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        const { error: authError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (authError) setError(authError.message);
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-commons-bg px-6">
            <div className="w-full max-w-sm">
                {/* Card */}
                <div className="rounded-lg border border-commons-border bg-white p-6">
                    {/* Logo */}
                    <p className="mb-8 text-center text-lg font-semibold text-commons-text">
                        commons
                    </p>

                    {/* Heading */}
                    <h1 className="text-[22px] font-bold leading-tight text-commons-text">
                        Welcome back
                    </h1>
                    <p className="mb-6 mt-1 text-sm text-commons-textMid">
                        Sign in to your account
                    </p>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 rounded-md bg-commons-errorBg px-3 py-2 text-xs text-commons-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div>
                            <label
                                htmlFor="login-email"
                                className="mb-1 block text-xs text-commons-textMid"
                            >
                                Email
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                            />
                        </div>

                        {/* Password */}
                        <div className="mt-4">
                            <label
                                htmlFor="login-password"
                                className="mb-1 block text-xs text-commons-textMid"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="h-10 w-full rounded-md border border-commons-border bg-white px-3 pr-10 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-commons-textLight hover:text-commons-textMid"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Forgot password */}
                        <div className="mb-4 mt-1 text-right">
                            {resetSent ? (
                                <p className="text-xs text-commons-success">✓ Reset email sent — check your inbox</p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    disabled={resetLoading}
                                    className="text-xs text-commons-brand hover:text-commons-brandHover disabled:opacity-50"
                                >
                                    {resetLoading ? 'Sending…' : 'Forgot password?'}
                                </button>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-10 w-full rounded-md bg-commons-brand text-sm font-medium text-white transition-colors hover:bg-commons-brandHover focus:outline-none focus:ring-2 focus:ring-commons-brand focus:ring-offset-2 disabled:opacity-50"
                        >
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-4 flex items-center gap-3">
                        <div className="h-px flex-1 bg-commons-border" />
                        <span className="text-xs text-commons-textLight">or</span>
                        <div className="h-px flex-1 bg-commons-border" />
                    </div>

                    {/* Google */}
                    <button
                        onClick={handleGoogleSignIn}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-commons-border bg-white text-sm font-medium text-commons-text transition-colors hover:bg-commons-surfaceAlt"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </button>
                </div>

                {/* Sign up link */}
                <p className="mt-6 text-center text-sm text-commons-textMid">
                    Don't have an account?{' '}
                    <Link
                        to="/auth/register"
                        className="font-medium text-commons-brand hover:text-commons-brandHover"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
