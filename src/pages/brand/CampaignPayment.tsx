import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { ArrowLeft, Lock, Check, AlertCircle } from 'lucide-react';

// ── Stripe instance ──
const stripePromise = loadStripe(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string,
);

// ── Stripe appearance API — matches Commons design ──
const stripeAppearance = {
    theme: 'stripe' as const,
    variables: {
        colorPrimary: '#D97757',
        colorBackground: '#ffffff',
        colorText: '#21201C',
        colorDanger: '#C0392B',
        fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif',
        borderRadius: '8px',
    },
};

function formatINR(paise: number): string {
    return '₹' + (paise / 100).toLocaleString('en-IN');
}

// ── Inner form (needs to be inside <Elements>) ──
function CheckoutForm({
    campaignId,
    paymentIntentId,
    amount,
}: {
    campaignId: string;
    paymentIntentId: string;
    amount: number;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!stripe || !elements) return;

            setProcessing(true);
            setError(null);

            try {
                // Submit the Elements form
                const { error: submitError } = await elements.submit();
                if (submitError) {
                    throw new Error(submitError.message);
                }

                // Confirm the payment
                const result = await stripe.confirmPayment({
                    elements,
                    redirect: 'if_required',
                });

                if (result.error) {
                    throw new Error(result.error.message);
                }

                // Payment authorized (manual capture) — confirm with backend
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (!session) throw new Error('Session expired');

                const confirmRes = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-campaign-payment`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({ paymentIntentId, campaignId }),
                    },
                );

                const confirmData = await confirmRes.json();
                if (!confirmRes.ok) {
                    throw new Error(confirmData.error || 'Campaign confirmation failed');
                }

                setSuccess(true);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Payment failed');
            } finally {
                setProcessing(false);
            }
        },
        [stripe, elements, paymentIntentId, campaignId],
    );

    if (success) {
        return (
            <div className="flex flex-col items-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-commons-successBg">
                    <Check className="h-8 w-8 text-commons-success" />
                </div>
                <h2 className="mt-5 text-[22px] font-bold text-commons-text">
                    Campaign funded!
                </h2>
                <p className="mt-2 max-w-[320px] text-[14px] text-commons-textMid">
                    Your payment of {formatINR(amount)} has been authorized. We're
                    reviewing your campaign — you'll be notified within 4 hours.
                </p>
                <button
                    onClick={() => navigate('/brand/dashboard')}
                    className="mt-6 rounded-md border border-commons-border bg-white px-6 py-2.5 text-[14px] font-medium text-commons-text transition-colors hover:bg-commons-surfaceAlt"
                >
                    Back to dashboard
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            {/* Stripe Payment Element */}
            <div className="rounded-lg border border-commons-border bg-white p-4">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                    }}
                />
            </div>

            {/* Error message */}
            {error && (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-commons-error/20 bg-commons-errorBg p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-commons-error" />
                    <p className="text-[13px] text-commons-error">{error}</p>
                </div>
            )}

            {/* Pay button */}
            <button
                type="submit"
                disabled={!stripe || processing}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-commons-brand text-[15px] font-semibold text-white transition-colors hover:bg-commons-brandHover disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Lock className="h-4 w-4" />
                {processing
                    ? 'Processing...'
                    : `Pay ${formatINR(amount)} · Secured by Stripe`}
            </button>

            {/* Trust text */}
            <p className="mt-2 text-center text-[11px] text-commons-textLight">
                Funds held in escrow until campaign delivery
            </p>

            {/* Stripe branding */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-commons-textLight">
                <Lock className="h-3 w-3" />
                <span>Powered by Stripe · 256-bit SSL encryption</span>
            </div>
        </form>
    );
}

// ── Main page ──
export default function CampaignPayment() {
    const navigate = useNavigate();
    const { id: campaignId } = useParams<{ id: string }>();
    const { user } = useAuthStore();

    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
    const [initError, setInitError] = useState<string | null>(null);
    const [initLoading, setInitLoading] = useState(true);

    // Fetch campaign details
    const { data: campaign } = useQuery({
        queryKey: ['campaign-payment', campaignId],
        enabled: !!campaignId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('campaigns')
                .select(
                    'id, title, budget_paise, platform_fee_paise, creator_fee_paise, per_task_paise, target_participants, brand_id, status, campaign_type',
                )
                .eq('id', campaignId!)
                .single();
            if (error) throw error;
            return data;
        },
    });

    // Initialize PaymentIntent
    useEffect(() => {
        if (!campaignId || !user) return;

        (async () => {
            setInitLoading(true);
            setInitError(null);

            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (!session) throw new Error('Not authenticated');

                const res = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({ campaignId }),
                    },
                );

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to init payment');

                setClientSecret(data.clientSecret);
                setPaymentIntentId(data.paymentIntentId);
            } catch (err) {
                setInitError(
                    err instanceof Error ? err.message : 'Failed to initialize payment',
                );
            } finally {
                setInitLoading(false);
            }
        })();
    }, [campaignId, user]);

    // Budget breakdown
    const breakdown = useMemo(() => {
        if (!campaign) return null;
        const budget = campaign.budget_paise;
        const community = Math.round(budget * 0.64);
        const creator = campaign.creator_fee_paise ?? Math.round(budget * 0.24);
        const platform = campaign.platform_fee_paise ?? (budget - community - creator);
        return { community, creator, platform, total: budget };
    }, [campaign]);

    // Elements options
    const elementsOptions = useMemo(
        () =>
            clientSecret
                ? {
                    clientSecret,
                    appearance: stripeAppearance,
                }
                : null,
        [clientSecret],
    );

    return (
        <div>
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-1 text-[13px] text-commons-textMid hover:text-commons-text"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to campaign
            </button>

            <div className="mx-auto max-w-[520px]">
                {/* Page title */}
                <h1 className="text-[22px] font-bold text-commons-text">
                    Fund your campaign
                </h1>
                <p className="mt-1 text-[14px] text-commons-textMid">
                    Authorize payment to lock in your campaign. Funds are captured only
                    after Commons approves your campaign.
                </p>

                {/* Campaign summary */}
                {campaign && breakdown && (
                    <div className="mt-6 rounded-lg border border-commons-border bg-white p-4">
                        <p className="text-[15px] font-semibold text-commons-text">
                            {campaign.title}
                        </p>
                        <p className="mt-0.5 text-[12px] text-commons-textMid">
                            {campaign.campaign_type} · {campaign.target_participants}{' '}
                            participants
                        </p>

                        <div className="mt-4 space-y-2">
                            {[
                                {
                                    label: 'Community payouts',
                                    value: formatINR(breakdown.community),
                                    pct: '64%',
                                },
                                {
                                    label: 'Creator fee',
                                    value: formatINR(breakdown.creator),
                                    pct: '24%',
                                },
                                {
                                    label: 'Platform fee',
                                    value: formatINR(breakdown.platform),
                                    pct: '12%',
                                },
                            ].map((row) => (
                                <div
                                    key={row.label}
                                    className="flex items-center justify-between"
                                >
                                    <span className="text-[13px] text-commons-textMid">
                                        {row.label}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] text-commons-text">
                                            {row.value}
                                        </span>
                                        <span className="w-7 text-right text-[11px] text-commons-textLight">
                                            ({row.pct})
                                        </span>
                                    </div>
                                </div>
                            ))}

                            <div className="border-t border-commons-border pt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[14px] font-semibold text-commons-text">
                                        Total
                                    </span>
                                    <span className="text-[14px] font-semibold text-commons-text">
                                        {formatINR(breakdown.total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment section */}
                <div className="mt-6">
                    {initLoading && (
                        <div className="flex flex-col items-center py-12 text-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-commons-border border-t-commons-brand" />
                            <p className="mt-3 text-[14px] text-commons-textMid">
                                Preparing payment...
                            </p>
                        </div>
                    )}

                    {initError && (
                        <div className="rounded-lg border border-commons-error/20 bg-commons-errorBg p-4 text-center">
                            <AlertCircle className="mx-auto h-8 w-8 text-commons-error" />
                            <p className="mt-2 text-[14px] text-commons-error">
                                {initError}
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-3 text-[13px] font-medium text-commons-brand hover:text-commons-brandHover"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {elementsOptions && paymentIntentId && campaign && (
                        <Elements stripe={stripePromise} options={elementsOptions}>
                            <CheckoutForm
                                campaignId={campaignId!}
                                paymentIntentId={paymentIntentId}
                                amount={campaign.budget_paise}
                            />
                        </Elements>
                    )}
                </div>
            </div>
        </div>
    );
}
