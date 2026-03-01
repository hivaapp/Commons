import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingNav() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 80);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
            style={{
                height: 60,
                background: scrolled ? 'rgba(250,249,247,0.92)' : 'transparent',
                backdropFilter: scrolled ? 'blur(12px)' : 'none',
                borderBottom: scrolled ? '1px solid #E6E2D9' : '1px solid transparent',
            }}
        >
            <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6 md:px-8">
                <span
                    className="cursor-pointer select-none text-[17px] font-bold tracking-[-0.02em]"
                    style={{ color: '#21201C' }}
                    onClick={() => navigate('/')}
                >
                    commons
                </span>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/auth/login')}
                        className="hidden text-[14px] text-[#6B6860] transition-colors hover:text-[#21201C] md:block"
                    >
                        Login
                    </button>
                    <button
                        onClick={() => navigate('/auth/register')}
                        className="h-9 rounded-md bg-[#D97757] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#C4663F]"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </nav>
    );
}
