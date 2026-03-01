import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';

const TOTAL_STEPS = 3;

const INTEREST_OPTIONS = ['Research', 'Review', 'Beta Test', 'Content', 'Vote'] as const;

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Chandigarh', 'Puducherry',
] as const;

type PaymentMethod = 'upi' | 'bank' | 'paypal';

export default function CommunityOnboarding() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Step 1: Basics
    const [ageConfirmed, setAgeConfirmed] = useState(false);
    const [state, setState] = useState('');
    const [interests, setInterests] = useState<string[]>([]);

    // Step 2: Payout
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
    const [upiId, setUpiId] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [bankIfsc, setBankIfsc] = useState('');
    const [bankHolder, setBankHolder] = useState('');
    const [paypalEmail, setPaypalEmail] = useState('');
    const [skipPayout, setSkipPayout] = useState(false);

    const progress = (currentStep / TOTAL_STEPS) * 100;

    const toggleInterest = (interest: string) => {
        setInterests((prev) =>
            prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
        );
    };

    const canProceed = (): boolean => {
        switch (currentStep) {
            case 1:
                return ageConfirmed && !!state && interests.length > 0;
            case 2:
                return true; // Can always proceed (skip payout)
            case 3:
                return true;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (currentStep < TOTAL_STEPS) setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleFinish = async () => {
        if (!user) return;
        setSubmitting(true);

        try {
            const bankData =
                paymentMethod === 'bank' && !skipPayout
                    ? {
                        account_number: bankAccount,
                        ifsc: bankIfsc,
                        holder_name: bankHolder,
                    }
                    : null;

            const upi =
                paymentMethod === 'upi' && !skipPayout ? upiId : null;

            await supabase
                .from('community_profiles')
                .update({
                    upi_id: upi,
                    bank_account: bankData,
                })
                .eq('id', user.id);

            navigate('/community/discover', { replace: true });
        } catch (err) {
            console.error('Onboarding error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-commons-bg">
            {/* Progress bar */}
            <div className="fixed left-0 right-0 top-0 z-50">
                <div className="h-1 w-full bg-commons-border">
                    <div
                        className="h-1 bg-commons-brand transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Step indicator */}
            <div className="fixed right-6 top-3 z-50">
                <span className="text-xs text-commons-textMid">
                    {currentStep} / {TOTAL_STEPS}
                </span>
            </div>

            <div className="mx-auto max-w-[440px] px-6 pb-12 pt-12">
                {/* ── Step 1: Basics ──────────────────────────────── */}
                {currentStep === 1 && (
                    <div>
                        <h2 className="text-xl font-bold text-commons-text">
                            Let's get started
                        </h2>

                        {/* Age confirmation */}
                        <label className="mt-6 flex items-center gap-2 text-sm text-commons-text">
                            <input
                                type="checkbox"
                                checked={ageConfirmed}
                                onChange={(e) => setAgeConfirmed(e.target.checked)}
                                className="h-4 w-4 rounded border-commons-border text-commons-brand focus:ring-commons-brand"
                            />
                            I confirm I am 18 years or older
                        </label>

                        {/* State */}
                        <div className="mt-4">
                            <label className="mb-1 block text-xs text-commons-textMid">
                                State / City
                            </label>
                            <select
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm text-commons-text focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                            >
                                <option value="">Select your state</option>
                                {INDIAN_STATES.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Interests */}
                        <div className="mt-4">
                            <label className="mb-2 block text-xs text-commons-textMid">
                                Interests
                            </label>
                            <div className="space-y-2">
                                {INTEREST_OPTIONS.map((interest) => (
                                    <label
                                        key={interest}
                                        className="flex items-center gap-2 text-sm text-commons-text"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={interests.includes(interest)}
                                            onChange={() => toggleInterest(interest)}
                                            className="h-4 w-4 rounded border-commons-border text-commons-brand focus:ring-commons-brand"
                                        />
                                        {interest}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Payout ──────────────────────────────── */}
                {currentStep === 2 && (
                    <div>
                        <h2 className="text-xl font-bold text-commons-text">
                            How to receive payments
                        </h2>
                        <p className="mb-6 mt-1 text-sm text-commons-textMid">
                            You'll earn ₹150–2,000 per task. Paid within 24hrs of campaign close.
                        </p>

                        {/* Payment method selector */}
                        <div className="flex overflow-hidden rounded-md border border-commons-border">
                            {(['upi', 'bank', 'paypal'] as PaymentMethod[]).map((method, i) => (
                                <button
                                    key={method}
                                    onClick={() => {
                                        setPaymentMethod(method);
                                        setSkipPayout(false);
                                    }}
                                    className={`flex-1 py-2 text-sm font-medium transition-colors ${paymentMethod === method && !skipPayout
                                            ? 'bg-commons-brand text-white'
                                            : 'bg-white text-commons-text hover:bg-commons-surfaceAlt'
                                        } ${i > 0 ? 'border-l border-commons-border' : ''}`}
                                >
                                    {method === 'upi' ? 'UPI' : method === 'bank' ? 'Bank Account' : 'PayPal'}
                                </button>
                            ))}
                        </div>

                        {!skipPayout && (
                            <div className="mt-4">
                                {paymentMethod === 'upi' && (
                                    <div>
                                        <label className="mb-1 block text-xs text-commons-textMid">
                                            UPI ID
                                        </label>
                                        <input
                                            type="text"
                                            value={upiId}
                                            onChange={(e) => setUpiId(e.target.value)}
                                            placeholder="yourname@upi"
                                            className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                                        />
                                    </div>
                                )}

                                {paymentMethod === 'bank' && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="mb-1 block text-xs text-commons-textMid">
                                                Account number
                                            </label>
                                            <input
                                                type="text"
                                                value={bankAccount}
                                                onChange={(e) => setBankAccount(e.target.value)}
                                                placeholder="Account number"
                                                className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs text-commons-textMid">
                                                IFSC code
                                            </label>
                                            <input
                                                type="text"
                                                value={bankIfsc}
                                                onChange={(e) => setBankIfsc(e.target.value)}
                                                placeholder="IFSC code"
                                                className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs text-commons-textMid">
                                                Account holder name
                                            </label>
                                            <input
                                                type="text"
                                                value={bankHolder}
                                                onChange={(e) => setBankHolder(e.target.value)}
                                                placeholder="Account holder name"
                                                className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                                            />
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'paypal' && (
                                    <div>
                                        <label className="mb-1 block text-xs text-commons-textMid">
                                            PayPal email
                                        </label>
                                        <input
                                            type="email"
                                            value={paypalEmail}
                                            onChange={(e) => setPaypalEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => setSkipPayout(true)}
                            className="mt-4 text-sm text-commons-brand hover:text-commons-brandHover"
                        >
                            Set up later
                        </button>
                        {skipPayout && (
                            <p className="mt-1 text-[11px] text-commons-textMid">
                                A reminder will appear on your dashboard.
                            </p>
                        )}
                    </div>
                )}

                {/* ── Step 3: Quick Guide ─────────────────────────── */}
                {currentStep === 3 && (
                    <div>
                        <h2 className="text-xl font-bold text-commons-text">
                            Here's how it works
                        </h2>

                        <ol className="mt-6 space-y-4 text-sm text-commons-text">
                            <li className="flex items-start gap-3">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-commons-surfaceAlt text-xs font-semibold text-commons-textMid">
                                    1
                                </span>
                                Browse campaigns from creators you trust
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-commons-surfaceAlt text-xs font-semibold text-commons-textMid">
                                    2
                                </span>
                                Complete the task genuinely — 5 to 15 minutes
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-commons-surfaceAlt text-xs font-semibold text-commons-textMid">
                                    3
                                </span>
                                Get paid within 24hrs of campaign close
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-commons-surfaceAlt text-xs font-semibold text-commons-textMid">
                                    4
                                </span>
                                Build your quality score for higher-paying campaigns
                            </li>
                        </ol>

                        <p className="mt-6 text-xs text-commons-textMid">
                            Your responses are anonymous. Brands never see your name.
                        </p>
                    </div>
                )}

                {/* ── Navigation ──────────────────────────────────── */}
                <div className="mt-8 flex gap-3">
                    {currentStep > 1 && (
                        <button
                            onClick={handleBack}
                            className="h-10 flex-1 rounded-md border border-commons-border bg-white text-sm font-medium text-commons-text transition-colors hover:bg-commons-surfaceAlt"
                        >
                            Back
                        </button>
                    )}
                    {currentStep < TOTAL_STEPS ? (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className="h-10 flex-1 rounded-md bg-commons-brand text-sm font-medium text-white transition-colors hover:bg-commons-brandHover disabled:opacity-50"
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            onClick={handleFinish}
                            disabled={submitting}
                            className="h-10 flex-1 rounded-md bg-commons-brand text-sm font-medium text-white transition-colors hover:bg-commons-brandHover disabled:opacity-50"
                        >
                            {submitting ? 'Finishing…' : 'Find my first campaign →'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
