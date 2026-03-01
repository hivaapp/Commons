import { useCountUp, useScrollAnimation } from './useScrollAnimation';

export default function LandingStats() {
    const ref = useScrollAnimation();
    const r1 = useCountUp(284000, 1500, '₹', '', 0);
    const r2 = useCountUp(8.4, 1200, '', '/10', 1);
    const r3 = useCountUp(3.4, 1200, '', '%', 1);
    const r4 = useCountUp(24, 1000, '', 'hrs', 0);

    return (
        <section className="bg-[#21201C] px-6 py-[60px] md:px-8 md:py-[80px]">
            <div ref={ref} className="landed-section mx-auto max-w-[1200px]">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
                    {/* Stat 1 */}
                    <div className="text-center">
                        <span ref={r1} className="block text-[40px] font-[800] leading-none text-[#22c55e] md:text-[64px]">₹0</span>
                        <span className="mt-1 block text-[13px] text-white/55">Paid to community today</span>
                    </div>
                    {/* Stat 2 */}
                    <div className="text-center">
                        <span ref={r2} className="block text-[40px] font-[800] leading-none text-[#D97757] md:text-[64px]">0</span>
                        <span className="mt-1 block text-[13px] text-white/55">Avg quality score</span>
                    </div>
                    {/* Stat 3 */}
                    <div className="text-center">
                        <span ref={r3} className="block text-[40px] font-[800] leading-none text-[#D97757] md:text-[64px]">0%</span>
                        <span className="mt-1 block text-[13px] text-white/55">Avg creator activation rate</span>
                    </div>
                    {/* Stat 4 */}
                    <div className="text-center">
                        <span ref={r4} className="block text-[40px] font-[800] leading-none text-[#22c55e] md:text-[64px]">0</span>
                        <span className="mt-1 block text-[13px] text-white/55">Payout to participants</span>
                    </div>
                </div>

                <p className="mt-8 text-center text-[11px] text-white/35">
                    Projected metrics based on pilot program data
                </p>
            </div>
        </section>
    );
}
