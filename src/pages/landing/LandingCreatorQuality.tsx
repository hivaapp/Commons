import { useScrollAnimation, useBarAnimation, staggerChild } from './useScrollAnimation';

const trustBars = [
    { label: 'Engagement rate', pct: 28 },
    { label: 'Comment authenticity', pct: 22 },
    { label: 'Audience originality', pct: 16 },
    { label: 'Activation rate', pct: 14 },
    { label: 'Content consistency', pct: 10 },
    { label: 'Creator response rate', pct: 6 },
    { label: 'Account longevity', pct: 4 },
];

export default function LandingCreatorQuality() {
    const ref = useScrollAnimation();
    const barRef = useBarAnimation();

    return (
        <section className="bg-[#F3F1EC] px-6 py-[60px] md:px-8 md:py-[120px]">
            <div ref={ref} className="landed-section mx-auto max-w-[1200px]">
                <p className="stagger-child text-[11px] font-semibold uppercase tracking-[0.12em] text-[#AAA49C]" style={staggerChild(0)}>
                    Creator Selection
                </p>
                <h2 className="stagger-child mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-[#21201C] md:text-[48px]" style={staggerChild(1)}>
                    We don't match by follower count.
                </h2>
                <p className="stagger-child mt-2 max-w-[580px] text-[16px] leading-[1.7] text-[#6B6860] md:text-[18px]" style={staggerChild(2)}>
                    We match by activation rate — the only metric that predicts whether your campaign will actually work.
                </p>

                <div className="mt-10 grid gap-10 md:grid-cols-2">
                    {/* Trust Score breakdown */}
                    <div ref={barRef}>
                        <h3 className="text-[16px] font-semibold text-[#21201C]">The Trust Score (0–1000)</h3>
                        <div className="mt-4 space-y-3">
                            {trustBars.map((b, i) => (
                                <div key={b.label} className="flex items-center gap-3">
                                    <span className="w-[160px] shrink-0 text-[13px] text-[#21201C]">{b.label}</span>
                                    <div className="flex-1">
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E6E2D9]">
                                            <div
                                                className="bar-fill h-full rounded-full bg-[#D97757]"
                                                style={{
                                                    width: `${(b.pct / 28) * 100}%`,
                                                    opacity: 0.4 + (b.pct / 28) * 0.6,
                                                    transitionDelay: `${i * 0.1}s`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <span className="w-8 text-right text-[12px] text-[#6B6860]">{b.pct}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activation Rate explainer */}
                    <div>
                        <h3 className="text-[16px] font-semibold text-[#21201C]">What is activation rate?</h3>
                        <p className="mt-2 text-[14px] leading-[1.7] text-[#6B6860]">
                            It's the % of a creator's community that actually completes a campaign task.
                            This is the single number that predicts real-world campaign value.
                        </p>

                        {/* Comparison */}
                        <div className="scroll-hint mt-6 overflow-x-auto">
                            <table className="w-full min-w-[420px] text-left text-[13px]">
                                <thead>
                                    <tr className="border-b border-[#E6E2D9]">
                                        {['Creator', 'Followers', 'Activation', 'Your participants'].map(h => (
                                            <th key={h} className="pb-2 pr-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#AAA49C]">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-[#E6E2D9] bg-[#EBF5EE]">
                                        <td className="py-2.5 pr-3 font-medium text-[#D97757]">@priya_codes</td>
                                        <td className="py-2.5 pr-3 text-[#21201C]">6,200</td>
                                        <td className="py-2.5 pr-3 text-[#21201C]">8.4%</td>
                                        <td className="py-2.5 pr-3 font-bold text-[#417A55]">521 people</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-3 font-medium text-[#6B6860]">@techguru_in</td>
                                        <td className="py-2.5 pr-3 text-[#21201C]">340,000</td>
                                        <td className="py-2.5 pr-3 text-[#21201C]">0.4%</td>
                                        <td className="py-2.5 pr-3 text-[#6B6860]">136 people</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-3 text-[13px] italic text-[#6B6860]">
                            @priya_codes delivers 4× more participants despite 55× fewer followers.
                        </p>

                        {/* Pilot card */}
                        <div className="mt-6 rounded-lg border border-[#E6E2D9] bg-white p-4">
                            <p className="text-[14px] leading-[1.7] text-[#6B6860]">
                                Every creator completes one paid pilot campaign before accessing
                                the full marketplace. This proves their activation rate with real data — not promises.
                            </p>
                            <p className="mt-2 text-[12px] text-[#6B6860]">
                                Pilot: ₹5,000–₹15,000 · 48hr window · Minimum 1.5% activation to qualify
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
