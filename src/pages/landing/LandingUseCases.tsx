import { useScrollAnimation, staggerChild } from './useScrollAnimation';

const useCases = [
    {
        badge: 'D2C Brand · Research',
        scenario: 'Mamaearth wants to test a new face wash formula before launch',
        body: "Research campaign — 200 participants from a beauty creator's community try the product and complete a structured feedback survey.",
        stats: [
            { label: 'Budget spent', value: '₹60,000' },
            { label: 'Participants', value: '200 people' },
            { label: 'Quality score', value: '8.7/10' },
            { label: 'vs Agency cost', value: '₹6–12L' },
        ],
        saving: 'Saved ₹5.4L vs a traditional focus group',
        creator: '@skincare_by_ananya',
    },
    {
        badge: 'Fintech · Beta Test',
        scenario: 'A new UPI lending app needs real user testing before App Store launch',
        body: "Beta test campaign — developers from a tech creator's community test specific user flows and record their screen.",
        stats: [
            { label: 'Budget spent', value: '₹1,20,000' },
            { label: 'Participants', value: '80 developers' },
            { label: 'Bugs found', value: '23 critical' },
            { label: 'Time saved', value: '3 weeks' },
        ],
        saving: 'Found issues traditional QA missed',
        creator: '@dev_with_ravi',
    },
    {
        badge: 'Food & Beverage · Review',
        scenario: 'Sleepy Owl wants genuine reviews from real coffee drinkers',
        body: "Review campaign — 150 coffee enthusiasts from a food creator's community receive samples and write verified honest reviews.",
        stats: [
            { label: 'Budget spent', value: '₹45,000' },
            { label: 'Participants', value: '150 reviewers' },
            { label: 'Avg rating', value: '4.3/5' },
            { label: 'UGC generated', value: '150 pieces' },
        ],
        saving: '150 authentic reviews in 7 days vs 3 months on Amazon',
        creator: '@coffeeaddict_mumbai',
    },
];

export default function LandingUseCases() {
    const ref = useScrollAnimation();

    return (
        <section className="bg-white px-6 py-[60px] md:px-8 md:py-[120px]">
            <div ref={ref} className="landed-section mx-auto max-w-[1200px]">
                <p className="stagger-child text-[11px] font-semibold uppercase tracking-[0.12em] text-[#AAA49C]" style={staggerChild(0)}>
                    Use Cases
                </p>
                <h2 className="stagger-child mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-[#21201C] md:text-[48px]" style={staggerChild(1)}>
                    What brands actually use it for.
                </h2>

                <div className="mt-10 grid gap-6 md:grid-cols-3">
                    {useCases.map((uc, i) => (
                        <div
                            key={uc.badge}
                            className="stagger-child rounded-xl border border-[#E6E2D9] bg-white p-5"
                            style={staggerChild(i + 2)}
                        >
                            {/* Badge */}
                            <span className="inline-block rounded-full border border-[#E6E2D9] bg-[#F3F1EC] px-2.5 py-0.5 text-[11px] font-medium text-[#6B6860]">
                                {uc.badge}
                            </span>

                            {/* Scenario */}
                            <p className="mt-3 text-[14px] font-semibold text-[#21201C]">{uc.scenario}</p>
                            <p className="mt-2 text-[13px] leading-[1.7] text-[#6B6860]">{uc.body}</p>

                            {/* Stats grid */}
                            <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-[#F3F1EC] p-3">
                                {uc.stats.map(s => (
                                    <div key={s.label}>
                                        <p className="text-[16px] font-bold text-[#21201C]">{s.value}</p>
                                        <p className="text-[11px] text-[#6B6860]">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Saving */}
                            <p className="mt-3 text-[13px] font-semibold text-[#417A55]">{uc.saving}</p>

                            {/* Creator tag */}
                            <div className="mt-3 flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-[#F3F1EC]" />
                                <span className="text-[13px] font-medium text-[#D97757]">{uc.creator}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
