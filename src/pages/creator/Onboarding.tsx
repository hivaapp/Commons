import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { X, Plus } from 'lucide-react';

const TOTAL_STEPS = 5;

const PLATFORMS = ['Instagram', 'YouTube', 'TikTok', 'LinkedIn', 'X'] as const;

const NICHES = [
    'Tech',
    'Beauty',
    'Fashion',
    'Food',
    'Travel',
    'Fitness',
    'Finance',
    'Gaming',
    'Education',
    'Lifestyle',
    'Health',
    'Parenting',
    'Music',
    'Photography',
    'Business',
] as const;

const SUB_NICHES: Record<string, string[]> = {
    Tech: ['AI / ML', 'SaaS', 'Mobile Apps', 'Web Dev', 'Gadgets', 'Crypto'],
    Beauty: ['Skincare', 'Makeup', 'Haircare', 'Nail Art', 'Fragrances'],
    Fashion: ['Streetwear', 'Luxury', 'Sustainable', 'Ethnic', 'Accessories'],
    Food: ['Recipes', 'Restaurant Reviews', 'Healthy Eating', 'Baking', 'Street Food'],
    Travel: ['Budget Travel', 'Luxury Travel', 'Solo Travel', 'Adventure', 'City Guides'],
    Fitness: ['Gym', 'Yoga', 'Running', 'CrossFit', 'Home Workouts'],
    Finance: ['Personal Finance', 'Stock Market', 'Crypto', 'Real Estate', 'Budgeting'],
    Gaming: ['PC', 'Console', 'Mobile', 'Esports', 'Game Dev'],
    Education: ['Coding', 'Languages', 'Science', 'Career', 'Study Tips'],
    Lifestyle: ['Minimalism', 'Self-Improvement', 'Productivity', 'Home Decor', 'Wellness'],
    Health: ['Mental Health', 'Nutrition', 'Medical', 'Alternative Medicine', 'Sleep'],
    Parenting: ['Newborn', 'Toddler', 'School Age', 'Teen', 'Single Parent'],
    Music: ['Production', 'Singing', 'Instruments', 'DJing', 'Music Theory'],
    Photography: ['Portrait', 'Landscape', 'Street', 'Product', 'Editing'],
    Business: ['Startups', 'Marketing', 'E-commerce', 'Leadership', 'Freelancing'],
};

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi', 'Gujarati', 'Malayalam', 'Punjabi'] as const;

const BUDGET_OPTIONS = ['₹5k', '₹25k', '₹1L', '₹5L+'] as const;
const BUDGET_VALUES = [5000, 25000, 100000, 500000] as const;

const CAMPAIGN_TYPES = ['Research', 'Review', 'Referral', 'Content', 'Beta Test', 'Vote'] as const;

const CATEGORIES_TO_AVOID = ['Gambling', 'Adult', 'Tobacco', 'Alcohol', 'Crypto', 'MLM', 'Political', 'Religious'] as const;

interface SocialEntry {
    platform: string;
    url: string;
    engagementRate: string;
}

interface AudienceEntry {
    platform: string;
    followers: string;
    avgComments: string;
    avgLikes: string;
}

export default function CreatorOnboarding() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Step 1: Socials
    const [socials, setSocials] = useState<SocialEntry[]>([
        { platform: '', url: '', engagementRate: '' },
    ]);

    // Step 2: Niche
    const [primaryNiche, setPrimaryNiche] = useState('');
    const [subNiches, setSubNiches] = useState<string[]>([]);
    const [contentLanguage, setContentLanguage] = useState('');

    // Step 3: Audience (auto-derived from socials)
    const [audienceData, setAudienceData] = useState<AudienceEntry[]>([]);

    // Step 4: Preferences
    const [minBudget, setMinBudget] = useState<number>(5000);
    const [campaignTypes, setCampaignTypes] = useState<string[]>([]);
    const [avoidCategories, setAvoidCategories] = useState<string[]>([]);
    const [upiId, setUpiId] = useState('');

    // Step 5: Done
    const [agreed, setAgreed] = useState(false);

    const progress = (currentStep / TOTAL_STEPS) * 100;

    const addSocial = () => {
        if (socials.length < 5) {
            setSocials([...socials, { platform: '', url: '', engagementRate: '' }]);
        }
    };

    const removeSocial = (index: number) => {
        if (socials.length > 1) {
            setSocials(socials.filter((_, i) => i !== index));
        }
    };

    const updateSocial = (index: number, field: keyof SocialEntry, value: string) => {
        const updated = [...socials];
        updated[index] = { ...updated[index], [field]: value };
        setSocials(updated);
    };

    const toggleSubNiche = (niche: string) => {
        if (subNiches.includes(niche)) {
            setSubNiches(subNiches.filter((n) => n !== niche));
        } else if (subNiches.length < 3) {
            setSubNiches([...subNiches, niche]);
        }
    };

    const toggleCampaignType = (type: string) => {
        setCampaignTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
        );
    };

    const toggleAvoidCategory = (cat: string) => {
        setAvoidCategories((prev) =>
            prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
        );
    };

    // When moving from step 1→2, prepare audience data
    const prepareAudienceData = () => {
        const connected = socials.filter((s) => s.platform && s.url);
        setAudienceData(
            connected.map((s) => ({
                platform: s.platform,
                followers: '',
                avgComments: '',
                avgLikes: '',
            })),
        );
    };

    const canProceed = (): boolean => {
        switch (currentStep) {
            case 1:
                return socials.some((s) => s.platform && s.url);
            case 2:
                return !!primaryNiche && !!contentLanguage;
            case 3:
                return audienceData.every((a) => a.followers);
            case 4:
                return true;
            case 5:
                return agreed;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (currentStep === 1) prepareAudienceData();
        if (currentStep < TOTAL_STEPS) setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        if (!user) return;
        setSubmitting(true);

        try {
            // Build social links JSON
            const socialLinks = socials
                .filter((s) => s.platform && s.url)
                .map((s) => ({
                    platform: s.platform,
                    url: s.url,
                    engagement_rate: parseFloat(s.engagementRate) || 0,
                }));

            // Build audience geo JSON
            const audienceGeo = audienceData.reduce(
                (acc, a) => ({
                    ...acc,
                    [a.platform]: {
                        followers: parseInt(a.followers) || 0,
                        avg_comments: parseInt(a.avgComments) || 0,
                        avg_likes: parseInt(a.avgLikes) || 0,
                    },
                }),
                {},
            );

            const totalFollowers = audienceData.reduce(
                (sum, a) => sum + (parseInt(a.followers) || 0),
                0,
            );

            await supabase
                .from('creator_profiles')
                .update({
                    social_links: socialLinks,
                    niche_primary: primaryNiche,
                    niches: subNiches,
                    audience_geo: audienceGeo,
                    audience_size_total: totalFollowers,
                    min_campaign_budget_paise: minBudget * 100,
                    onboarding_step: 5,
                })
                .eq('id', user.id);

            // Set verification pending
            await supabase
                .from('profiles')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', user.id);

            navigate('/creator/dashboard', { replace: true });
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

            <div className="mx-auto max-w-[480px] px-6 pb-12 pt-12">
                {/* ── Step 1: Socials ─────────────────────────────── */}
                {currentStep === 1 && (
                    <div>
                        <h2 className="text-xl font-bold text-commons-text">
                            Connect your platforms
                        </h2>
                        <p className="mb-6 mt-1 text-sm text-commons-textMid">
                            We measure engagement, not follower count.
                        </p>

                        <div className="space-y-4">
                            {socials.map((social, i) => (
                                <div key={i} className="relative">
                                    {socials.length > 1 && (
                                        <button
                                            onClick={() => removeSocial(i)}
                                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-commons-border bg-white text-commons-textMid hover:text-commons-error"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}

                                    {/* Platform select */}
                                    <div>
                                        <label className="mb-1 block text-xs text-commons-textMid">
                                            Platform
                                        </label>
                                        <select
                                            value={social.platform}
                                            onChange={(e) =>
                                                updateSocial(i, 'platform', e.target.value)
                                            }
                                            className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm text-commons-text focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                                        >
                                            <option value="">Select platform</option>
                                            {PLATFORMS.map((p) => (
                                                <option
                                                    key={p}
                                                    value={p}
                                                    disabled={socials.some(
                                                        (s, j) => j !== i && s.platform === p,
                                                    )}
                                                >
                                                    {p}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* URL */}
                                    <div className="mt-3">
                                        <label className="mb-1 block text-xs text-commons-textMid">
                                            Profile URL
                                        </label>
                                        <input
                                            type="url"
                                            value={social.url}
                                            onChange={(e) =>
                                                updateSocial(i, 'url', e.target.value)
                                            }
                                            placeholder="https://..."
                                            className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                                        />
                                    </div>

                                    {/* Engagement rate */}
                                    <div className="mt-3">
                                        <label className="mb-1 block text-xs text-commons-textMid">
                                            Estimated engagement rate (%)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={social.engagementRate}
                                            onChange={(e) =>
                                                updateSocial(i, 'engagementRate', e.target.value)
                                            }
                                            placeholder="e.g. 3.5"
                                            className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                                        />
                                        <p className="mt-1 text-[11px] text-commons-textLight">
                                            Check HypeAuditor.com
                                        </p>
                                    </div>

                                    {i < socials.length - 1 && (
                                        <div className="mt-4 border-b border-commons-border" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {socials.length < 5 && (
                            <button
                                onClick={addSocial}
                                className="mt-4 flex items-center gap-1 text-sm text-commons-brand hover:text-commons-brandHover"
                            >
                                <Plus className="h-4 w-4" />
                                Add another platform
                            </button>
                        )}
                    </div>
                )}

                {/* ── Step 2: Niche ───────────────────────────────── */}
                {currentStep === 2 && (
                    <div>
                        <h2 className="text-xl font-bold text-commons-text">
                            What's your focus?
                        </h2>

                        <div className="mt-6">
                            <label className="mb-1 block text-xs text-commons-textMid">
                                Primary niche
                            </label>
                            <select
                                value={primaryNiche}
                                onChange={(e) => {
                                    setPrimaryNiche(e.target.value);
                                    setSubNiches([]);
                                }}
                                className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm text-commons-text focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                            >
                                <option value="">Select niche</option>
                                {NICHES.map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {primaryNiche && SUB_NICHES[primaryNiche] && (
                            <div className="mt-4">
                                <label className="mb-2 block text-xs text-commons-textMid">
                                    Sub-niches (max 3)
                                </label>
                                <div className="space-y-2">
                                    {SUB_NICHES[primaryNiche].map((sub) => (
                                        <label
                                            key={sub}
                                            className="flex items-center gap-2 text-sm text-commons-text"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={subNiches.includes(sub)}
                                                onChange={() => toggleSubNiche(sub)}
                                                disabled={
                                                    !subNiches.includes(sub) &&
                                                    subNiches.length >= 3
                                                }
                                                className="h-4 w-4 rounded border-commons-border text-commons-brand focus:ring-commons-brand"
                                            />
                                            {sub}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-4">
                            <label className="mb-1 block text-xs text-commons-textMid">
                                Content language
                            </label>
                            <select
                                value={contentLanguage}
                                onChange={(e) => setContentLanguage(e.target.value)}
                                className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm text-commons-text focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                            >
                                <option value="">Select language</option>
                                {LANGUAGES.map((l) => (
                                    <option key={l} value={l}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* ── Step 3: Audience ────────────────────────────── */}
                {currentStep === 3 && (
                    <div>
                        <h2 className="text-xl font-bold text-commons-text">
                            Your honest numbers
                        </h2>

                        <div className="mt-6 space-y-6">
                            {audienceData.map((entry, i) => (
                                <div key={entry.platform}>
                                    <p className="mb-3 text-sm font-semibold text-commons-text">
                                        {entry.platform}
                                    </p>

                                    <div>
                                        <label className="mb-1 block text-xs text-commons-textMid">
                                            Total followers
                                        </label>
                                        <input
                                            type="number"
                                            value={entry.followers}
                                            onChange={(e) => {
                                                const updated = [...audienceData];
                                                updated[i] = {
                                                    ...updated[i],
                                                    followers: e.target.value,
                                                };
                                                setAudienceData(updated);
                                            }}
                                            placeholder="e.g. 15000"
                                            className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                                        />
                                    </div>

                                    <div className="mt-3">
                                        <label className="mb-1 block text-xs text-commons-textMid">
                                            Avg comments per post
                                        </label>
                                        <input
                                            type="number"
                                            value={entry.avgComments}
                                            onChange={(e) => {
                                                const updated = [...audienceData];
                                                updated[i] = {
                                                    ...updated[i],
                                                    avgComments: e.target.value,
                                                };
                                                setAudienceData(updated);
                                            }}
                                            placeholder="e.g. 45"
                                            className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                                        />
                                    </div>

                                    <div className="mt-3">
                                        <label className="mb-1 block text-xs text-commons-textMid">
                                            Avg likes per post
                                        </label>
                                        <input
                                            type="number"
                                            value={entry.avgLikes}
                                            onChange={(e) => {
                                                const updated = [...audienceData];
                                                updated[i] = {
                                                    ...updated[i],
                                                    avgLikes: e.target.value,
                                                };
                                                setAudienceData(updated);
                                            }}
                                            placeholder="e.g. 300"
                                            className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Step 4: Preferences ─────────────────────────── */}
                {currentStep === 4 && (
                    <div>
                        <h2 className="text-xl font-bold text-commons-text">
                            Campaign preferences
                        </h2>

                        {/* Minimum budget */}
                        <div className="mt-6">
                            <label className="mb-2 block text-xs text-commons-textMid">
                                Minimum budget
                            </label>
                            <div className="flex overflow-hidden rounded-md border border-commons-border">
                                {BUDGET_OPTIONS.map((label, i) => (
                                    <button
                                        key={label}
                                        onClick={() => setMinBudget(BUDGET_VALUES[i])}
                                        className={`flex-1 py-2 text-sm font-medium transition-colors ${minBudget === BUDGET_VALUES[i]
                                                ? 'bg-commons-brand text-white'
                                                : 'bg-white text-commons-text hover:bg-commons-surfaceAlt'
                                            } ${i > 0 ? 'border-l border-commons-border' : ''}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Campaign types */}
                        <div className="mt-4">
                            <label className="mb-2 block text-xs text-commons-textMid">
                                Campaign types
                            </label>
                            <div className="space-y-2">
                                {CAMPAIGN_TYPES.map((type) => (
                                    <label
                                        key={type}
                                        className="flex items-center gap-2 text-sm text-commons-text"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={campaignTypes.includes(type)}
                                            onChange={() => toggleCampaignType(type)}
                                            className="h-4 w-4 rounded border-commons-border text-commons-brand focus:ring-commons-brand"
                                        />
                                        {type}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Categories to avoid */}
                        <div className="mt-4">
                            <label className="mb-1 block text-xs text-commons-textMid">
                                Categories to avoid
                            </label>
                            <div className="space-y-2">
                                {CATEGORIES_TO_AVOID.map((cat) => (
                                    <label
                                        key={cat}
                                        className="flex items-center gap-2 text-sm text-commons-text"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={avoidCategories.includes(cat)}
                                            onChange={() => toggleAvoidCategory(cat)}
                                            className="h-4 w-4 rounded border-commons-border text-commons-brand focus:ring-commons-brand"
                                        />
                                        {cat}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* UPI ID */}
                        <div className="mt-4">
                            <label className="mb-1 block text-xs text-commons-textMid">
                                UPI ID (optional)
                            </label>
                            <input
                                type="text"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                placeholder="yourname@upi"
                                className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                            />
                        </div>
                    </div>
                )}

                {/* ── Step 5: Done ────────────────────────────────── */}
                {currentStep === 5 && (
                    <div>
                        <h2 className="text-xl font-bold text-commons-text">You're almost in</h2>
                        <p className="mb-6 mt-1 text-sm text-commons-textMid">
                            Before accessing the marketplace, you'll complete one paid pilot
                            campaign (₹5k–₹15k).
                        </p>

                        <ul className="space-y-3 text-sm text-commons-text">
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5 text-commons-textMid">•</span>
                                Paid just like a real campaign
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5 text-commons-textMid">•</span>
                                We measure how many of your followers actually participate
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5 text-commons-textMid">•</span>
                                Minimum 1.5% activation to unlock full access
                            </li>
                        </ul>

                        <label className="mt-6 flex items-start gap-2 text-sm text-commons-text">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-commons-border text-commons-brand focus:ring-commons-brand"
                            />
                            I understand my pilot results set my tier level
                        </label>
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
                            onClick={handleSubmit}
                            disabled={!agreed || submitting}
                            className="h-10 flex-1 rounded-md bg-commons-brand text-sm font-medium text-white transition-colors hover:bg-commons-brandHover disabled:opacity-50"
                        >
                            {submitting ? 'Submitting…' : 'Submit application'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
