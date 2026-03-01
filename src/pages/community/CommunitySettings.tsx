import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { useToast } from '../../components/ui/ToastProvider';
import { Skeleton } from '../../components/ui/Skeleton';

export default function CommunitySettings() {
    const { user, profile } = useAuthStore();
    const navigate = useNavigate();
    const toast = useToast();

    // ── Fetch community profile ──
    const { data: communityProfile, isLoading } = useQuery({
        queryKey: ['community-profile-settings', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('community_profiles')
                .select('upi_id, bank_account, quality_score, total_earned_paise')
                .eq('id', user!.id)
                .single();
            if (error) throw error;
            return data;
        },
    });

    // ── Local state for editable fields ──
    const [upiId, setUpiId] = useState('');
    const [savedUpi, setSavedUpi] = useState(false);
    const [savingUpi, setSavingUpi] = useState(false);

    useEffect(() => {
        if (communityProfile?.upi_id) setUpiId(communityProfile.upi_id);
    }, [communityProfile]);

    const saveUpi = async () => {
        if (!user?.id) return;
        setSavingUpi(true);
        const { error } = await supabase
            .from('community_profiles')
            .update({ upi_id: upiId })
            .eq('id', user.id);
        setSavingUpi(false);
        if (error) {
            toast.error('Failed to save UPI ID', error.message);
        } else {
            setSavedUpi(true);
            setTimeout(() => setSavedUpi(false), 2000);
        }
    };

    // ── Loading state ──
    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-[20px] font-bold text-commons-text">Settings</h1>

            {/* Profile section */}
            <section className="mt-8">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-commons-textMid">
                    Profile
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs text-commons-textMid">Display Name</label>
                        <input
                            type="text"
                            defaultValue={profile?.full_name ?? ''}
                            onBlur={async (e) => {
                                const { error } = await supabase
                                    .from('profiles')
                                    .update({ full_name: e.target.value })
                                    .eq('id', user!.id);
                                if (!error) toast.success('Name saved');
                                else toast.error('Failed to save', error.message);
                            }}
                            className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-commons-textMid">Email</label>
                        <input
                            type="email"
                            disabled
                            value={profile?.email ?? ''}
                            className="h-10 w-full rounded-md border border-commons-border bg-commons-surfaceAlt px-3 text-sm text-commons-textMid"
                        />
                    </div>
                </div>
            </section>

            {/* Payout section */}
            <section className="mt-8">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-commons-textMid">
                    Payout
                </p>
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-commons-textMid">UPI ID</label>
                        {savedUpi && (
                            <span className="flex items-center gap-1 text-[12px] text-commons-success">
                                <Check className="h-3 w-3" /> Saved
                            </span>
                        )}
                    </div>
                    <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                    />
                    <button
                        onClick={saveUpi}
                        disabled={savingUpi}
                        className="mt-2 h-9 rounded-md bg-commons-brand px-4 text-sm font-medium text-white hover:bg-commons-brandHover disabled:opacity-50"
                    >
                        {savingUpi ? 'Saving…' : 'Save UPI'}
                    </button>
                    <p className="mt-1 text-[11px] text-commons-textMid">
                        Payouts sent within 24hrs of campaign close. Min ₹50.
                    </p>
                </div>
            </section>

            {/* Quality stats (read-only) */}
            <section className="mt-8">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-commons-textMid">
                    Your stats
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[24px] font-bold text-commons-text">
                            {communityProfile?.quality_score ?? 0}
                        </p>
                        <p className="text-[11px] text-commons-textMid mt-0.5">Quality score</p>
                    </div>
                    <div>
                        <p className="text-[24px] font-bold text-commons-success">
                            ₹{((communityProfile?.total_earned_paise ?? 0) / 100).toLocaleString('en-IN')}
                        </p>
                        <p className="text-[11px] text-commons-textMid mt-0.5">Total earned</p>
                    </div>
                </div>
            </section>

            {/* Sign out */}
            <section className="mt-8 border-t border-commons-border pt-6">
                <button
                    onClick={async () => {
                        await supabase.auth.signOut();
                        navigate('/', { replace: true });
                    }}
                    className="text-sm text-commons-error hover:text-[#A93226] transition-colors"
                >
                    Sign out
                </button>
            </section>
        </div>
    );
}
