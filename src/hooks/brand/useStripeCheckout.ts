import { useState, useCallback } from 'react';
import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js';
import { supabase } from '../../lib/supabase';

const stripePromise = loadStripe(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string,
);

interface UseStripeCheckoutOptions {
    campaignId: string;
}

interface UseStripeCheckoutReturn {
    /** Load Stripe and create the PaymentIntent */
    initPayment: () => Promise<{
        stripe: Stripe;
        clientSecret: string;
        paymentIntentId: string;
        amount: number;
    }>;
    /** Confirm the payment with Stripe Elements */
    confirmPayment: (
        stripe: Stripe,
        elements: StripeElements,
    ) => Promise<{ success: boolean; error?: string }>;
    /** Confirm campaign payment with backend after Stripe succeeds */
    confirmCampaign: (paymentIntentId: string) => Promise<void>;
    /** Loading/status state */
    loading: boolean;
    error: string | null;
}

export function useStripeCheckout({
    campaignId,
}: UseStripeCheckoutOptions): UseStripeCheckoutReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initPayment = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const stripe = await stripePromise;
            if (!stripe) throw new Error('Failed to load Stripe');

            // Get user session
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            // Call Edge Function to create PaymentIntent
            const response = await fetch(
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create payment');
            }

            return {
                stripe,
                clientSecret: data.clientSecret,
                paymentIntentId: data.paymentIntentId,
                amount: data.amount,
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Payment init failed';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [campaignId]);

    const confirmPayment = useCallback(
        async (stripe: Stripe, elements: StripeElements) => {
            setLoading(true);
            setError(null);

            try {
                const { error: submitError } = await elements.submit();
                if (submitError) {
                    throw new Error(submitError.message);
                }

                const result = await stripe.confirmPayment({
                    elements,
                    redirect: 'if_required',
                });

                if (result.error) {
                    throw new Error(result.error.message);
                }

                return { success: true };
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : 'Payment confirmation failed';
                setError(message);
                return { success: false, error: message };
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    const confirmCampaign = useCallback(
        async (paymentIntentId: string) => {
            setLoading(true);
            setError(null);

            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (!session) throw new Error('Not authenticated');

                const response = await fetch(
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

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to confirm campaign');
                }
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : 'Campaign confirmation failed';
                setError(message);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [campaignId],
    );

    return {
        initPayment,
        confirmPayment,
        confirmCampaign,
        loading,
        error,
    };
}
