import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { Upload } from 'lucide-react';

const TOTAL_STEPS = 2;

const INDUSTRIES = [
    'Technology',
    'E-commerce',
    'Finance',
    'Healthcare',
    'Education',
    'Food & Beverage',
    'Fashion',
    'Media & Entertainment',
    'Travel & Hospitality',
    'Real Estate',
    'Automotive',
    'Consumer Goods',
    'Consulting',
    'Marketing & Advertising',
    'Non-profit',
    'Other',
] as const;

const ACKNOWLEDGEMENTS = [
    'Campaign funds are deposited before launch (escrow)',
    'Brief cannot be changed after creator accepts',
    'Community responses are anonymised — no participant names',
    'Commons may reject campaigns that violate guidelines',
] as const;

export default function BrandOnboarding() {
    const navigate = useNavigate();
    const { user, profile } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Step 1: Company
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState(profile?.full_name || '');
    const [website, setWebsite] = useState('');
    const [industry, setIndustry] = useState('');

    // Step 2: Acknowledgements
    const [checks, setChecks] = useState<boolean[]>([false, false, false, false]);

    const progress = (currentStep / TOTAL_STEPS) * 100;
    const allChecked = checks.every(Boolean);

    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const toggleCheck = (index: number) => {
        const updated = [...checks];
        updated[index] = !updated[index];
        setChecks(updated);
    };

    const canProceed = (): boolean => {
        switch (currentStep) {
            case 1:
                return !!companyName && !!industry;
            case 2:
                return allChecked;
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
            let logoUrl: string | null = null;

            // Upload logo if selected
            if (logoFile) {
                const ext = logoFile.name.split('.').pop();
                const path = `brand-logos/${user.id}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from('brand-assets')
                    .upload(path, logoFile, { upsert: true });

                if (!uploadError) {
                    const { data } = supabase.storage.from('brand-assets').getPublicUrl(path);
                    logoUrl = data.publicUrl;
                }
            }

            // Update brand profile
            await supabase
                .from('brand_profiles')
                .update({
                    company_name: companyName,
                    website: website || null,
                    industry,
                    company_logo_url: logoUrl,
                })
                .eq('id', user.id);

            navigate('/brand/dashboard', { replace: true });
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
                {/* ── Step 1: Company ─────────────────────────────── */}
                {currentStep === 1 && (
                    <div>
                        <h2 className="text-xl font-bold text-commons-text">
                            Company details
                        </h2>

                        {/* Logo upload */}
                        <div className="mt-6">
                            <label className="mb-1 block text-xs text-commons-textMid">
                                Company logo
                            </label>
                            <div className="flex items-center gap-4">
                                {logoPreview ? (
                                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-commons-border">
                                        <img
                                            src={logoPreview}
                                            alt="Logo preview"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-commons-border bg-commons-surfaceAlt">
                                        <Upload className="h-5 w-5 text-commons-textLight" />
                                    </div>
                                )}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="rounded-md border border-commons-border bg-white px-4 py-2 text-sm font-medium text-commons-text transition-colors hover:bg-commons-surfaceAlt"
                                >
                                    Upload logo
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoSelect}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Company name */}
                        <div className="mt-4">
                            <label className="mb-1 block text-xs text-commons-textMid">
                                Company name
                            </label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Your company"
                                required
                                className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                            />
                        </div>

                        {/* Website */}
                        <div className="mt-4">
                            <label className="mb-1 block text-xs text-commons-textMid">
                                Website URL
                            </label>
                            <input
                                type="url"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="https://yourcompany.com"
                                className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                            />
                        </div>

                        {/* Industry */}
                        <div className="mt-4">
                            <label className="mb-1 block text-xs text-commons-textMid">
                                Industry
                            </label>
                            <select
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-sm text-commons-text focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                            >
                                <option value="">Select industry</option>
                                {INDUSTRIES.map((ind) => (
                                    <option key={ind} value={ind}>
                                        {ind}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Acknowledge ─────────────────────────── */}
                {currentStep === 2 && (
                    <div>
                        <h2 className="text-xl font-bold text-commons-text">
                            Before you start
                        </h2>
                        <p className="mb-6 mt-1 text-sm text-commons-textMid">
                            Just a few things to confirm:
                        </p>

                        <div className="space-y-3">
                            {ACKNOWLEDGEMENTS.map((text, i) => (
                                <label
                                    key={i}
                                    className="flex items-start gap-2 text-sm text-commons-text"
                                >
                                    <input
                                        type="checkbox"
                                        checked={checks[i]}
                                        onChange={() => toggleCheck(i)}
                                        className="mt-0.5 h-4 w-4 rounded border-commons-border text-commons-brand focus:ring-commons-brand"
                                    />
                                    {text}
                                </label>
                            ))}
                        </div>
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
                            disabled={!allChecked || submitting}
                            className="h-10 flex-1 rounded-md bg-commons-brand text-sm font-medium text-white transition-colors hover:bg-commons-brandHover disabled:opacity-50"
                        >
                            {submitting ? 'Setting up…' : 'Enter dashboard →'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
