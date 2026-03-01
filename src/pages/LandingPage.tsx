import './landing/landing.css';
import LandingNav from './landing/LandingNav';
import LandingHero from './landing/LandingHero';
import LandingProblem from './landing/LandingProblem';
import LandingHowItWorks from './landing/LandingHowItWorks';
import LandingRoles from './landing/LandingRoles';
import LandingCreatorQuality from './landing/LandingCreatorQuality';
import LandingStats from './landing/LandingStats';
import LandingTrust from './landing/LandingTrust';
import LandingUseCases from './landing/LandingUseCases';
import LandingCTA from './landing/LandingCTA';
import LandingFooter from './landing/LandingFooter';

export default function LandingPage() {
    return (
        <>
            <LandingNav />
            <LandingHero />
            <LandingProblem />
            <LandingHowItWorks />
            <LandingRoles />
            <LandingCreatorQuality />
            <LandingStats />
            <LandingTrust />
            <LandingUseCases />
            <LandingCTA />
            <LandingFooter />
        </>
    );
}
