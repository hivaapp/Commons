import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

const WORDS_L1 = ['Your', 'community'];
const WORDS_L2 = ['earns.', 'You', 'earn.'];
const WORDS_L3 = ['Brands', 'get', 'real', 'data.'];

function HeroWord({ word, idx, color }: { word: string; idx: number; color?: string }) {
    return (
        <span
            className="hero-word mr-[0.3em]"
            style={{ animationDelay: `${0.3 + idx * 0.05}s`, color }}
        >
            {word}
        </span>
    );
}

function LiveCard() {
    const [payouts, setPayouts] = useState(284000);
    const [participants, setParticipants] = useState(320);
    const [quality, setQuality] = useState(8.4);

    useEffect(() => {
        const interval = setInterval(() => {
            const r = Math.random();
            if (r < 0.33) setPayouts(p => p + Math.floor(Math.random() * 500 + 100));
            else if (r < 0.66) setParticipants(p => p + (Math.random() > 0.5 ? 1 : 0));
            else setQuality(q => Math.min(9.9, +(q + (Math.random() * 0.02)).toFixed(1)));
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const fmt = (n: number) => n.toLocaleString('en-IN');

    return (
        <div className="w-full max-w-[380px] rounded-xl border border-[#E6E2D9] bg-white p-5 shadow-lg md:max-w-none">
            <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#AAA49C]">
                    Live Campaign
                </span>
                <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-green-500" />
            </div>
            <p className="text-[15px] font-semibold text-[#21201C]">Zepto · Checkout Research</p>
            <p className="mt-3 text-[13px] text-[#6B6860]">
                ₹280 per task · ~8 min
            </p>

            {/* Progress bar */}
            <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#F3F1EC]">
                    <div className="h-full rounded-full bg-[#D97757] transition-all duration-700" style={{ width: `${(participants / 400) * 100}%` }} />
                </div>
                <p className="mt-1 text-[12px] text-[#6B6860]">{participants}/400 joined</p>
            </div>

            {/* Stats */}
            <div className="mt-4 space-y-2 border-t border-[#E6E2D9] pt-4">
                <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#6B6860]">Payouts sent today</span>
                    <span className="text-[15px] font-bold text-[#21201C]">₹{fmt(payouts)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#6B6860]">Avg quality score</span>
                    <span className="text-[15px] font-bold text-[#21201C]">{quality}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#6B6860]">Participants</span>
                    <span className="text-[15px] font-bold text-[#21201C]">{participants}</span>
                </div>
            </div>
        </div>
    );
}

export default function LandingHero() {
    const navigate = useNavigate();
    let wordIdx = 0;

    return (
        <section className="noise-bg relative min-h-screen bg-[#FAF9F7] pt-[60px]">
            <div className="mx-auto flex min-h-[calc(100vh-60px)] max-w-[1200px] flex-col items-center px-6 py-20 text-center md:flex-row md:items-center md:gap-16 md:px-8 md:py-0 md:text-left">
                {/* Text */}
                <div className="flex-1">
                    {/* Eyebrow */}
                    <div className="mb-6 inline-block rounded-full border border-[#F0C9B8] bg-[#FAF0EB] px-3 py-1">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#D97757]">
                            Community-Powered Brand Campaigns
                        </span>
                    </div>

                    {/* Headline */}
                    <h1
                        className="text-[32px] font-[800] leading-[1.1] tracking-[-0.03em] text-[#21201C] md:text-[72px]"
                    >
                        <span className="block">
                            {WORDS_L1.map((w) => (
                                <HeroWord key={w + wordIdx} word={w} idx={wordIdx++} />
                            ))}
                        </span>
                        <span className="block">
                            {WORDS_L2.map((w) => (
                                <HeroWord
                                    key={w + wordIdx}
                                    word={w}
                                    idx={wordIdx++}
                                    color={w === 'earns.' ? '#D97757' : undefined}
                                />
                            ))}
                        </span>
                        <span className="block">
                            {WORDS_L3.map((w) => (
                                <HeroWord key={w + wordIdx} word={w} idx={wordIdx++} />
                            ))}
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="mt-5 max-w-[520px] text-[16px] leading-[1.75] text-[#6B6860] md:text-[18px]">
                        Commons turns creator communities into active brand research partners.
                        Not fake endorsements. Not passive ads. Real tasks. Real payouts.
                        Real outcomes.
                    </p>

                    {/* CTAs */}
                    <div className="mt-8 flex flex-col items-center gap-3 md:flex-row md:items-start">
                        <button
                            onClick={() => navigate('/auth/register')}
                            className="pulse-cta h-12 w-full rounded-md bg-[#D97757] px-8 text-base font-medium text-white transition-colors hover:bg-[#C4663F] md:w-auto"
                        >
                            Get Started Free
                        </button>
                        <button
                            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                            className="h-12 w-full rounded-md px-6 text-base text-[#6B6860] transition-colors hover:text-[#21201C] md:w-auto"
                        >
                            See how it works
                        </button>
                    </div>

                    <p className="mt-4 text-[12px] tracking-[0.02em] text-[#AAA49C]">
                        No upfront cost · Funds in escrow · Payouts within 24hrs
                    </p>
                </div>

                {/* Live Card */}
                <div className="mt-12 flex flex-1 justify-center md:mt-0">
                    <LiveCard />
                </div>
            </div>
        </section>
    );
}
