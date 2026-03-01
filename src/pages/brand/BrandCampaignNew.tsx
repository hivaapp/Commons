import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { useToast } from '../../components/ui/ToastProvider';
import { ArrowLeft, Check, Search, X, Eye } from 'lucide-react';

// ---------- Constants ----------

const TOTAL_STEPS = 5;

const CAMPAIGN_TYPES = [
    { value: 'research', label: 'Research', desc: 'Structured feedback from real users' },
    { value: 'review', label: 'Review', desc: 'Authentic UGC reviews' },
    { value: 'beta_test', label: 'Beta Test', desc: 'Real user testing with recorded feedback' },
    { value: 'content', label: 'Content', desc: 'Original content from your target audience' },
    { value: 'vote', label: 'Vote', desc: 'Community-validated decisions' },
    { value: 'referral', label: 'Referral', desc: 'Trust-driven leads' },
] as const;

type CampaignType = (typeof CAMPAIGN_TYPES)[number]['value'];

const DURATION_OPTIONS = ['3 days', '7 days', '14 days', 'Custom'] as const;
const TIME_OPTIONS = ['5 min', '10 min', '15 min', '20 min+'] as const;
const PROOF_TYPES = ['Screenshot', 'Receipt upload', 'Screen recording', 'Location'] as const;
const PRESET_BUDGETS = [25000, 50000, 100000, 200000];

const TASK_PLACEHOLDERS: Record<CampaignType, string> = {
    research: "Ask specific questions. Example: 'Rate the checkout flow from 1-5 and explain your rating.'",
    review: 'Describe what participants should try and what to write about.',
    beta_test: 'Describe the user flow to test and what feedback to capture.',
    content: 'Describe the type of content needed and any brand guidelines.',
    vote: 'List the options participants should vote on and evaluation criteria.',
    referral: 'Describe who to refer, the referral process, and verification steps.',
};

function formatAudience(n: number | null): string {
    if (!n) return '0';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toString();
}

// ---------- Helpers ----------

function formatINR(n: number): string {
    if (n >= 100000) return '₹' + (n / 100000).toFixed(n % 100000 === 0 ? 0 : 1) + 'L';
    if (n >= 1000) return '₹' + (n / 1000).toFixed(0) + 'k';
    return '₹' + n.toLocaleString('en-IN');
}

function formatINRFull(n: number): string {
    return '₹' + n.toLocaleString('en-IN');
}

function getMatchColor(match: number): string {
    if (match >= 80) return 'text-commons-success';
    if (match >= 60) return 'text-commons-warning';
    return 'text-commons-textMid';
}

// ---------- Step Components ----------

function StepType({
    selected,
    onChange,
}: {
    selected: CampaignType | null;
    onChange: (v: CampaignType) => void;
}) {
    return (
        <div>
            <h2 className="text-[22px] font-bold text-commons-text">What do you need?</h2>
            <p className="mb-6 mt-1 text-[14px] text-commons-textMid">
                Pick the outcome that matches your goal.
            </p>

            <div className="space-y-2">
                {CAMPAIGN_TYPES.map((t) => {
                    const isActive = selected === t.value;
                    return (
                        <button
                            key={t.value}
                            onClick={() => onChange(t.value)}
                            className={cn(
                                'flex h-14 w-full items-center gap-3 rounded-md border px-4 text-left transition-all focus:outline-none',
                                isActive
                                    ? 'border-l-2 border-l-commons-brand border-y-commons-brand border-r-commons-brand bg-commons-brandTint'
                                    : 'border-commons-border hover:bg-commons-surfaceAlt/50',
                            )}
                        >
                            {/* Radio circle */}
                            <span
                                className={cn(
                                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                    isActive
                                        ? 'border-commons-brand bg-commons-brand'
                                        : 'border-commons-border bg-white',
                                )}
                            >
                                {isActive && (
                                    <span className="h-2 w-2 rounded-full bg-white" />
                                )}
                            </span>

                            <div className="min-w-0 flex-1">
                                <span className="text-[14px] font-semibold text-commons-text">
                                    {t.label}
                                </span>
                                <span className="ml-2 text-[13px] text-commons-textMid">
                                    — {t.desc}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function StepBudget({
    budget,
    onChange,
    duration,
    onDurationChange,
    useSlider,
    onToggleSlider,
}: {
    budget: number;
    onChange: (v: number) => void;
    duration: string;
    onDurationChange: (v: string) => void;
    useSlider: boolean;
    onToggleSlider: () => void;
}) {
    const breakdown = useMemo(() => {
        const community = Math.round(budget * 0.64);
        const creator = Math.round(budget * 0.24);
        const platform = budget - community - creator;
        const participants = Math.round(budget / 470);
        const perPerson = participants > 0 ? Math.round(community / participants) : 0;
        return { community, creator, platform, total: budget, participants, perPerson };
    }, [budget]);

    return (
        <div>
            <h2 className="text-[22px] font-bold text-commons-text">Set your budget</h2>
            <p className="mb-6 mt-1 text-[13px] text-commons-textMid">
                Funds are held in escrow — released after verified task completion.
            </p>

            {/* Budget input */}
            <div className="mb-2 flex items-baseline justify-center gap-1">
                <span className="text-[20px] text-commons-textMid">₹</span>
                {useSlider ? (
                    <span className="text-[28px] font-bold text-commons-text">
                        {budget.toLocaleString('en-IN')}
                    </span>
                ) : (
                    <input
                        type="number"
                        value={budget}
                        onChange={(e) => onChange(Math.max(10000, Number(e.target.value)))}
                        className="w-40 border-none bg-transparent text-center text-[28px] font-bold text-commons-text focus:outline-none"
                        min={10000}
                        max={2000000}
                        step={5000}
                    />
                )}
            </div>

            <div className="mb-4 text-center">
                <button
                    onClick={onToggleSlider}
                    className="text-[12px] text-commons-brand hover:text-commons-brandHover"
                >
                    {useSlider ? 'Type amount instead' : 'Use slider instead'}
                </button>
            </div>

            {useSlider && (
                <div className="mb-4">
                    <input
                        type="range"
                        min={10000}
                        max={2000000}
                        step={5000}
                        value={budget}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="w-full accent-commons-brand"
                    />
                    <div className="mt-1 flex justify-between text-[11px] text-commons-textLight">
                        <span>₹10k</span>
                        <span>₹20L</span>
                    </div>
                </div>
            )}

            {/* Preset buttons */}
            <div className="mb-6 flex justify-center gap-2">
                {PRESET_BUDGETS.map((amt) => (
                    <button
                        key={amt}
                        onClick={() => onChange(amt)}
                        className={cn(
                            'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                            budget === amt
                                ? 'bg-commons-brandTint text-commons-brand'
                                : 'bg-commons-surfaceAlt text-commons-textMid hover:text-commons-text',
                        )}
                    >
                        {formatINR(amt)}
                    </button>
                ))}
            </div>

            {/* Live breakdown */}
            <div className="space-y-2">
                {[
                    { label: 'Community payouts', value: formatINRFull(breakdown.community), pct: '64%' },
                    { label: 'Creator fee', value: formatINRFull(breakdown.creator), pct: '24%' },
                    { label: 'Platform fee', value: formatINRFull(breakdown.platform), pct: '12%' },
                ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                        <span className="text-[14px] text-commons-textMid">{row.label}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-[14px] text-commons-text">{row.value}</span>
                            <span className="w-8 text-right text-[12px] text-commons-textLight">({row.pct})</span>
                        </div>
                    </div>
                ))}

                <div className="my-2 border-t border-commons-textLight/30" />

                <div className="flex items-center justify-between">
                    <span className="text-[14px] font-semibold text-commons-text">Total</span>
                    <span className="text-[14px] font-semibold text-commons-text">
                        {formatINRFull(breakdown.total)}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[14px] text-commons-textMid">Participants</span>
                    <span className="text-[14px] text-commons-text">~{breakdown.participants} people</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[14px] text-commons-textMid">Per person</span>
                    <span className="text-[14px] text-commons-text">~{formatINRFull(breakdown.perPerson)}</span>
                </div>
            </div>

            {/* Duration */}
            <div className="mt-8">
                <p className="mb-2 text-[13px] font-medium text-commons-text">Campaign duration</p>
                <div className="flex rounded-md border border-commons-border">
                    {DURATION_OPTIONS.map((d) => (
                        <button
                            key={d}
                            onClick={() => onDurationChange(d)}
                            className={cn(
                                'flex-1 py-2 text-[13px] font-medium transition-colors first:rounded-l-md last:rounded-r-md',
                                duration === d
                                    ? 'bg-commons-brand text-white'
                                    : 'bg-white text-commons-textMid hover:bg-commons-surfaceAlt',
                            )}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StepBrief({
    campaignType,
    productName,
    onProductName,
    productDesc,
    onProductDesc,
    instructions,
    onInstructions,
    estimatedTime,
    onEstimatedTime,
    proofRequired,
    onProofRequired,
    proofType,
    onProofType,
    onPreview,
}: {
    campaignType: CampaignType;
    productName: string;
    onProductName: (v: string) => void;
    productDesc: string;
    onProductDesc: (v: string) => void;
    instructions: string;
    onInstructions: (v: string) => void;
    estimatedTime: string;
    onEstimatedTime: (v: string) => void;
    proofRequired: boolean;
    onProofRequired: (v: boolean) => void;
    proofType: string;
    onProofType: (v: string) => void;
    onPreview: () => void;
}) {
    const inputClasses =
        'w-full rounded-md border border-commons-border bg-white px-3 text-[14px] placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand';

    return (
        <div>
            <h2 className="text-[22px] font-bold text-commons-text">Write your brief</h2>
            <div className="mt-1 mb-6" />

            {/* Product name */}
            <div className="mb-4">
                <label className="mb-1 block text-[12px] text-commons-textMid">Product name</label>
                <input
                    type="text"
                    value={productName}
                    onChange={(e) => onProductName(e.target.value)}
                    placeholder="Your product"
                    className={cn(inputClasses, 'h-10')}
                />
            </div>

            {/* Product description */}
            <div className="mb-4">
                <label className="mb-1 block text-[12px] text-commons-textMid">Product description</label>
                <textarea
                    value={productDesc}
                    onChange={(e) => onProductDesc(e.target.value)}
                    placeholder="What does your product do? Who is it for?"
                    rows={5}
                    className={cn(inputClasses, 'py-2')}
                />
            </div>

            {/* Task instructions */}
            <div className="mb-4">
                <label className="mb-1 block text-[12px] text-commons-textMid">Task instructions</label>
                <textarea
                    value={instructions}
                    onChange={(e) => onInstructions(e.target.value)}
                    placeholder={TASK_PLACEHOLDERS[campaignType]}
                    rows={6}
                    className={cn(inputClasses, 'py-2')}
                />
            </div>

            {/* Estimated time */}
            <div className="mb-4">
                <p className="mb-2 text-[13px] font-medium text-commons-text">Estimated time</p>
                <div className="flex rounded-md border border-commons-border">
                    {TIME_OPTIONS.map((t) => (
                        <button
                            key={t}
                            onClick={() => onEstimatedTime(t)}
                            className={cn(
                                'flex-1 py-2 text-[13px] font-medium transition-colors first:rounded-l-md last:rounded-r-md',
                                estimatedTime === t
                                    ? 'bg-commons-brand text-white'
                                    : 'bg-white text-commons-textMid hover:bg-commons-surfaceAlt',
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Proof required */}
            <div className="mb-4">
                <div className="flex items-center justify-between py-2">
                    <div>
                        <p className="text-[14px] text-commons-text">Proof required</p>
                        <p className="text-[12px] text-commons-textMid">Require participants to submit proof</p>
                    </div>
                    <button
                        onClick={() => onProofRequired(!proofRequired)}
                        className={cn(
                            'relative h-5 w-9 rounded-full transition-colors',
                            proofRequired ? 'bg-commons-brand' : 'bg-commons-border',
                        )}
                    >
                        <span
                            className={cn(
                                'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                                proofRequired && 'translate-x-4',
                            )}
                        />
                    </button>
                </div>

                {proofRequired && (
                    <div className="mt-2">
                        <label className="mb-1 block text-[12px] text-commons-textMid">Proof type</label>
                        <select
                            value={proofType}
                            onChange={(e) => onProofType(e.target.value)}
                            className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-[14px] text-commons-text focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                        >
                            {PROOF_TYPES.map((pt) => (
                                <option key={pt} value={pt}>{pt}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Preview link */}
            <button
                onClick={onPreview}
                className="flex items-center gap-1.5 text-[13px] font-medium text-commons-brand hover:text-commons-brandHover"
            >
                <Eye className="h-3.5 w-3.5" />
                Preview what participants see →
            </button>
        </div>
    );
}

function StepCreator({
    selectedCreator,
    onSelect,
    creators,
    creatorsLoading,
    creatorSearch,
    onCreatorSearch,
}: {
    selectedCreator: string | null;
    onSelect: (id: string | null) => void;
    creators: any[];
    creatorsLoading: boolean;
    creatorSearch: string;
    onCreatorSearch: (v: string) => void;
}) {
    return (
        <div>
            <h2 className="text-[22px] font-bold text-commons-text">Choose a creator</h2>
            <p className="mb-4 mt-1 text-[13px] text-commons-textMid">
                Commons will suggest creators whose community fits your target.
            </p>

            {/* Let Commons choose */}
            <button
                onClick={() => onSelect(null)}
                className={cn(
                    'w-full text-left p-3 rounded-lg border-2 transition-colors mb-4',
                    selectedCreator === null
                        ? 'border-commons-brand bg-commons-brandTint'
                        : 'border-commons-border bg-white hover:border-commons-textMid',
                )}
            >
                <p className="text-[14px] font-medium text-commons-text">Let Commons choose</p>
                <p className="text-[12px] text-commons-textMid mt-0.5">
                    We'll match the best available creator for your campaign
                </p>
            </button>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-commons-textLight" />
                <input
                    type="text"
                    value={creatorSearch}
                    onChange={(e) => onCreatorSearch(e.target.value)}
                    placeholder="Search by handle..."
                    className="h-10 w-full rounded-md border border-commons-border bg-white pl-9 pr-3 text-[14px] placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                />
            </div>

            {/* Creator list */}
            {creatorsLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-md" />
                    ))}
                </div>
            ) : creators.length === 0 ? (
                <p className="py-6 text-center text-[14px] text-commons-textMid">No creators found</p>
            ) : (
                <div className="divide-y divide-commons-border">
                    {creators.map((c) => {
                        const match = Math.round((c.trust_score ?? 0) / 10);
                        return (
                            <div
                                key={c.id}
                                className={cn(
                                    'flex items-center gap-3 py-3',
                                    selectedCreator === c.id && 'bg-commons-brandTint/30',
                                )}
                            >
                                {/* Avatar */}
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-commons-surfaceAlt text-[13px] font-semibold text-commons-textMid">
                                    {(c.handle ?? '?')[0].toUpperCase()}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[14px] font-medium text-commons-text">@{c.handle}</span>
                                        {c.niche_primary && (
                                            <span className="text-[12px] text-commons-textMid">· {c.niche_primary}</span>
                                        )}
                                    </div>
                                    <p className="text-[12px] text-commons-textMid">
                                        {c.activation_rate != null ? `${c.activation_rate}% activation` : ''}
                                        {c.activation_rate != null && c.audience_size_total != null ? ' · ' : ''}
                                        {c.audience_size_total != null ? `${formatAudience(c.audience_size_total)} community` : ''}
                                    </p>
                                </div>

                                {/* Match score */}
                                <span className={cn('shrink-0 text-[13px] font-semibold', getMatchColor(match))}>
                                    Match: {match}%
                                </span>

                                {/* Invite button */}
                                {selectedCreator === c.id ? (
                                    <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-commons-success">
                                        <Check className="h-3.5 w-3.5" />
                                        Invited
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => onSelect(c.id)}
                                        className="shrink-0 text-[13px] font-medium text-commons-brand hover:text-commons-brandHover"
                                    >
                                        Invite →
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function StepReview({
    campaignType,
    budget,
    duration,
    selectedCreator,
    creatorHandle,
    onFund,
    funding,
}: {
    campaignType: CampaignType;
    budget: number;
    duration: string;
    selectedCreator: string | null;
    creatorHandle: string | null;
    onFund: () => void;
    funding: boolean;
}) {
    const breakdown = useMemo(() => {
        const community = Math.round(budget * 0.64);
        const participants = Math.round(budget / 470);
        const perPerson = participants > 0 ? Math.round(community / participants) : 0;
        return { participants, perPerson };
    }, [budget]);

    const typeLabel = CAMPAIGN_TYPES.find((t) => t.value === campaignType)?.label ?? '—';

    const creatorLabel = selectedCreator
        ? `@${creatorHandle ?? 'creator'} (pending)`
        : 'Commons will match';

    const summaryRows = [
        { label: 'Type', value: typeLabel },
        { label: 'Budget', value: formatINRFull(budget) },
        { label: 'Participants', value: `~${breakdown.participants} people` },
        { label: 'Per person', value: formatINRFull(breakdown.perPerson) },
        { label: 'Creator', value: creatorLabel },
        { label: 'Duration', value: duration },
    ];

    return (
        <div>
            <h2 className="text-[22px] font-bold text-commons-text">Review your campaign</h2>
            <div className="mt-1 mb-6" />

            {/* Summary rows */}
            <div className="space-y-3">
                {summaryRows.map((r) => (
                    <div key={r.label} className="flex items-center justify-between">
                        <span className="text-[14px] text-commons-textMid">{r.label}</span>
                        <span className="text-[14px] font-medium text-commons-text">{r.value}</span>
                    </div>
                ))}
            </div>

            {/* Escrow notice */}
            <div className="mt-6 mb-4 rounded-md border-l-2 border-l-commons-warning bg-commons-warningBg p-3">
                <p className="text-[13px] leading-relaxed text-commons-text">
                    {formatINRFull(budget)} will be deposited to escrow before your campaign launches.
                    You'll receive a full refund if the campaign doesn't meet our quality standards.
                </p>
            </div>

            {/* Fund button */}
            <Button
                fullWidth
                onClick={onFund}
                disabled={funding}
                className="h-12 text-[15px]"
            >
                {funding ? 'Processing...' : `Fund Campaign · ${formatINRFull(budget)}`}
            </Button>

            <p className="mt-3 text-center text-[11px] text-commons-textLight">
                Secured by Stripe · Funds in escrow until delivery
            </p>
        </div>
    );
}

function ConfirmationPage({ onBack }: { onBack: () => void }) {
    return (
        <div className="flex flex-col items-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-commons-successBg">
                <Check className="h-8 w-8 text-commons-success" />
            </div>
            <h2 className="mt-5 text-[22px] font-bold text-commons-text">Campaign funded!</h2>
            <p className="mt-2 max-w-[320px] text-[14px] text-commons-textMid">
                We're reviewing your campaign. You'll be notified within 4 hours.
            </p>
            <button
                onClick={onBack}
                className="mt-6 rounded-md border border-commons-border bg-white px-6 py-2.5 text-[14px] font-medium text-commons-text transition-colors hover:bg-commons-surfaceAlt"
            >
                Back to dashboard
            </button>
        </div>
    );
}

// ---------- Preview Modal ----------

function PreviewModal({
    open,
    onClose,
    productName,
    productDesc,
    instructions,
    campaignType,
    estimatedTime,
}: {
    open: boolean;
    onClose: () => void;
    productName: string;
    productDesc: string;
    instructions: string;
    campaignType: CampaignType;
    estimatedTime: string;
}) {
    if (!open) return null;

    const typeLabel = CAMPAIGN_TYPES.find((t) => t.value === campaignType)?.label ?? '';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />
            <div className="relative w-full max-w-[440px] animate-slide-up rounded-xl bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-commons-text">Participant view</h3>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-commons-textMid hover:bg-commons-surfaceAlt"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="rounded-lg border border-commons-border p-4">
                    <span className="inline-block rounded-sm bg-commons-surfaceAlt px-2 py-0.5 text-[10px] font-medium text-commons-textMid">
                        {typeLabel}
                    </span>
                    <h4 className="mt-2 text-[16px] font-bold text-commons-text">
                        {productName || 'Product Name'}
                    </h4>
                    <p className="mt-1 text-[13px] text-commons-textMid">
                        {productDesc || 'Product description will appear here.'}
                    </p>
                    <div className="my-3 border-t border-commons-border" />
                    <p className="text-[13px] font-medium text-commons-text">What you need to do</p>
                    <p className="mt-1 text-[13px] text-commons-textMid">
                        {instructions || 'Task instructions will appear here.'}
                    </p>
                    <p className="mt-3 text-[12px] text-commons-textLight">
                        ⏱ Estimated time: {estimatedTime}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ---------- Main ----------

export default function BrandCampaignNew() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const toast = useToast();
    const [step, setStep] = useState(1);

    // Step 1
    const [campaignType, setCampaignType] = useState<CampaignType | null>(null);

    // Step 2
    const [budget, setBudget] = useState(80000);
    const [duration, setDuration] = useState('7 days');
    const [useSlider, setUseSlider] = useState(true);

    // Step 3
    const [productName, setProductName] = useState('');
    const [productDesc, setProductDesc] = useState('');
    const [instructions, setInstructions] = useState('');
    const [estimatedTime, setEstimatedTime] = useState('10 min');
    const [proofRequired, setProofRequired] = useState(false);
    const [proofType, setProofType] = useState('Screenshot');
    const [showPreview, setShowPreview] = useState(false);

    // Step 4
    const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
    const [creatorSearch, setCreatorSearch] = useState('');

    const { data: realCreators = [], isLoading: creatorsLoading } = useQuery({
        queryKey: ['verified-creators', creatorSearch],
        queryFn: async () => {
            let query = supabase
                .from('creator_profiles')
                .select('id, handle, niche_primary, activation_rate, trust_score, audience_size_total, tier')
                .not('handle', 'is', null)
                .order('trust_score', { ascending: false })
                .limit(20);

            if (creatorSearch.trim()) {
                query = query.ilike('handle', `%${creatorSearch}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data ?? [];
        },
        staleTime: 60_000,
    });

    const selectedCreatorHandle = realCreators.find((c: any) => c.id === selectedCreator)?.handle ?? null;

    // Step 5
    const [funding, setFunding] = useState(false);

    const progress = (step / TOTAL_STEPS) * 100;

    const canContinue = (): boolean => {
        switch (step) {
            case 1: return campaignType !== null;
            case 2: return budget >= 10000;
            case 3: return productName.trim().length > 0;
            case 4: return true; // Creator is optional
            case 5: return true;
            default: return false;
        }
    };

    const handleNext = () => {
        if (step < TOTAL_STEPS) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleFund = async () => {
        if (!user?.id || !campaignType) return;
        setFunding(true);
        try {
            // Parse numeric values from form state
            const timeMinutes = parseInt(estimatedTime) || 10;
            const taskMinSeconds = timeMinutes * 60;
            const participants = Math.max(1, Math.round(budget / 470));
            const communityBudget = Math.round(budget * 0.64);
            const perTaskPaise = participants > 0 ? Math.round(communityBudget / participants) : 0;
            const creatorFeePaise = Math.round(budget * 0.20);
            const platformFeePaise = budget - communityBudget - creatorFeePaise;

            const { data, error } = await supabase
                .from('campaigns')
                .insert({
                    brand_id: user.id,
                    title: productName,
                    description: productDesc,
                    campaign_type: campaignType,
                    budget_paise: budget,
                    per_task_paise: perTaskPaise,
                    target_participants: participants,
                    task_instructions: instructions,
                    task_duration_minutes: timeMinutes,
                    task_min_seconds: taskMinSeconds,
                    proof_required: proofRequired,
                    proof_type: proofRequired ? proofType : null,
                    creator_fee_paise: creatorFeePaise,
                    creator_fee_rate: 0.20,
                    platform_fee_paise: platformFeePaise,
                    creator_id: selectedCreator,
                    status: 'draft',
                })
                .select('id')
                .single();

            if (error) throw error;
            navigate(`/brand/campaigns/pay/${data.id}`);
        } catch (err: any) {
            console.error('Failed to save campaign:', err);
            toast.error('Failed to save campaign', err?.message ?? 'Please try again');
            setFunding(false);
        }
    };



    return (
        <div>
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
                    {step} / {TOTAL_STEPS}
                </span>
            </div>

            {/* Back nav */}
            <button
                onClick={step === 1 ? () => navigate('/brand/campaigns') : handleBack}
                className="mb-5 flex items-center gap-1 text-[13px] text-commons-textMid hover:text-commons-text"
            >
                <ArrowLeft className="h-4 w-4" />
                {step === 1 ? 'Campaigns' : 'Back'}
            </button>

            <div className="mx-auto max-w-[560px]">
                {step === 1 && (
                    <StepType selected={campaignType} onChange={setCampaignType} />
                )}

                {step === 2 && (
                    <StepBudget
                        budget={budget}
                        onChange={setBudget}
                        duration={duration}
                        onDurationChange={setDuration}
                        useSlider={useSlider}
                        onToggleSlider={() => setUseSlider((v) => !v)}
                    />
                )}

                {step === 3 && campaignType && (
                    <StepBrief
                        campaignType={campaignType}
                        productName={productName}
                        onProductName={setProductName}
                        productDesc={productDesc}
                        onProductDesc={setProductDesc}
                        instructions={instructions}
                        onInstructions={setInstructions}
                        estimatedTime={estimatedTime}
                        onEstimatedTime={setEstimatedTime}
                        proofRequired={proofRequired}
                        onProofRequired={setProofRequired}
                        proofType={proofType}
                        onProofType={setProofType}
                        onPreview={() => setShowPreview(true)}
                    />
                )}

                {step === 4 && (
                    <StepCreator
                        selectedCreator={selectedCreator}
                        onSelect={setSelectedCreator}
                        creators={realCreators}
                        creatorsLoading={creatorsLoading}
                        creatorSearch={creatorSearch}
                        onCreatorSearch={setCreatorSearch}
                    />
                )}

                {step === 5 && campaignType && (
                    <StepReview
                        campaignType={campaignType}
                        budget={budget}
                        duration={duration}
                        selectedCreator={selectedCreator}
                        creatorHandle={selectedCreatorHandle}
                        onFund={handleFund}
                        funding={funding}
                    />
                )}

                {/* Navigation (steps 1-4 only) */}
                {step < TOTAL_STEPS && (
                    <div className="mt-8">
                        <Button
                            fullWidth
                            onClick={handleNext}
                            disabled={!canContinue()}
                        >
                            Continue →
                        </Button>
                    </div>
                )}
            </div>

            {/* Preview modal */}
            <PreviewModal
                open={showPreview}
                onClose={() => setShowPreview(false)}
                productName={productName}
                productDesc={productDesc}
                instructions={instructions}
                campaignType={campaignType ?? 'research'}
                estimatedTime={estimatedTime}
            />
        </div>
    );
}
