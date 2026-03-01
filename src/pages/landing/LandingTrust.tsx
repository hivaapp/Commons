import { useScrollAnimation, staggerChild } from './useScrollAnimation';
import { Shield, Zap, PieChart } from 'lucide-react';

const pillars = [
    {
        icon: Shield,
        iconColor: '#D97757',
        title: 'Funds in escrow',
        body: "Brand payment goes directly to Stripe escrow — a legally separate account that Commons cannot touch. Funds release only after verified task completion. Brands are protected from the first rupee.",
        small: 'Powered by Stripe',
    },
    {
        icon: Zap,
        iconColor: '#417A55',
        title: 'Paid within 24hrs',
        body: "Community members receive UPI transfers within 24hrs of campaign close. No minimum balance required. No waiting weeks for a cheque. ₹50 minimum payout threshold.",
        small: 'Via Stripe · UPI · Bank Transfer',
    },
    {
        icon: PieChart,
        iconColor: '#3B6EA8',
        title: 'You always know the split',
        body: "64% to community. 20–28% to creator. 12% to Commons. These numbers are fixed and shown upfront — no hidden fees, no surprise deductions after campaign close.",
        small: 'No hidden fees',
    },
];

const guarantees = [
    'Full escrow refund if campaign doesn\'t launch',
    'Partial refund if quality threshold not met',
    'Creator income protected even if brand disputes',
];

export default function LandingTrust() {
    const ref = useScrollAnimation();

    return (
        <section className="bg-[#FAF9F7] px-6 py-[60px] md:px-8 md:py-[120px]">
            <div ref={ref} className="landed-section mx-auto max-w-[1200px]">
                <p className="stagger-child text-[11px] font-semibold uppercase tracking-[0.12em] text-[#AAA49C]" style={staggerChild(0)}>
                    Payments &amp; Trust
                </p>
                <h2 className="stagger-child mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-[#21201C] md:text-[48px]" style={staggerChild(1)}>
                    Money moves the right way.
                </h2>

                {/* Three pillars */}
                <div className="mt-10 grid gap-8 md:grid-cols-3 md:gap-0">
                    {pillars.map((p, i) => {
                        const Icon = p.icon;
                        return (
                            <div
                                key={p.title}
                                className="stagger-child md:px-8"
                                style={{
                                    ...staggerChild(i + 2),
                                    borderRight: i < 2 ? undefined : undefined,
                                }}
                            >
                                {/* Desktop divider */}
                                {i > 0 && <div className="hidden md:block absolute" />}
                                <div className={`${i > 0 ? 'md:border-l md:border-[#E6E2D9] md:pl-8' : ''}`}>
                                    <Icon size={28} color={p.iconColor} strokeWidth={1.8} />
                                    <h3 className="mt-3 text-[18px] font-semibold text-[#21201C]">{p.title}</h3>
                                    <p className="mt-2 text-[14px] leading-[1.7] text-[#6B6860]">{p.body}</p>
                                    <p className="mt-3 text-[10px] font-semibold tracking-[0.02em] text-[#AAA49C]">{p.small}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Guarantee card */}
                <div className="stagger-child mt-10 rounded-xl border border-[#E6E2D9] bg-white p-6 md:grid md:grid-cols-2 md:gap-8" style={staggerChild(5)}>
                    <div>
                        <h3 className="text-[18px] font-semibold text-[#21201C]">What happens if something goes wrong?</h3>
                        <p className="mt-3 text-[14px] leading-[1.7] text-[#6B6860]">
                            If a brand disputes results unfairly, Commons reviews within 4hrs.
                            If a payout fails, we notify participants immediately and retry.
                            If a campaign doesn't meet quality standards, the brand receives
                            a partial refund — automatically.
                        </p>
                    </div>
                    <div className="mt-6 space-y-3 md:mt-0 md:flex md:flex-col md:justify-center">
                        {guarantees.map(g => (
                            <div key={g} className="flex items-start gap-2">
                                <span className="mt-0.5 text-[16px] text-[#417A55]">✓</span>
                                <span className="text-[14px] text-[#21201C]">{g}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
