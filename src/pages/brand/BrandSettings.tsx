import { useState, useRef, useEffect, type ReactElement } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ArrowLeft, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { useToast } from '../../components/ui/ToastProvider';
import { Skeleton } from '../../components/ui/Skeleton';

// ---------- Types ----------

type SettingsSection = 'company' | 'billing' | 'notifications' | 'defaults';

interface SettingsNavItem {
    key: SettingsSection;
    label: string;
    description: string;
}

const SECTIONS: SettingsNavItem[] = [
    { key: 'company', label: 'Company Profile', description: 'Name, logo, industry' },
    { key: 'billing', label: 'Billing', description: 'Payment methods and invoices' },
    { key: 'notifications', label: 'Notifications', description: 'Email and push preferences' },
    { key: 'defaults', label: 'Campaign Defaults', description: 'Default campaign settings' },
];

// ---------- Saved indicator ----------

function SavedTick({ visible }: { visible: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 text-[12px] text-commons-success transition-opacity duration-300',
                visible ? 'opacity-100' : 'opacity-0',
            )}
        >
            <Check className="h-3 w-3" />
            Saved
        </span>
    );
}

// ---------- Autosave input ----------

function AutosaveInput({
    label,
    defaultValue = '',
    type = 'text',
    placeholder,
    disabled = false,
    textarea = false,
    onSave,
}: {
    label: string;
    defaultValue?: string;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    textarea?: boolean;
    onSave?: (value: string) => Promise<boolean>;
}) {
    const [saved, setSaved] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const handleBlur = async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (disabled) return;
        const value = e.target.value;
        if (onSave) {
            const ok = await onSave(value);
            if (ok) {
                setSaved(true);
                clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => setSaved(false), 2000);
            }
        } else {
            setSaved(true);
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setSaved(false), 2000);
        }
    };

    useEffect(() => () => clearTimeout(timerRef.current), []);

    const inputClasses =
        'w-full rounded-md border border-commons-border bg-white px-3 text-[14px] placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand';

    return (
        <div>
            <div className="mb-1 flex items-center justify-between">
                <label className="text-[12px] text-commons-textMid">{label}</label>
                <SavedTick visible={saved} />
            </div>
            {textarea ? (
                <textarea
                    defaultValue={defaultValue}
                    placeholder={placeholder}
                    disabled={disabled}
                    onBlur={handleBlur}
                    rows={3}
                    className={cn(inputClasses, 'py-2', disabled && 'bg-commons-surfaceAlt text-commons-textMid')}
                />
            ) : (
                <input
                    type={type}
                    defaultValue={defaultValue}
                    placeholder={placeholder}
                    disabled={disabled}
                    onBlur={handleBlur}
                    className={cn(inputClasses, 'h-10', disabled && 'bg-commons-surfaceAlt text-commons-textMid')}
                />
            )}
        </div>
    );
}

// ---------- Autosave toggle ----------

function AutosaveToggle({
    label,
    description,
    defaultChecked = false,
}: {
    label: string;
    description?: string;
    defaultChecked?: boolean;
}) {
    const [checked, setChecked] = useState(defaultChecked);
    const [saved, setSaved] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const toggle = () => {
        setChecked((v) => !v);
        setSaved(true);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setSaved(false), 2000);
    };

    useEffect(() => () => clearTimeout(timerRef.current), []);

    return (
        <div className="flex items-center justify-between py-2">
            <div>
                <p className="text-[14px] text-commons-text">{label}</p>
                {description && (
                    <p className="text-[12px] text-commons-textMid">{description}</p>
                )}
            </div>
            <div className="flex items-center gap-2">
                <SavedTick visible={saved} />
                <button
                    onClick={toggle}
                    className={cn(
                        'relative h-5 w-9 rounded-full transition-colors',
                        checked ? 'bg-commons-brand' : 'bg-commons-border',
                    )}
                >
                    <span
                        className={cn(
                            'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                            checked && 'translate-x-4',
                        )}
                    />
                </button>
            </div>
        </div>
    );
}

// ---------- Section panels ----------

function CompanySection({
    brandProfile,
    isLoading,
    saveField,
}: {
    brandProfile: { company_name: string | null; website: string | null; industry: string | null; company_logo_url: string | null } | null | undefined;
    isLoading: boolean;
    saveField: (field: string, value: string) => Promise<boolean>;
}) {
    if (isLoading) {
        return (
            <div className="space-y-5">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <AutosaveInput
                label="Company Name"
                defaultValue={brandProfile?.company_name ?? ''}
                placeholder="Your company"
                onSave={(v) => saveField('company_name', v)}
            />
            <AutosaveInput
                label="Website"
                defaultValue={brandProfile?.website ?? ''}
                placeholder="https://"
                type="url"
                onSave={(v) => saveField('website', v)}
            />
            <AutosaveInput
                label="Industry"
                defaultValue={brandProfile?.industry ?? ''}
                placeholder="Industry"
                onSave={(v) => saveField('industry', v)}
            />
        </div>
    );
}

function BillingSection() {
    return (
        <div className="space-y-5">
            <AutosaveInput label="Billing email" defaultValue="" type="email" placeholder="finance@company.com" />
            <AutosaveInput label="GST Number" defaultValue="" placeholder="GSTIN" />
            <AutosaveInput label="Billing address" defaultValue="" textarea placeholder="Street, City, PIN" />

            <div className="mt-4 rounded-md border border-commons-border p-4">
                <p className="text-[13px] font-semibold text-commons-text">Payment method</p>
                <p className="mt-1 text-[13px] text-commons-textMid">No payment method added</p>
                <button className="mt-2 text-[13px] text-commons-brand hover:text-commons-brandHover">
                    Add payment method
                </button>
            </div>
        </div>
    );
}

function NotificationsSection() {
    return (
        <div className="space-y-1">
            <AutosaveToggle label="Campaign updates" description="Submissions, milestones, and completions" defaultChecked />
            <AutosaveToggle label="Creator responses" description="When a creator accepts or declines your campaign" defaultChecked />
            <AutosaveToggle label="Payment confirmations" description="Escrow deposits and refund notifications" defaultChecked />
            <AutosaveToggle label="Quality alerts" description="When submissions fall below quality threshold" defaultChecked />
            <AutosaveToggle label="Weekly summary" description="Your weekly campaign performance digest" defaultChecked={false} />
            <AutosaveToggle label="Marketing emails" description="Product updates and platform tips" defaultChecked={false} />
        </div>
    );
}

function DefaultsSection() {
    return (
        <div className="space-y-5">
            <AutosaveInput label="Default campaign duration" defaultValue="7 days" placeholder="e.g. 7 days" />
            <AutosaveInput label="Default budget" defaultValue="₹80,000" placeholder="₹0" />
            <AutosaveToggle
                label="Auto-approve submissions"
                description="Automatically approve submissions that meet quality threshold"
                defaultChecked={false}
            />
            <AutosaveToggle
                label="Require proof of completion"
                description="Require participants to submit proof by default"
                defaultChecked
            />
            <AutosaveToggle
                label="Auto-extend campaigns"
                description="Extend campaign duration if participant target not met"
                defaultChecked={false}
            />
        </div>
    );
}

// ---------- Main ----------

export default function BrandSettings() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const toast = useToast();

    // ── Data fetching ──
    const { data: brandProfile, isLoading } = useQuery({
        queryKey: ['brand-profile', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('brand_profiles')
                .select('company_name, website, industry, company_logo_url')
                .eq('id', user!.id)
                .single();
            if (error) throw error;
            return data;
        },
    });

    // ── Save helper ──
    const saveField = async (field: string, value: string): Promise<boolean> => {
        if (!user?.id) return false;
        const { error } = await supabase
            .from('brand_profiles')
            .update({ [field]: value, updated_at: new Date().toISOString() })
            .eq('id', user.id);
        if (error) {
            toast.error('Failed to save', error.message);
            return false;
        }
        return true;
    };

    // ── Section components map (company needs props) ──
    const SECTION_COMPONENTS: Record<SettingsSection, () => ReactElement> = {
        company: () => <CompanySection brandProfile={brandProfile} isLoading={isLoading} saveField={saveField} />,
        billing: BillingSection,
        notifications: NotificationsSection,
        defaults: DefaultsSection,
    };

    const hash = location.hash.replace('#', '') as SettingsSection | '';
    const [activeSection, setActiveSection] = useState<SettingsSection | null>(
        hash && SECTION_COMPONENTS[hash as SettingsSection] ? (hash as SettingsSection) : null,
    );

    const [desktopSection, setDesktopSection] = useState<SettingsSection>('company');

    const handleSelect = (key: SettingsSection) => {
        setActiveSection(key);
        setDesktopSection(key);
        navigate(`#${key}`, { replace: true });
    };

    const handleBack = () => {
        setActiveSection(null);
        navigate('#', { replace: true });
    };

    const ActiveComponent = activeSection ? SECTION_COMPONENTS[activeSection] : null;
    const DesktopComponent = SECTION_COMPONENTS[desktopSection];
    const activeSectionLabel = SECTIONS.find((s) => s.key === activeSection)?.label;
    const desktopSectionLabel = SECTIONS.find((s) => s.key === desktopSection)?.label ?? 'Company Profile';

    return (
        <div>
            {/* ── MOBILE layout ── */}
            <div className="md:hidden">
                {activeSection && ActiveComponent ? (
                    <>
                        <button
                            onClick={handleBack}
                            className="mb-4 flex items-center gap-1 text-[13px] text-commons-textMid hover:text-commons-text"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Settings
                        </button>
                        <h2 className="mb-5 text-[18px] font-bold text-commons-text">
                            {activeSectionLabel}
                        </h2>
                        <ActiveComponent />
                    </>
                ) : (
                    <>
                        <h1 className="mb-1 text-[20px] font-bold text-commons-text">
                            Settings
                        </h1>
                        <p className="mb-6 text-[14px] text-commons-textMid">
                            Manage your account
                        </p>
                        <div className="divide-y divide-commons-border">
                            {SECTIONS.map((s) => (
                                <button
                                    key={s.key}
                                    onClick={() => handleSelect(s.key)}
                                    className="flex w-full items-center justify-between py-3 text-left focus:outline-none"
                                >
                                    <div>
                                        <p className="text-[14px] font-medium text-commons-text">
                                            {s.label}
                                        </p>
                                        <p className="text-[12px] text-commons-textMid">
                                            {s.description}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-commons-textLight" />
                                </button>
                            ))}

                            {/* Sign out */}
                            <button
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    navigate('/');
                                }}
                                className="w-full text-left px-0 py-3 text-sm text-commons-error hover:bg-commons-errorBg transition-colors"
                            >
                                Sign out
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* ── DESKTOP layout ── */}
            <div className="hidden md:flex md:gap-10">
                {/* Left nav */}
                <div className="w-[180px] shrink-0">
                    <h1 className="mb-5 text-[20px] font-bold text-commons-text">
                        Settings
                    </h1>
                    <div className="space-y-0.5">
                        {SECTIONS.map((s) => (
                            <button
                                key={s.key}
                                onClick={() => {
                                    setDesktopSection(s.key);
                                    setActiveSection(s.key);
                                }}
                                className={cn(
                                    'w-full rounded-md px-3 py-2 text-left text-[14px] transition-colors focus:outline-none',
                                    desktopSection === s.key
                                        ? 'bg-commons-brandTint font-medium text-commons-brand'
                                        : 'text-commons-textMid hover:bg-commons-surfaceAlt hover:text-commons-text',
                                )}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* Sign out — desktop */}
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            navigate('/');
                        }}
                        className="mt-6 w-full text-left px-3 py-2 text-sm text-commons-error hover:text-[#A93226] transition-colors"
                    >
                        Sign out
                    </button>
                </div>

                {/* Right panel */}
                <div className="min-w-0 flex-1">
                    <h2 className="mb-5 text-[18px] font-bold text-commons-text">
                        {desktopSectionLabel}
                    </h2>
                    <DesktopComponent />
                </div>
            </div>
        </div>
    );
}
