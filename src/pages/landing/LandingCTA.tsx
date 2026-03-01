import { useNavigate } from 'react-router-dom';
import { useScrollAnimation, staggerChild } from './useScrollAnimation';

export default function LandingCTA() {
    const navigate = useNavigate();
    const ref = useScrollAnimation();

    return (
        <section className="bg-[#D97757] px-6 py-[60px] md:px-8 md:py-[100px]">
            <div ref={ref} className="landed-section mx-auto max-w-[800px] text-center">
                <h2 className="stagger-child text-[28px] font-[800] leading-[1.1] tracking-[-0.02em] text-white md:text-[56px]" style={staggerChild(0)}>
                    Ready to build something real?
                </h2>
                <p className="stagger-child mx-auto mt-4 max-w-[520px] text-[16px] leading-[1.7] text-white/80 md:text-[18px]" style={staggerChild(1)}>
                    Join as a creator, start earning as a community member,
                    or launch your first campaign as a brand.
                </p>

                <div className="stagger-child mt-8 flex flex-col items-center gap-3 md:flex-row md:justify-center" style={staggerChild(2)}>
                    <button
                        onClick={() => navigate('/auth/register')}
                        className="h-12 w-full rounded-md bg-white px-6 text-[15px] font-semibold text-[#D97757] transition-colors hover:bg-white/90 md:w-auto"
                    >
                        Start as Creator →
                    </button>
                    <button
                        onClick={() => navigate('/auth/register')}
                        className="h-12 w-full rounded-md bg-white px-6 text-[15px] font-semibold text-[#D97757] transition-colors hover:bg-white/90 md:w-auto"
                    >
                        Start Earning →
                    </button>
                    <button
                        onClick={() => navigate('/auth/register')}
                        className="h-12 w-full rounded-md border border-white px-6 text-[15px] font-semibold text-white transition-colors hover:bg-white/10 md:w-auto"
                    >
                        Run a Campaign →
                    </button>
                </div>

                <p className="stagger-child mt-6 text-[13px] text-white/65" style={staggerChild(3)}>
                    Free to join · No credit card required · First campaign setup in under 10 minutes
                </p>
            </div>
        </section>
    );
}
