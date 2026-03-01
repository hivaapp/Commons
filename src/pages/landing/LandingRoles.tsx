import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollAnimation, staggerChild } from './useScrollAnimation';

/* ── Creators Tab ── */
function CreatorsTab() {
    const navigate = useNavigate();
    return (
        <div className="tab-content-enter grid gap-8 md:grid-cols-2">
            <div>
                <h3 className="text-[22px] font-bold text-[#21201C]">You don't need 100k followers.</h3>
                <p className="mt-3 text-[14px] leading-[1.7] text-[#6B6860]">
                    Commons rewards engagement quality, not follower quantity. A creator with 5,000 loyal followers
                    and 9% engagement earns more than one with 500,000 passive followers at 0.3%.
                </p>

                {/* Comparison table */}
                <div className="scroll-hint mt-6 overflow-x-auto">
                    <table className="w-full min-w-[400px] text-left text-[13px]">
                        <thead>
                            <tr className="border-b border-[#E6E2D9]">
                                <th className="pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#AAA49C]" />
                                <th className="bg-[#FAF0EB] pb-2 pl-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#AAA49C]">Small creator</th>
                                <th className="pb-2 pl-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#AAA49C]">Large creator</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ['Followers', '5,800', '500,000'],
                                ['Engagement', '9.2%', '0.3%'],
                                ['Campaign earn', '₹38,400', '₹19,200'],
                            ].map(([label, small, large]) => (
                                <tr key={label} className="border-b border-[#E6E2D9]">
                                    <td className="py-2.5 text-[#6B6860]">{label}</td>
                                    <td className="bg-[#FAF0EB] py-2.5 pl-3 font-semibold text-[#21201C]">{small}</td>
                                    <td className="py-2.5 pl-3 text-[#6B6860]">{large}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="mt-2 text-[13px] font-semibold text-[#D97757]">↑ Small creator earns 2× more</p>
            </div>

            <div>
                <h3 className="text-[16px] font-semibold text-[#21201C]">How creators grow</h3>
                <ol className="mt-4 space-y-3 text-[14px] leading-[1.7] text-[#6B6860]">
                    <li>1. Apply with any size community — minimum is engagement, not follower count</li>
                    <li>2. Complete a paid pilot campaign (₹5k–₹15k) — we measure actual activation</li>
                    <li>3. Earn 20–28% of every campaign budget your community participates in</li>
                    <li>4. Tier up as your activation rate improves — better campaigns, higher fees</li>
                    <li>5. Never post fake sponsored content — your trust with your audience is protected</li>
                </ol>

                {/* Tier cards */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                    {[
                        { emoji: '🌱', name: 'Emerging', fee: '20% fee', limit: 'Up to ₹50k' },
                        { emoji: '⭐', name: 'Established', fee: '24% fee', limit: 'Up to ₹2L' },
                        { emoji: '🏆', name: 'Premier', fee: '28% fee', limit: 'Unlimited' },
                    ].map(t => (
                        <div key={t.name} className="rounded-lg border border-[#E6E2D9] p-3 text-center text-[12px]">
                            <span className="text-[20px]">{t.emoji}</span>
                            <p className="mt-1 font-semibold text-[#21201C]">{t.name}</p>
                            <p className="text-[#6B6860]">{t.fee}</p>
                            <p className="text-[#AAA49C]">{t.limit}</p>
                        </div>
                    ))}
                </div>

                <button onClick={() => navigate('/auth/register')} className="mt-6 h-10 rounded-md bg-[#D97757] px-4 text-[14px] font-medium text-white hover:bg-[#C4663F]">
                    Apply as a Creator →
                </button>
            </div>
        </div>
    );
}

/* ── Community Tab ── */
function CommunityTab() {
    const navigate = useNavigate();
    return (
        <div className="tab-content-enter grid gap-8 md:grid-cols-2">
            <div>
                <h3 className="text-[22px] font-bold text-[#21201C]">Finally. Your opinion pays.</h3>
                <p className="mt-3 text-[14px] leading-[1.7] text-[#6B6860]">
                    Join campaigns from creators you already follow.
                    Complete real tasks — product feedback, surveys, beta testing.
                    Get paid directly to your UPI account within 24hrs.
                </p>

                {/* Earnings cards */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                    {[
                        { emoji: '📋', type: 'Survey', time: '~8 minutes', range: '₹150–₹300' },
                        { emoji: '⭐', type: 'Review', time: '~12 minutes', range: '₹300–₹800' },
                        { emoji: '🧪', type: 'Beta Test', time: '~20 minutes', range: '₹400–₹1,200' },
                    ].map(e => (
                        <div key={e.type} className="rounded-lg border border-[#E6E2D9] p-3 text-center text-[12px]">
                            <span className="text-[20px]">{e.emoji}</span>
                            <p className="mt-1 font-semibold text-[#21201C]">{e.type}</p>
                            <p className="text-[#6B6860]">{e.time}</p>
                            <p className="font-semibold text-[#417A55]">{e.range}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-[16px] font-semibold text-[#21201C]">The better your feedback, the more you earn.</h3>

                {/* Quality score bar */}
                <div className="mt-4">
                    <div className="quality-bar-track">
                        <div className="quality-bar-fill" style={{ width: '74%' }} />
                    </div>
                    <p className="mt-1 text-[13px] font-semibold text-[#21201C]">74/100</p>
                </div>

                <div className="mt-4 space-y-2 text-[13px]">
                    {[
                        { score: '50+', label: 'Standard campaigns (₹150–₹300/task)', color: '#6B6860' },
                        { score: '70+', label: 'Premium campaigns (₹300–₹800/task)', color: '#A0622A' },
                        { score: '85+', label: 'Priority access + bonus (₹500–₹2,000/task)', color: '#D97757' },
                    ].map(t => (
                        <div key={t.score} className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                            <span className="font-semibold text-[#21201C]">{t.score}</span>
                            <span className="text-[#6B6860]">→ {t.label}</span>
                        </div>
                    ))}
                </div>
                <p className="mt-3 text-[12px] text-[#6B6860]">Your score grows with every accepted submission.</p>

                {/* Privacy note */}
                <div className="mt-5 rounded-lg border border-[#C8E6C9] bg-[#EBF5EE] p-3 text-[13px] text-[#21201C]">
                    🔒 Your responses are anonymised before brands receive them. Brands never see your name, profile, or any identifying information.
                </div>

                <button onClick={() => navigate('/auth/register')} className="mt-6 h-10 rounded-md bg-[#D97757] px-4 text-[14px] font-medium text-white hover:bg-[#C4663F]">
                    Start Earning →
                </button>
            </div>
        </div>
    );
}

/* ── Brands Tab ── */
function BrandsTab() {
    const navigate = useNavigate();
    const [openAccordion, setOpenAccordion] = useState<number | null>(null);

    const accordionItems = [
        { title: 'Identity Gates', body: 'Phone verified, device fingerprinted, one account per device. Fake account farms are blocked before they reach your campaign.' },
        { title: 'Time Gate Enforcement', body: 'Every task has a minimum completion time. Submitted in 30 seconds? Auto-rejected. We track active engagement, not tab-open time.' },
        { title: 'AI Response Scoring', body: 'Every text response is scored for specificity and coherence. "Great product" scores 0.12. Specific, actionable feedback scores 0.87+.' },
        { title: 'Attention Checks', body: 'Hidden verification questions catch copy-paste bots and inattentive participants automatically.' },
        { title: 'Sentiment Consistency', body: 'Rated 5/5 but wrote "the app kept crashing"? Flagged automatically. Ratings and text must be consistent or the submission is reviewed.' },
        { title: 'Human Spot-Check', body: '8–12% of all submissions are reviewed by a trained moderator. Your brand sees only what passes all six layers.' },
    ];

    return (
        <div className="tab-content-enter grid gap-8 md:grid-cols-2">
            <div>
                <h3 className="text-[22px] font-bold text-[#21201C]">Pay for outcomes, not promises.</h3>

                {/* Comparison table */}
                <div className="scroll-hint mt-6 overflow-x-auto">
                    <table className="w-full min-w-[500px] text-left text-[13px]">
                        <thead>
                            <tr className="border-b border-[#E6E2D9]">
                                {['', 'Commons', 'Agency', 'Influencer post', 'Survey panel'].map((h, i) => (
                                    <th
                                        key={h || 'empty'}
                                        className={`pb-2 pr-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#AAA49C] ${i === 1 ? 'border-l-2 border-[#D97757] pl-3' : ''}`}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ['Cost for 400 people', '₹80,000', '₹8–15L', '₹1–5L (no data)', '₹3–6L'],
                                ['Avg quality score', '8.4/10', '7.1/10', 'N/A', '6.8/10'],
                                ['Response time', '48 hrs', '3–4 weeks', '1–2 weeks', '1 week'],
                                ['Data you receive', 'Full', 'Curated', 'None', 'Basic'],
                                ['Fraud protection', '6-layer', 'Manual', 'None', 'Basic'],
                            ].map((row, ri) => (
                                <tr key={row[0]} className={ri % 2 === 0 ? 'bg-[#FAF9F7]' : 'bg-white'}>
                                    {row.map((cell, ci) => (
                                        <td
                                            key={ci}
                                            className={`py-2.5 pr-3 ${ci === 1 ? 'border-l-2 border-[#D97757] pl-3 font-semibold text-[#21201C]' : ci === 0 ? 'text-[#6B6860]' : 'text-[#6B6860]'}`}
                                        >
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <h3 className="text-[16px] font-semibold text-[#21201C]">
                    6-layer quality filtering — so you only pay for real responses.
                </h3>

                {/* Accordion */}
                <div className="mt-4">
                    {accordionItems.map((item, i) => (
                        <div key={item.title} className="border-b border-[#E6E2D9]">
                            <button
                                onClick={() => setOpenAccordion(openAccordion === i ? null : i)}
                                className="flex min-h-[52px] w-full items-center justify-between py-3 text-left text-[14px] font-medium text-[#21201C]"
                            >
                                {item.title}
                                <span
                                    className="ml-2 text-[18px] text-[#AAA49C] transition-transform duration-300"
                                    style={{ transform: openAccordion === i ? 'rotate(45deg)' : 'none' }}
                                >
                                    +
                                </span>
                            </button>
                            <div className={`accordion-body text-[13px] leading-[1.7] text-[#6B6860] ${openAccordion === i ? 'open' : ''}`}>
                                {item.body}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Escrow card */}
                <div className="mt-6 rounded-lg border border-[#C8E6C9] bg-[#EBF5EE] p-4 text-[13px] text-[#21201C]">
                    🔒 Your funds are held in Stripe escrow — not in Commons' operating account.
                    Funds release only after verified task completion.
                    Full refund if quality standards aren't met.
                </div>

                <button onClick={() => navigate('/auth/register')} className="mt-6 h-10 rounded-md bg-[#D97757] px-4 text-[14px] font-medium text-white hover:bg-[#C4663F]">
                    Start a Campaign →
                </button>
            </div>
        </div>
    );
}

/* ── Main Roles Section ── */
const TABS = ['Creators', 'Community', 'Brands'] as const;

export default function LandingRoles() {
    const [active, setActive] = useState<typeof TABS[number]>('Creators');
    const ref = useScrollAnimation();

    return (
        <section className="bg-white px-6 py-[60px] md:px-8 md:py-[120px]">
            <div ref={ref} className="landed-section mx-auto max-w-[1200px]">
                <p className="stagger-child text-[11px] font-semibold uppercase tracking-[0.12em] text-[#AAA49C]" style={staggerChild(0)}>
                    Built for three audiences
                </p>
                <h2 className="stagger-child mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-[#21201C] md:text-[48px]" style={staggerChild(1)}>
                    Every role wins differently.
                </h2>

                {/* Tabs */}
                <div className="stagger-child mt-8 flex gap-2 overflow-x-auto" style={staggerChild(2)}>
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActive(tab)}
                            className="whitespace-nowrap rounded-full px-5 py-2 text-[14px] font-medium transition-colors"
                            style={{
                                backgroundColor: active === tab ? '#D97757' : 'transparent',
                                color: active === tab ? '#fff' : '#6B6860',
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="mt-8">
                    {active === 'Creators' && <CreatorsTab />}
                    {active === 'Community' && <CommunityTab />}
                    {active === 'Brands' && <BrandsTab />}
                </div>
            </div>
        </section>
    );
}
