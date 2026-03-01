const linkGroups = [
    {
        title: 'Platform',
        links: ['How it works', 'For Creators', 'For Community', 'For Brands'],
    },
    {
        title: 'Legal',
        links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
    },
    {
        title: 'Company',
        links: ['About', 'Blog', 'Contact'],
    },
];

export default function LandingFooter() {
    return (
        <footer className="bg-[#21201C] px-6 py-12 md:px-8 md:py-[60px]">
            <div className="mx-auto max-w-[1200px]">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-[1fr_auto_auto_auto] md:gap-16">
                    {/* Logo */}
                    <div className="col-span-2 md:col-span-1">
                        <span className="text-[17px] font-bold text-white">commons</span>
                        <p className="mt-1 text-[13px] text-white/45">Community-powered brand campaigns.</p>
                    </div>

                    {/* Link groups */}
                    {linkGroups.map(g => (
                        <div key={g.title}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">{g.title}</p>
                            <ul className="mt-3 space-y-2">
                                {g.links.map(link => (
                                    <li key={link}>
                                        <a href="#" className="text-[13px] text-white/55 transition-colors hover:text-white/90">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="mt-10 flex flex-col items-center justify-between border-t border-white/10 pt-6 text-[12px] text-white/35 md:flex-row">
                    <span>© 2025 Commons. All rights reserved.</span>
                    <span className="mt-2 md:mt-0">Made in India 🇮🇳</span>
                </div>
            </div>
        </footer>
    );
}
