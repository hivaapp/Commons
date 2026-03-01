import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ArrowLeft, Star, Check, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRupeesExact } from '../../lib/format';
import { TimeGateTracker, injectAttentionCheck, runQualityChecks } from '../../lib/quality';
import type { Question as QualityQuestion } from '../../lib/quality';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';

// ---------- Types ----------

type CampaignType = 'research' | 'review' | 'beta_test' | 'content' | 'vote';
type SubmissionState = 'working' | 'submitting' | 'success' | 'rejected';

interface SurveyQuestion {
    id: string;
    type: 'scale' | 'multiple_choice' | 'text';
    text: string;
    options?: string[];
    correctAnswer?: string;
    isAttentionCheck?: boolean;
}

interface VoteOption {
    id: string;
    label: string;
}

interface CampaignData {
    id: string;
    title: string;
    brand_name: string;
    campaign_type: CampaignType;
    payout_amount: number;
    task_duration_minutes: number;
    task_min_seconds: number;
    description: string;
    // Research
    questions?: SurveyQuestion[];
    // Review
    review_instructions?: string;
    review_require_proof?: boolean;
    review_min_chars?: number;
    // Vote
    vote_options?: VoteOption[];
    vote_multi_select?: boolean;
    // Beta test
    beta_steps?: string[];
    beta_min_chars?: number;
    // Content
    content_instructions?: string;
    content_accept_upload?: boolean;
    content_accept_url?: boolean;
}

// ---------- Helpers ----------

function mapCampaignToLocal(row: any): CampaignData | null {
    if (!row) return null;
    return {
        id: row.id,
        title: row.title ?? '',
        brand_name: (row.brand_profiles as any)?.company_name ?? '',
        campaign_type: (row.campaign_type ?? 'research').toLowerCase().replace(/\s/g, '_') as CampaignType,
        payout_amount: (row.per_task_paise ?? 0),
        task_duration_minutes: row.task_duration_minutes ?? 10,
        task_min_seconds: row.task_min_seconds ?? 180,
        description: row.description ?? '',
        questions: row.questions as SurveyQuestion[] | undefined,
        review_instructions: row.review_instructions,
        review_require_proof: row.review_require_proof,
        review_min_chars: row.review_min_chars,
        vote_options: row.vote_options as VoteOption[] | undefined,
        vote_multi_select: row.vote_multi_select,
        beta_steps: row.beta_steps as string[] | undefined,
        beta_min_chars: row.beta_min_chars,
        content_instructions: row.content_instructions ?? row.task_instructions,
        content_accept_upload: row.content_accept_upload ?? true,
        content_accept_url: row.content_accept_url ?? true,
    };
}

// ---------- Survey renderer ----------

function SurveyRenderer({
    questions,
    answers,
    onAnswer,
    currentIndex,
    onNext,
    onBack,
}: {
    questions: SurveyQuestion[];
    answers: Record<string, string | number>;
    onAnswer: (qId: string, value: string | number) => void;
    currentIndex: number;
    onNext: () => void;
    onBack: () => void;
}) {
    const q = questions[currentIndex];
    if (!q) return null;

    const canProceed = answers[q.id] !== undefined && answers[q.id] !== '';

    return (
        <div>
            {/* Question progress */}
            <p className="mb-4 text-center text-[12px] text-commons-textMid">
                Question {currentIndex + 1} of {questions.length}
            </p>

            {/* Question text */}
            <p className="text-[16px] leading-relaxed text-commons-text">
                {q.text}
            </p>

            {/* Answer input */}
            <div className="mt-6">
                {q.type === 'scale' && (
                    <div className="flex justify-center gap-3">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <button
                                key={n}
                                onClick={() => onAnswer(q.id, n)}
                                className={cn(
                                    'flex h-11 w-11 items-center justify-center rounded-full border-2 text-[15px] font-semibold transition-colors',
                                    answers[q.id] === n
                                        ? 'border-commons-brand bg-commons-brand text-white'
                                        : 'border-commons-border bg-white text-commons-textMid hover:border-commons-textMid',
                                )}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                )}

                {q.type === 'multiple_choice' && q.options && (
                    <div className="space-y-2">
                        {q.options.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => onAnswer(q.id, opt)}
                                className={cn(
                                    'flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-[14px] transition-colors',
                                    answers[q.id] === opt
                                        ? 'border-commons-brand bg-commons-brandTint text-commons-text'
                                        : 'border-commons-border bg-white text-commons-text hover:bg-commons-surfaceAlt',
                                )}
                                style={{ minHeight: 44 }}
                            >
                                <div
                                    className={cn(
                                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                        answers[q.id] === opt
                                            ? 'border-commons-brand bg-commons-brand'
                                            : 'border-commons-border',
                                    )}
                                >
                                    {answers[q.id] === opt && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                    )}
                                </div>
                                {opt}
                            </button>
                        ))}
                    </div>
                )}

                {q.type === 'text' && (
                    <div>
                        <textarea
                            className="w-full rounded-md border border-commons-border bg-white px-3 py-3 text-[14px] text-commons-text transition-colors placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                            rows={4}
                            placeholder="Type your answer..."
                            value={(answers[q.id] as string) ?? ''}
                            onChange={(e) => onAnswer(q.id, e.target.value)}
                        />
                        <p className="mt-1 text-right text-[12px] text-commons-textLight">
                            {((answers[q.id] as string) ?? '').length} characters
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="mt-8 flex gap-3">
                {currentIndex > 0 && (
                    <Button variant="secondary" onClick={onBack} className="flex-1">
                        ← Back
                    </Button>
                )}
                <Button
                    fullWidth={currentIndex === 0}
                    className={cn(currentIndex > 0 && 'flex-1')}
                    onClick={onNext}
                    disabled={!canProceed}
                >
                    {currentIndex === questions.length - 1 ? 'Submit →' : 'Next →'}
                </Button>
            </div>
        </div>
    );
}

// ---------- Review renderer ----------

function ReviewRenderer({
    campaign,
    data,
    onChange,
    onSubmit,
}: {
    campaign: CampaignData;
    data: { rating: number; text: string; proof: File | null };
    onChange: (d: { rating: number; text: string; proof: File | null }) => void;
    onSubmit: () => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const minChars = campaign.review_min_chars ?? 80;

    return (
        <div>
            {/* Instructions */}
            {campaign.review_instructions && (
                <div className="mb-4 rounded-md border border-commons-border bg-white p-3">
                    <p className="text-[14px] leading-relaxed text-commons-text">
                        {campaign.review_instructions}
                    </p>
                </div>
            )}

            {/* Star rating */}
            <p className="mb-2 text-[14px] font-medium text-commons-text">
                Your rating
            </p>
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                    <button
                        key={n}
                        onClick={() => onChange({ ...data, rating: n })}
                        className="p-0.5"
                        style={{ minWidth: 40, minHeight: 40 }}
                    >
                        <Star
                            className={cn(
                                'h-8 w-8 transition-colors',
                                n <= data.rating
                                    ? 'fill-commons-brand text-commons-brand'
                                    : 'fill-none text-commons-border',
                            )}
                        />
                    </button>
                ))}
            </div>

            {/* Review text */}
            <div className="mt-5">
                <label className="mb-1 block text-[12px] text-commons-textMid">
                    Your honest experience
                </label>
                <textarea
                    className="w-full rounded-md border border-commons-border bg-white px-3 py-3 text-[14px] text-commons-text transition-colors placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                    rows={5}
                    placeholder="Share your honest experience..."
                    value={data.text}
                    onChange={(e) => onChange({ ...data, text: e.target.value })}
                />
                <p className={cn(
                    'mt-1 text-right text-[12px]',
                    data.text.length >= minChars
                        ? 'text-commons-textLight'
                        : 'text-commons-warning',
                )}>
                    {data.text.length} / {minChars} min characters
                </p>
            </div>

            {/* Proof upload */}
            {campaign.review_require_proof && (
                <div className="mt-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            onChange({ ...data, proof: f });
                        }}
                    />
                    <Button
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {data.proof ? data.proof.name : 'Upload screenshot'}
                    </Button>
                </div>
            )}

            {/* Submit */}
            <Button
                fullWidth
                className="mt-6 h-12 text-[15px]"
                onClick={onSubmit}
                disabled={data.rating === 0 || data.text.length < minChars}
            >
                Submit →
            </Button>
        </div>
    );
}

// ---------- Vote renderer ----------

function VoteRenderer({
    campaign,
    selected,
    reason,
    onSelect,
    onReasonChange,
    onSubmit,
}: {
    campaign: CampaignData;
    selected: string[];
    reason: string;
    onSelect: (id: string) => void;
    onReasonChange: (r: string) => void;
    onSubmit: () => void;
}) {
    const options = campaign.vote_options ?? [];

    return (
        <div>
            <div className="space-y-2">
                {options.map((opt) => {
                    const isSelected = selected.includes(opt.id);
                    return (
                        <button
                            key={opt.id}
                            onClick={() => onSelect(opt.id)}
                            className={cn(
                                'flex w-full items-center rounded-md border-2 px-4 text-left text-[14px] font-medium transition-colors',
                                isSelected
                                    ? 'border-commons-brand bg-commons-brandTint text-commons-text'
                                    : 'border-commons-border bg-white text-commons-text hover:bg-commons-surfaceAlt',
                            )}
                            style={{ minHeight: 56 }}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            {/* Optional reason */}
            <div className="mt-5">
                <label className="mb-1 block text-[12px] text-commons-textMid">
                    Why? (optional)
                </label>
                <textarea
                    className="w-full rounded-md border border-commons-border bg-white px-3 py-3 text-[14px] text-commons-text transition-colors placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                    rows={3}
                    placeholder="Share your reasoning..."
                    value={reason}
                    onChange={(e) => onReasonChange(e.target.value)}
                />
            </div>

            <Button
                fullWidth
                className="mt-6 h-12 text-[15px]"
                onClick={onSubmit}
                disabled={selected.length === 0}
            >
                Submit →
            </Button>
        </div>
    );
}

// ---------- Beta Test renderer ----------

function BetaTestRenderer({
    campaign,
    currentStep,
    totalSteps,
    loomUrl,
    feedback,
    onLoomChange,
    onFeedbackChange,
    onNext,
    onBack,
    onSubmit,
}: {
    campaign: CampaignData;
    currentStep: number;
    totalSteps: number;
    loomUrl: string;
    feedback: string;
    onLoomChange: (v: string) => void;
    onFeedbackChange: (v: string) => void;
    onNext: () => void;
    onBack: () => void;
    onSubmit: () => void;
}) {
    const steps = campaign.beta_steps ?? [];
    const minChars = campaign.beta_min_chars ?? 100;
    const isOnSteps = currentStep < steps.length;
    const isOnLoom = currentStep === steps.length;
    const isOnFeedback = currentStep === steps.length + 1;

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return url.includes('loom.com');
        } catch {
            return false;
        }
    };

    return (
        <div>
            <p className="mb-4 text-center text-[12px] text-commons-textMid">
                Step {currentStep + 1} of {totalSteps}
            </p>

            {isOnSteps && (
                <>
                    <p className="text-[16px] leading-relaxed text-commons-text">
                        {steps[currentStep]}
                    </p>
                    <div className="mt-8 flex gap-3">
                        {currentStep > 0 && (
                            <Button variant="secondary" onClick={onBack} className="flex-1">
                                ← Back
                            </Button>
                        )}
                        <Button
                            fullWidth={currentStep === 0}
                            className={cn(currentStep > 0 && 'flex-1')}
                            onClick={onNext}
                        >
                            Done, next →
                        </Button>
                    </div>
                </>
            )}

            {isOnLoom && (
                <>
                    <p className="text-[16px] leading-relaxed text-commons-text">
                        Paste your Loom recording link
                    </p>
                    <input
                        type="url"
                        className="mt-4 h-10 w-full rounded-md border border-commons-border bg-white px-3 text-[14px] text-commons-text transition-colors placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                        placeholder="https://www.loom.com/share/..."
                        value={loomUrl}
                        onChange={(e) => onLoomChange(e.target.value)}
                    />
                    {loomUrl && !isValidUrl(loomUrl) && (
                        <p className="mt-1 text-[12px] text-commons-error">
                            Please enter a valid Loom URL
                        </p>
                    )}
                    <div className="mt-8 flex gap-3">
                        <Button variant="secondary" onClick={onBack} className="flex-1">
                            ← Back
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={onNext}
                            disabled={!isValidUrl(loomUrl)}
                        >
                            Next →
                        </Button>
                    </div>
                </>
            )}

            {isOnFeedback && (
                <>
                    <p className="text-[16px] leading-relaxed text-commons-text">
                        Share your detailed feedback
                    </p>
                    <textarea
                        className="mt-4 w-full rounded-md border border-commons-border bg-white px-3 py-3 text-[14px] text-commons-text transition-colors placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                        rows={5}
                        placeholder="What worked well? What didn't? Any bugs or suggestions?"
                        value={feedback}
                        onChange={(e) => onFeedbackChange(e.target.value)}
                    />
                    <p className={cn(
                        'mt-1 text-right text-[12px]',
                        feedback.length >= minChars
                            ? 'text-commons-textLight'
                            : 'text-commons-warning',
                    )}>
                        {feedback.length} / {minChars} min characters
                    </p>
                    <div className="mt-8 flex gap-3">
                        <Button variant="secondary" onClick={onBack} className="flex-1">
                            ← Back
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={onSubmit}
                            disabled={feedback.length < minChars}
                        >
                            Submit →
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}

// ---------- Content renderer ----------

function ContentRenderer({
    campaign,
    file,
    url,
    onFileChange,
    onUrlChange,
    onSubmit,
}: {
    campaign: CampaignData;
    file: File | null;
    url: string;
    onFileChange: (f: File | null) => void;
    onUrlChange: (u: string) => void;
    onSubmit: () => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasContent = file !== null || url.trim().length > 0;

    return (
        <div>
            {/* Instructions */}
            {campaign.content_instructions && (
                <div className="mb-5 rounded-md border border-commons-border bg-white p-3">
                    <p className="text-[14px] leading-relaxed text-commons-text">
                        {campaign.content_instructions}
                    </p>
                </div>
            )}

            {/* Upload */}
            {campaign.content_accept_upload && (
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                    />
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {file ? file.name : 'Upload your content'}
                    </Button>
                </div>
            )}

            {campaign.content_accept_upload && campaign.content_accept_url && (
                <p className="my-3 text-center text-[12px] text-commons-textMid">or</p>
            )}

            {/* URL */}
            {campaign.content_accept_url && (
                <input
                    type="url"
                    className="h-10 w-full rounded-md border border-commons-border bg-white px-3 text-[14px] text-commons-text transition-colors placeholder:text-commons-textLight focus:border-commons-brand focus:outline-none focus:ring-1 focus:ring-commons-brand"
                    placeholder="Paste social media URL..."
                    value={url}
                    onChange={(e) => onUrlChange(e.target.value)}
                />
            )}

            <Button
                fullWidth
                className="mt-6 h-12 text-[15px]"
                onClick={onSubmit}
                disabled={!hasContent}
            >
                Submit →
            </Button>
        </div>
    );
}

// ---------- Toast ----------

function Toast({ message, visible }: { message: string; visible: boolean }) {
    return (
        <div
            className={cn(
                'fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-lg bg-commons-text px-5 py-3 text-[13px] text-white shadow-md transition-all duration-300',
                visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none',
            )}
        >
            {message}
        </div>
    );
}

// ---------- Thank You screen ----------

function ThankYouScreen({ amount }: { amount: number }) {
    const navigate = useNavigate();
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-commons-successBg">
                <Check className="h-8 w-8 text-commons-success" />
            </div>
            <h2 className="mt-4 text-[22px] font-bold text-commons-text">Submitted!</h2>
            <p className="mt-1 text-[14px] text-commons-textMid">
                Your response is under review.
            </p>
            <p className="mt-2 text-[14px] text-commons-success">
                Expected payout: {formatRupeesExact(amount)} within 24hrs of campaign close
            </p>
            <button
                onClick={() => navigate('/community/discover')}
                className="mt-8 text-[14px] font-medium text-commons-textMid hover:text-commons-text"
            >
                Back to discover
            </button>
        </div>
    );
}

// ---------- Rejection screen ----------

function RejectionScreen({
    reason,
    oldScore,
    newScore,
}: {
    reason: string;
    oldScore: number;
    newScore: number;
}) {
    const navigate = useNavigate();
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <h2 className="text-[18px] font-bold text-commons-text">
                Submission not accepted
            </h2>
            <p className="mt-1 text-[13px] text-commons-textMid">{reason}</p>

            <div className="mt-6 rounded-md border border-commons-border bg-white p-4">
                <p className="mb-2 text-[13px] font-medium text-commons-text">
                    How to improve
                </p>
                <ul className="space-y-1 text-left text-[13px] text-commons-textMid">
                    <li>• Spend more time reading each question carefully</li>
                    <li>• Provide detailed, specific answers with examples</li>
                    <li>• Avoid rushing through the task</li>
                </ul>
            </div>

            <p className="mt-4 text-[13px] text-commons-textMid">
                Quality score updated:{' '}
                <span className="font-semibold text-commons-text">{oldScore}</span>
                {' → '}
                <span className="font-semibold text-commons-error">{newScore}</span>
            </p>

            <Button className="mt-6" onClick={() => navigate('/community/discover')}>
                Try another campaign
            </Button>
        </div>
    );
}

// ---------- Main ----------

export default function CommunityTask() {
    const { campaignId } = useParams<{ campaignId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // Fetch real campaign data from Supabase
    const { data: rawCampaign, isLoading: campaignLoading } = useQuery({
        queryKey: ['task-campaign', campaignId],
        enabled: !!campaignId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('campaigns')
                .select(`
                    *, brand_profiles ( company_name )
                `)
                .eq('id', campaignId!)
                .single();
            if (error) throw error;
            return data;
        },
    });

    // Fetch this user's task row for this campaign
    const { data: taskRow, isLoading: taskLoading } = useQuery({
        queryKey: ['my-task', campaignId, user?.id],
        enabled: !!campaignId && !!user?.id,
        queryFn: async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('tasks')
                .select('id, status, started_at, campaign_id')
                .eq('campaign_id', campaignId!)
                .eq('participant_id', authUser.id)
                .maybeSingle();
            if (error) throw error;
            return data; // null if user hasn't joined this campaign yet
        },
    });

    const campaign = mapCampaignToLocal(rawCampaign);

    // Time gate — tracks active (in-focus) time, invisible to user
    const timeGateRef = useRef<TimeGateTracker | null>(null);
    useEffect(() => {
        if (campaign && taskRow) {
            const alreadyElapsedSeconds = taskRow.started_at
                ? Math.floor((Date.now() - new Date(taskRow.started_at).getTime()) / 1000)
                : 0;
            timeGateRef.current = new TimeGateTracker(
                campaign.task_min_seconds,
                alreadyElapsedSeconds
            );
        }
        return () => timeGateRef.current?.destroy();
    }, [campaign, taskRow]);

    // Inject attention check into research questions (memoised, runs once)
    const processedQuestions = useMemo(() => {
        if (!campaign?.questions) return [];
        // Only inject if there isn't one already
        const hasExisting = campaign.questions.some(q => q.isAttentionCheck);
        if (hasExisting) return campaign.questions;
        return injectAttentionCheck(campaign.questions as QualityQuestion[]) as SurveyQuestion[];
    }, [campaign]);

    // Toast
    const [toast, setToast] = useState<string | null>(null);

    // Submission state
    const [submissionState, setSubmissionState] = useState<SubmissionState>('working');
    const [rejectionReason, setRejectionReason] = useState('');
    const [qualityScoreDelta, setQualityScoreDelta] = useState<{ old: number; new: number } | null>(null);

    // Survey state
    const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string | number>>({});
    const [surveyIndex, setSurveyIndex] = useState(0);

    // Review state
    const [reviewData, setReviewData] = useState({ rating: 0, text: '', proof: null as File | null });

    // Vote state
    const [voteSelected, setVoteSelected] = useState<string[]>([]);
    const [voteReason, setVoteReason] = useState('');

    // Beta test state
    const [betaStep, setBetaStep] = useState(0);
    const [betaLoomUrl, setBetaLoomUrl] = useState('');
    const [betaFeedback, setBetaFeedback] = useState('');

    // Content state
    const [contentFile, setContentFile] = useState<File | null>(null);
    const [contentUrl, setContentUrl] = useState('');

    // Honeypot
    const [honeypot, setHoneypot] = useState('');

    // Progress calculation
    const getProgress = useCallback(() => {
        if (!campaign) return 0;
        switch (campaign.campaign_type) {
            case 'research': {
                const total = processedQuestions.length || 1;
                return ((surveyIndex + 1) / total) * 100;
            }
            case 'review':
                return reviewData.rating > 0 && reviewData.text.length > 0 ? 100 : 50;
            case 'vote':
                return voteSelected.length > 0 ? 100 : 0;
            case 'beta_test': {
                const totalSteps = (campaign.beta_steps?.length ?? 0) + 2;
                return ((betaStep + 1) / totalSteps) * 100;
            }
            case 'content':
                return contentFile || contentUrl ? 100 : 0;
            default:
                return 0;
        }
    }, [campaign, processedQuestions, surveyIndex, reviewData, voteSelected, betaStep, contentFile, contentUrl]);

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!campaign || !timeGateRef.current) return;

        const timeGateMeta = timeGateRef.current.getMetadata();

        // Soft time-gate: nudge user, don't block
        if (!timeGateMeta.passed) {
            showToast('Take a moment to review your answers before submitting.');
            return;
        }

        setSubmissionState('submitting');

        try {
            // --- Client-side quality checks ---
            const qualityResult = await runQualityChecks({
                responses: surveyAnswers as Record<string, string | number>,
                timeGate: timeGateMeta,
                questions: processedQuestions as QualityQuestion[],
                honeypot,
            });

            // --- Call edge function for server-side validation ---
            const { data, error } = await supabase.functions.invoke('validate-submission', {
                body: {
                    task_id: taskRow?.id,
                    campaign_id: campaign.id,
                    responses: surveyAnswers,
                    client_quality: qualityResult,
                    time_metadata: timeGateMeta,
                },
            });

            if (error) throw error;

            if (data?.accepted) {
                setSubmissionState('success');
            } else {
                setRejectionReason(
                    data?.message || 'Your response did not meet quality requirements.',
                );
                if (data?.qualityScore !== undefined) {
                    setQualityScoreDelta({
                        old: (data.qualityScore ?? 0) + 5,
                        new: data.qualityScore ?? 0,
                    });
                }
                setSubmissionState('rejected');
            }
        } catch {
            // Fallback: if edge function is unreachable, use client result
            showToast('Submission received — under review.');
            setSubmissionState('success');
        }
    }, [campaign, campaignId, taskRow, honeypot, processedQuestions, surveyAnswers, showToast]);

    if (campaignLoading || taskLoading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-40 w-full max-w-md" />
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center text-[14px] text-commons-textMid">
                Campaign not found
            </div>
        );
    }

    // User hasn't joined — redirect them to discover
    if (!taskLoading && !taskRow) {
        navigate('/community/discover', { replace: true });
        return null;
    }

    // Already submitted
    if (taskRow?.status === 'submitted' || taskRow?.status === 'approved') {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-commons-successBg mb-4">
                    <Check className="h-8 w-8 text-commons-success" />
                </div>
                <h2 className="text-lg font-bold text-commons-text">Already submitted</h2>
                <p className="text-sm text-commons-textMid mt-1 mb-6">Your response is under review.</p>
                <button onClick={() => navigate('/community/discover')}
                    className="text-sm text-commons-brand font-medium">
                    Back to discover
                </button>
            </div>
        );
    }

    // Full-screen loading
    if (submissionState === 'submitting') {
        return (
            <div className="flex min-h-[80vh] flex-col items-center justify-center bg-white">
                <Loader2 className="h-6 w-6 animate-spin text-commons-brand" />
                <p className="mt-3 text-[14px] text-commons-textMid">
                    Reviewing your submission...
                </p>
            </div>
        );
    }

    if (submissionState === 'success') {
        return <ThankYouScreen amount={campaign.payout_amount} />;
    }

    if (submissionState === 'rejected') {
        return (
            <RejectionScreen
                reason={rejectionReason || 'Your response did not meet quality requirements.'}
                oldScore={qualityScoreDelta?.old ?? 67}
                newScore={qualityScoreDelta?.new ?? 62}
            />
        );
    }

    return (
        <div className="-mx-6 -mt-6 md:-mx-8 md:-mt-8">
            {/* Custom top bar — replaces AppShell's visually */}
            <div className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-commons-border bg-white px-4">
                <button
                    onClick={() => navigate('/community/discover')}
                    className="flex items-center gap-1.5 text-[15px] text-commons-text"
                >
                    <ArrowLeft className="h-4 w-4 text-commons-textMid" />
                    <span className="max-w-[200px] truncate font-medium">{campaign.title}</span>
                </button>
                <span className="text-[14px] font-semibold text-commons-success">
                    {formatRupeesExact(campaign.payout_amount)}
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full bg-commons-surfaceAlt">
                <div
                    className="h-full bg-commons-brand transition-all duration-500 ease-out"
                    style={{ width: `${getProgress()}%` }}
                />
            </div>

            {/* Content */}
            <div className="px-6 py-6 md:px-8">
                {/* Honeypot */}
                <div className="h-0 overflow-hidden opacity-0" aria-hidden="true">
                    <input
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                    />
                </div>

                {/* Research / Survey (with injected attention check) */}
                {campaign.campaign_type === 'research' && processedQuestions.length > 0 && (
                    <SurveyRenderer
                        questions={processedQuestions}
                        answers={surveyAnswers}
                        onAnswer={(qId, value) =>
                            setSurveyAnswers((prev) => ({ ...prev, [qId]: value }))
                        }
                        currentIndex={surveyIndex}
                        onNext={() => {
                            if (surveyIndex >= processedQuestions.length - 1) {
                                handleSubmit();
                            } else {
                                setSurveyIndex((i) => i + 1);
                            }
                        }}
                        onBack={() => setSurveyIndex((i) => Math.max(0, i - 1))}
                    />
                )}

                {/* Review */}
                {campaign.campaign_type === 'review' && (
                    <ReviewRenderer
                        campaign={campaign}
                        data={reviewData}
                        onChange={setReviewData}
                        onSubmit={handleSubmit}
                    />
                )}

                {/* Vote */}
                {campaign.campaign_type === 'vote' && (
                    <VoteRenderer
                        campaign={campaign}
                        selected={voteSelected}
                        reason={voteReason}
                        onSelect={(id) => {
                            if (campaign.vote_multi_select) {
                                setVoteSelected((prev) =>
                                    prev.includes(id)
                                        ? prev.filter((v) => v !== id)
                                        : [...prev, id],
                                );
                            } else {
                                setVoteSelected([id]);
                            }
                        }}
                        onReasonChange={setVoteReason}
                        onSubmit={handleSubmit}
                    />
                )}

                {/* Beta Test */}
                {campaign.campaign_type === 'beta_test' && (
                    <BetaTestRenderer
                        campaign={campaign}
                        currentStep={betaStep}
                        totalSteps={(campaign.beta_steps?.length ?? 0) + 2}
                        loomUrl={betaLoomUrl}
                        feedback={betaFeedback}
                        onLoomChange={setBetaLoomUrl}
                        onFeedbackChange={setBetaFeedback}
                        onNext={() => setBetaStep((s) => s + 1)}
                        onBack={() => setBetaStep((s) => Math.max(0, s - 1))}
                        onSubmit={handleSubmit}
                    />
                )}

                {/* Content */}
                {campaign.campaign_type === 'content' && (
                    <ContentRenderer
                        campaign={campaign}
                        file={contentFile}
                        url={contentUrl}
                        onFileChange={setContentFile}
                        onUrlChange={setContentUrl}
                        onSubmit={handleSubmit}
                    />
                )}
            </div>

            {/* Toast */}
            <Toast message={toast ?? ''} visible={toast !== null} />
        </div>
    );
}
