import { useState, useRef, useEffect, type ReactElement } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ArrowLeft, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/ToastProvider';

// ---------- Types ----------

type SettingsSection = 'profile' | 'social' | 'campaigns' | 'payouts' | 'notifications';

interface SettingsNavItem {
    key: SettingsSection;
    label: string;
    description: string;
}

const SECTIONS: SettingsNavItem[] = [
    { key: 'profile', label: 'Profile', description: 'Name, bio, avatar' },
    { key: 'social', label: 'Social Links', description: 'Connect your accounts' },
    { key: 'campaigns', label: 'Campaigns', description: 'Default settings for campaigns' },
    { key: 'payouts', label: 'Payouts', description: 'Bank and payment details' },
    { key: 'notifications', label: 'Notifications', description: 'Email and push preferences' },
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
    field,
    table = 'creator_profiles',
}: {
    label: string;
    defaultValue?: string;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    textarea?: boolean;
    field?: string;
    table?: 'profiles' | 'creator_profiles';
}) {
    const { user } = useAuthStore();
    const toast = useToast();
    const [saved, setSaved] = useState(false);
    const [value, setValue] = useState(defaultValue);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    const handleBlur = async () => {
        if (disabled || !field || !user?.id) return;
        if (value === defaultValue) return; // no change

        try {
            const { error } = await (supabase
                .from(table) as any)
                .update({ [field]: value })
                .eq('id', user.id);
            if (error) throw error;

            setSaved(true);
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setSaved(false), 2000);
        } catch (err: any) {
            console.error('Autosave failed:', err);
            toast.error('Failed to save', err?.message ?? 'Please try again');
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
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    onBlur={handleBlur}
                    rows={3}
                    className={cn(inputClasses, 'py-2', disabled && 'bg-commons-surfaceAlt text-commons-textMid')}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
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

function ProfileSection({ profile, creatorProfile }: { profile: any; creatorProfile: any }) {
    return (
        <div className="space-y-5">
            <AutosaveInput label="Display Name" defaultValue={profile?.full_name ?? ''} placeholder="Your name" field="full_name" table="profiles" />
            <AutosaveInput label="Username" defaultValue={creatorProfile?.handle ?? ''} placeholder="@username" field="handle" />
            <AutosaveInput
                label="Bio"
                defaultValue={creatorProfile?.bio ?? ''}
                placeholder="Tell us about yourself"
                textarea
                field="bio"
            />
            <AutosaveInput label="Email" defaultValue={profile?.email ?? ''} type="email" disabled />
            <AutosaveInput label="Phone" defaultValue={profile?.phone ?? ''} type="tel" placeholder="+91" field="phone" table="profiles" />
        </div>
    );
}

function SocialSection({ creatorProfile }: { creatorProfile: any }) {
    const links = (creatorProfile?.social_links as any[]) ?? [];
    const findUrl = (platform: string) => links.find((l) => l.platform === platform)?.url ?? '';

    return (
        <div className="space-y-5">
            <AutosaveInput label="Instagram" defaultValue={findUrl('Instagram')} placeholder="@username" />
            <AutosaveInput label="YouTube" defaultValue={findUrl('YouTube')} placeholder="Channel URL" />
            <AutosaveInput label="Twitter / X" defaultValue={findUrl('X')} placeholder="@handle" />
            <AutosaveInput label="LinkedIn" defaultValue={findUrl('LinkedIn')} placeholder="Profile URL" />
            <AutosaveInput label="Website" defaultValue={creatorProfile?.website ?? ''} placeholder="https://yoursite.com" type="url" field="website" />
        </div>
    );
}

function CampaignsSection({ creatorProfile }: { creatorProfile: any }) {
    const minBudget = creatorProfile?.min_campaign_budget_paise
        ? `₹${(creatorProfile.min_campaign_budget_paise / 100).toLocaleString('en-IN')}`
        : '';

    return (
        <div className="space-y-5">
            <AutosaveInput label="Default Content Language" defaultValue={creatorProfile?.content_language ?? ''} placeholder="Languages" />
            <AutosaveInput
                label="Minimum Campaign Budget"
                defaultValue={minBudget}
                placeholder="₹0"
            />
            <AutosaveToggle
                label="Auto-accept brand invitations"
                description="Automatically accept invitations from verified brands"
                defaultChecked={false}
            />
            <AutosaveToggle
                label="Allow anonymous participants"
                description="Let community members join without revealing identity"
                defaultChecked
            />
        </div>
    );
}

function PayoutsSection({ profile, creatorProfile }: { profile: any; creatorProfile: any }) {
    return (
        <div className="space-y-5">
            <AutosaveInput label="Account holder name" defaultValue={profile?.full_name ?? ''} placeholder="Full name" />
            <AutosaveInput label="Bank name" defaultValue={creatorProfile?.bank_name ?? ''} placeholder="Bank" field="bank_name" />
            <AutosaveInput label="Account number" defaultValue={creatorProfile?.bank_account_number ?? ''} placeholder="Account no." field="bank_account_number" />
            <AutosaveInput label="IFSC code" defaultValue={creatorProfile?.bank_ifsc ?? ''} placeholder="IFSC" field="bank_ifsc" />
            <AutosaveInput label="UPI ID" defaultValue={creatorProfile?.upi_id ?? ''} placeholder="your@upi" field="upi_id" />
        </div>
    );
}

function NotificationsSection() {
    return (
        <div className="space-y-1">
            <AutosaveToggle label="Campaign invitations" description="When a brand sends you an offer" defaultChecked />
            <AutosaveToggle label="Participant updates" description="New joins, submissions, and completions" defaultChecked />
            <AutosaveToggle label="Payout notifications" description="When earnings are transferred" defaultChecked />
            <AutosaveToggle label="Weekly summary" description="Your weekly performance digest" defaultChecked={false} />
            <AutosaveToggle label="Marketing emails" description="Product updates and tips" defaultChecked={false} />
        </div>
    );
}

// ---------- Main ----------

export default function CreatorSettings() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();

    // Fetch profile and creator profile
    const { data: profile } = useQuery({
        queryKey: ['settings-profile', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user!.id)
                .single();
            if (error) throw error;
            return data;
        },
    });

    const { data: creatorProfile, isLoading } = useQuery({
        queryKey: ['settings-creator-profile', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('creator_profiles')
                .select('*')
                .eq('id', user!.id)
                .single();
            if (error) throw error;
            return data;
        },
    });

    const SectionComponents: Record<SettingsSection, () => ReactElement> = {
        profile: () => <ProfileSection profile={profile} creatorProfile={creatorProfile} />,
        social: () => <SocialSection creatorProfile={creatorProfile} />,
        campaigns: () => <CampaignsSection creatorProfile={creatorProfile} />,
        payouts: () => <PayoutsSection profile={profile} creatorProfile={creatorProfile} />,
        notifications: () => <NotificationsSection />,
    };

    // Parse sub-section from hash (mobile) or state
    const hash = location.hash.replace('#', '') as SettingsSection | '';
    const [activeSection, setActiveSection] = useState<SettingsSection | null>(
        hash && SectionComponents[hash as SettingsSection] ? (hash as SettingsSection) : null,
    );

    // Desktop: always show panel to the right if a section is selected
    const [desktopSection, setDesktopSection] = useState<SettingsSection>('profile');

    const handleSelect = (key: SettingsSection) => {
        setActiveSection(key);
        setDesktopSection(key);
        navigate(`#${key}`, { replace: true });
    };

    const handleBack = () => {
        setActiveSection(null);
        navigate('#', { replace: true });
    };

    if (isLoading) {
        return (
            <div>
                <Skeleton className="h-6 w-20" />
                <Skeleton className="mt-4 h-4 w-40" />
                <div className="mt-6 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            </div>
        );
    }

    const ActiveComponent = activeSection ? SectionComponents[activeSection] : null;
    const DesktopComponent = SectionComponents[desktopSection];
    const activeSectionLabel = SECTIONS.find((s) => s.key === activeSection)?.label;
    const desktopSectionLabel = SECTIONS.find((s) => s.key === desktopSection)?.label ?? 'Profile';

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
                        </div>
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                navigate('/', { replace: true });
                            }}
                            className="flex w-full items-center justify-between border-t border-commons-border py-4 text-sm text-commons-error transition-colors hover:text-[#A93226]"
                        >
                            Sign out
                        </button>
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
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                navigate('/', { replace: true });
                            }}
                            className="mt-4 w-full rounded-md px-3 py-2 text-left text-[14px] text-commons-error transition-colors hover:bg-commons-errorBg"
                        >
                            Sign out
                        </button>
                    </div>
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
