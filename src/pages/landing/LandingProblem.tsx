import { useScrollAnimation, staggerChild } from './useScrollAnimation';

const problems = [
    {
        icon: '💸',
        title: 'Paying for fake reach',
        body: 'Brands spend ₹1,300+ crore annually on influencer campaigns where 43% of \'followers\' are bots or inactive accounts. You\'re paying for impressions nobody sees.',
        highlight: '43% fake',
        highlightColor: '#F59E0B',
        audience: 'For Brands',
    },
    {
        icon: '📉',
        title: 'Followers don\'t pay rent',
        body: 'A creator with 8,000 loyal followers earns less than one with 800,000 passive ones — even though brands get ',
        bodyAfter: ' from the smaller, engaged community.',
        highlight: '10× more value',
        highlightColor: '#D97757',
        audience: 'For Creators',
    },
    {
        icon: '🚫',
        title: 'Zero share of the value',
        body: 'The community that makes a creator valuable gets nothing. Their trust and attention are the product — but brands pay only the creator, and creators pay nobody.',
        audience: 'For Communities',
    },
];

export default function LandingProblem() {
    const ref = useScrollAnimation();

    return (
        <section className="bg-[#21201C] px-6 py-[60px] md:px-8 md:py-[120px]">
            <div ref={ref} className="landed-section mx-auto max-w-[1200px]">
                <p className="stagger-child text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40" style={staggerChild(0)}>
                    The Problem
                </p>
                <h2 className="stagger-child mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-white md:text-[56px]" style={staggerChild(1)}>
                    The creator economy is broken for everyone.
                </h2>

                <div className="mt-10 grid gap-5 md:mt-14 md:grid-cols-3 md:gap-6">
                    {problems.map((p, i) => (
                        <div
                            key={p.title}
                            className="stagger-child rounded-xl border border-white/10 bg-white/[0.06] p-6"
                            style={staggerChild(i + 2)}
                        >
                            <span className="text-[32px]">{p.icon}</span>
                            <h3 className="mt-3 text-[18px] font-semibold text-white">{p.title}</h3>
                            <p className="mt-2 text-[14px] leading-[1.7] text-white/65">
                                {p.body}
                                {p.highlight && p.audience !== 'For Brands' && (
                                    <span className="font-semibold underline" style={{ color: p.highlightColor, textDecorationColor: p.highlightColor }}>
                                        {p.highlight}
                                    </span>
                                )}
                                {p.bodyAfter}
                            </p>
                            {p.audience === 'For Brands' && p.highlight && (
                                <p className="mt-3 text-[16px] font-bold" style={{ color: p.highlightColor }}>
                                    {p.highlight}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                <p className="stagger-child mt-12 text-center text-[20px] font-semibold text-white" style={staggerChild(5)}>
                    <span className="border-b-2 border-[#D97757] pb-1">
                        Commons fixes all three — at the same time.
                    </span>
                </p>
            </div>
        </section>
    );
}
