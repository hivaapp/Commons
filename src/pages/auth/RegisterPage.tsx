import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

type Role = 'creator' | 'community' | 'brand';

const ROLES: { value: Role; icon: string; label: string; description: string }[] = [
    {
        value: 'creator',
        icon: '🎬',
        label: 'Creator',
        description: 'I run campaigns for my community',
    },
    {
        value: 'community',
        icon: '👥',
        label: 'Community Member',
        description: 'I complete tasks and earn money',
    },
    {
        value: 'brand',
        icon: '🏢',
        label: 'Brand',
        description: 'I run community research campaigns',
    },
];

function getPasswordStrength(password: string): number {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
    return score; // 0–3
}

const strengthColors = ['bg-commons-error', 'bg-[#E6A817]', 'bg-commons-success'];
const strengthLabels = ['Weak', 'Fair', 'Strong'];

export default function RegisterPage() {
    const navigate = useNavigate();
    const { setUser, setProfile } = useAuthStore();

    // Step state
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    // Form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [handle, setHandle] = useState('');
    const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
    const [handleChecking, setHandleChecking] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const strength = getPasswordStrength(password);

    // Check handle uniqueness
    const checkHandle = useCallback(
        async (value: string) => {
            if (!value || value.length < 3) {
                setHandleAvailable(null);
                return;
            }
            setHandleChecking(true);
            try {
                const { data, error: err } = await supabase
                    .from('creator_profiles')
                    .select('id')
                    .eq('handle', value)
                    .maybeSingle();
                if (err) throw err;
                setHandleAvailable(!data);
            } catch {
                setHandleAvailable(null);
            } finally {
                setHandleChecking(false);
            }
        },
        [],
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!selectedRole) {
            setError('Please select a role');
            setLoading(false);
            return;
        }

        try {
            // 1. Sign up
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: selectedRole,
                    },
                },
            });

            if (authError) throw authError;
            if (!data.user) throw new Error('No user returned');

            setUser(data.user);

            // 2. Create profile row
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: data.user.id,
                email,
                full_name: fullName,
                role: selectedRole,
            });
            if (profileError) throw profileError;

            // 3. Create role-specific profile
            if (selectedRole === 'creator') {
                const { error: creatorError } = await supabase.from('creator_profiles').upsert({
                    id: data.user.id,
                    handle: handle || fullName.toLowerCase().replace(/\s+/g, ''),
                });
                if (creatorError) throw creatorError;
            } else if (selectedRole === 'brand') {
                const { error: brandError } = await supabase.from('brand_profiles').upsert({
                    id: data.user.id,
                    company_name: companyName || fullName,
                });
                if (brandError) throw brandError;
            } else if (selectedRole === 'community') {
                const { error: communityError } = await supabase.from('community_profiles').upsert({
                    id: data.user.id,
                });
                if (communityError) throw communityError;
            }

            // 4. Set profile in store
            setProfile({
                id: data.user.id,
                email,
                full_name: fullName,
                avatar_url: null,
                role: selectedRole,
                created_at: new Date().toISOString(),
            });

            // 5. Redirect to onboarding
            navigate(`/${selectedRole}/onboarding`, { replace: true });
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    // ── STEP 1: Role Selection ──────────────────────────────────
    if (step === 1) {
        return (
            <div className="flex min-h-screen flex-col items-center bg-commons-bg px-6">
                {/* Logo */}
                <p className="mt-8 text-lg font-semibold text-commons-text">commons</p>

                <div className="mt-12 w-full max-w-sm">
                    <h1 className="text-center text-[22px] font-bold text-commons-text">
                        I am a…
                    </h1>

                    <div className="mt-6 flex flex-col gap-3">
                        {ROLES.map((role) => (
                            <button
                                key={role.value}
                                onClick={() => setSelectedRole(role.value)}
                                className={`w-full rounded-lg border p-4 text-left transition-all ${selectedRole === role.value
                                        ? 'border-2 border-commons-brand bg-commons-brandTint'
                                        : 'border-commons-border bg-white hover:border-commons-brand'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{role.icon}</span>
                                    <span className="text-[15px] font-semibold text-commons-text">
                                        {role.label}
                                    </span>
                                </div>
                                <p className="mt-1 text-[13px] text-commons-textMid">
                                    {role.description}
                                </p>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => selectedRole && setStep(2)}
                        disabled={!selectedRole}
                        className="mt-6 h-10 w-full rounded-md bg-commons-brand text-sm font-medium text-white transition-colors hover:bg-commons-brandHover disabled:opacity-50"
                    >
                        Continue →
                    </button>
                </div>

                {/* Already have an account */}
                <p className="mt-8 text-sm text-commons-textMid">
                    Already have an account?{' '}
                    <Link
                        to="/auth/login"
                        className="font-medium text-commons-brand hover:text-commons-brandHover"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        );
    }

    // ── STEP 2: Registration Form ───────────────────────────────
    return (
        <div className="flex min-h-screen flex-col items-center bg-commons-bg px-6 pt-12">
            <div className="w-full max-w-[400px]">
                {/* Back */}
                <button
                    onClick={() => setStep(1)}
                    className="mb-6 flex items-center gap-1 text-sm text-commons-textMid hover:text-commons-text"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>

                <h1 className="text-[22px] font-bold text-commons-text">Create your account</h1>

                {/* Error */}
                {error && (
                    <div className="mt-4 rounded-md bg-commons-errorBg px-3 py-2 text-xs text-commons-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6">
                    {/* Full name */}
                    <div>
                        <label
                            htmlFor="reg-name"
                            className="mb-1 block text-xs text-commons-textMid"
                        >
                            Full name
                        </label>
                        <input
                            id="reg-name"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your name"
                            required
                            className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                        />
                    </div>

                    {/* Email */}
                    <div className="mt-4">
                        <label
                            htmlFor="reg-email"
                            className="mb-1 block text-xs text-commons-textMid"
                        >
                            Email
                        </label>
                        <input
                            id="reg-email"
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
                            htmlFor="reg-password"
                            className="mb-1 block text-xs text-commons-textMid"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="reg-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={8}
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
                        {/* Strength bar */}
                        {password && (
                            <div className="mt-2 flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className={`h-1 flex-1 rounded-full transition-colors ${i < strength
                                                ? strengthColors[strength - 1]
                                                : 'bg-commons-border'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                        {password && strength > 0 && (
                            <p className="mt-1 text-[11px] text-commons-textMid">
                                {strengthLabels[strength - 1]}
                            </p>
                        )}
                    </div>

                    {/* Creator: Handle */}
                    {selectedRole === 'creator' && (
                        <div className="mt-4">
                            <label
                                htmlFor="reg-handle"
                                className="mb-1 block text-xs text-commons-textMid"
                            >
                                Username / handle
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-commons-textLight">
                                    @
                                </span>
                                <input
                                    id="reg-handle"
                                    type="text"
                                    value={handle}
                                    onChange={(e) => {
                                        const v = e.target.value
                                            .toLowerCase()
                                            .replace(/[^a-z0-9_]/g, '');
                                        setHandle(v);
                                        setHandleAvailable(null);
                                    }}
                                    onBlur={() => checkHandle(handle)}
                                    placeholder="yourhandle"
                                    required
                                    className="h-10 w-full rounded-md border border-commons-border bg-white pl-7 pr-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                                />
                            </div>
                            {handleChecking && (
                                <p className="mt-1 text-[11px] text-commons-textMid">
                                    Checking…
                                </p>
                            )}
                            {handleAvailable === true && (
                                <p className="mt-1 text-[11px] text-commons-success">
                                    ✓ Available
                                </p>
                            )}
                            {handleAvailable === false && (
                                <p className="mt-1 text-[11px] text-commons-error">
                                    ✗ Already taken
                                </p>
                            )}
                            <p className="mt-1 text-[11px] text-commons-textLight">
                                commons.app/@{handle || 'handle'} — visible to brands
                            </p>
                        </div>
                    )}

                    {/* Brand: Company name */}
                    {selectedRole === 'brand' && (
                        <div className="mt-4">
                            <label
                                htmlFor="reg-company"
                                className="mb-1 block text-xs text-commons-textMid"
                            >
                                Company name
                            </label>
                            <input
                                id="reg-company"
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Your company"
                                required
                                className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                            />
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || (selectedRole === 'creator' && handleAvailable === false)}
                        className="mt-6 h-10 w-full rounded-md bg-commons-brand text-sm font-medium text-white transition-colors hover:bg-commons-brandHover disabled:opacity-50"
                    >
                        {loading ? 'Creating account…' : 'Create account →'}
                    </button>
                </form>

                {/* Terms */}
                <p className="mt-4 text-center text-[11px] text-commons-textLight">
                    By signing up, you agree to our Terms of Service
                </p>
            </div>
        </div>
    );
}
