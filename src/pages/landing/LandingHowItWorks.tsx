import { useScrollAnimation, useBarAnimation, staggerChild } from './useScrollAnimation';

const steps = [
    {
        num: '01',
        numColor: '#D97757',
        title: 'Brand sets the campaign',
        body: 'Define what you want to learn or achieve. Set a budget. Commons holds funds in escrow via Stripe — nothing releases until real tasks are completed and verified.',
        detail: '🔒 Secured by Stripe',
    },
    {
        num: '02',
        numColor: '#D97757',
        title: 'Creator activates their community',
        body: 'The creator shares the campaign with their community — the people who actually trust them. Not an ad. A genuine invitation to participate and earn.',
        detail: '📱 Instagram · YouTube · TikTok',
    },
    {
        num: '03',
        numColor: '#D97757',
        title: 'Community completes real tasks',
        body: 'Community members complete genuine tasks — surveys, product testing, reviews, feedback. Each accepted submission triggers a direct payout to that person within 24hrs.',
        detail: '₹150–₹2,000 per task',
        detailColor: '#417A55',
    },
    {
        num: '04',
        numColor: '#417A55',
        title: 'Real results. Real payouts.',
        body: 'Brand receives verified, high-quality insights. Creator earns 20–28% facilitation fee. Community members receive direct cash payouts — no vouchers, no points, real UPI transfers.',
        detail: '',
    },
];

const bars = [
    { label: 'Community earns', pct: 64, amount: '₹51,200', color: '#417A55' },
    { label: 'Creator earns', pct: 24, amount: '₹19,200', color: '#A0622A' },
    { label: 'Commons fee', pct: 12, amount: '₹9,600', color: '#AAA49C' },
];

export default function LandingHowItWorks() {
    const ref = useScrollAnimation();
    const barRef = useBarAnimation();

    return (
        <section id="how-it-works" className="bg-[#FAF9F7] px-6 py-[60px] md:px-8 md:py-[120px]">
            <div ref={ref} className="landed-section mx-auto max-w-[1200px]">
                <p className="stagger-child text-[11px] font-semibold uppercase tracking-[0.12em] text-[#AAA49C]" style={staggerChild(0)}>
                    How It Works
                </p>
                <h2 className="stagger-child mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-[#21201C] md:text-[48px]" style={staggerChild(1)}>
                    One campaign. Three winners.
                </h2>
                <p className="stagger-child mt-3 text-[16px] text-[#6B6860] md:mt-4 md:text-[18px]" style={staggerChild(2)}>
                    Brands pay once. Creators curate. Communities earn.
                </p>

                {/* Steps */}
                <div className="relative mt-10 md:mt-14">
                    {/* Mobile dashed connecting line */}
                    <div className="absolute left-4 top-8 bottom-8 w-px border-l border-dashed border-[#E6E2D9] md:hidden" />

                    <div className="grid gap-8 md:grid-cols-4 md:gap-6">
                        {steps.map((s, i) => (
                            <div key={s.num} className="stagger-child relative pl-12 md:pl-0" style={staggerChild(i + 3)}>
                                {/* Number badge */}
                                <div
                                    className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold text-white md:relative md:mb-4"
                                    style={{ backgroundColor: s.numColor }}
                                >
                                    {s.num}
                                </div>
                                <h3 className="text-[16px] font-semibold text-[#21201C] md:text-[18px]">{s.title}</h3>
                                <p className="mt-2 text-[14px] leading-[1.7] text-[#6B6860]">{s.body}</p>
                                {s.detail && (
                                    <p
                                        className="mt-3 text-[10px] font-semibold tracking-[0.02em]"
                                        style={{ color: s.detailColor || '#AAA49C' }}
                                    >
                                        {s.detail}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Budget breakdown */}
                <div ref={barRef} className="mt-14 rounded-xl border border-[#E6E2D9] bg-white p-6">
                    <p className="text-center text-[15px] font-semibold text-[#21201C] md:text-left">
                        ₹80,000 campaign budget splits like this:
                    </p>
                    <div className="mt-6 space-y-4">
                        {bars.map((b, i) => (
                            <div key={b.label}>
                                <div className="mb-1 flex items-center justify-between text-[13px]">
                                    <span className="text-[#21201C]">{b.label}</span>
                                    <span className="font-semibold text-[#21201C]">{b.amount}</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-[#F3F1EC]">
                                    <div
                                        className="bar-fill h-full rounded-full"
                                        style={{
                                            backgroundColor: b.color,
                                            width: `${b.pct}%`,
                                            transitionDelay: `${i * 0.1}s`,
                                        }}
                                    />
                                </div>
                                <p className="mt-0.5 text-[11px] text-[#AAA49C]">{b.pct}%</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
