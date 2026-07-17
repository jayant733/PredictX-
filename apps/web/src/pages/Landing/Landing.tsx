import React, { useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { HeroSection } from './HeroSection';
import { StatsBar } from './StatsBar';
import './Landing.css';

// Lazy load promotional section components for faster initial load
const LiveMarkets = lazy(() =>
  import('./LiveMarkets').then(module => ({ default: module.LiveMarkets }))
);
const FeaturesSection = lazy(() =>
  import('./FeaturesSection').then(module => ({ default: module.FeaturesSection }))
);

const Landing: React.FC = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            document.querySelectorAll('.landing-glass-panel').forEach(card => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
                (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
            });
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div className="bg-[#121315] text-[#e3e2e5] font-body-md min-h-screen selection:bg-primary-container selection:text-on-primary">
            {/* TopNavBar */}
            <nav className="fixed top-0 w-full z-50 bg-surface/70 backdrop-blur-xl border-b border-outline-variant/30">
                <div className="flex justify-between items-center h-20 px-margin-desktop max-w-container-max mx-auto">
                    <div className="font-display-lg text-display-lg tracking-tighter text-primary">PredictX</div>
                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={() => navigate('/dashboard')} className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 font-body-md text-body-md bg-transparent border-none cursor-pointer">Markets</button>
                        <a className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 font-body-md text-body-md" href="#">Docs</a>
                        <a className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 font-body-md text-body-md" href="#">API</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-on-surface-variant hover:text-primary transition-colors p-2 cursor-pointer bg-transparent border-none" onClick={toggleTheme}>
                            <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
                        </button>
                        <button 
                            onClick={() => navigate('/login')}
                            className="bg-primary-container text-on-primary-container px-6 py-2.5 font-label-caps text-label-caps rounded-full font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all landing-neon-glow-box cursor-pointer"
                        >
                            Connect Wallet
                        </button>
                    </div>
                </div>
            </nav>

            <main className="pt-20">
                <HeroSection onConnectClick={() => navigate('/login')} onViewMarketsClick={() => navigate('/dashboard')} />
                
                <StatsBar />

                <Suspense fallback={<div className="h-48 flex items-center justify-center"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
                    <LiveMarkets onTradeClick={(path) => navigate('/' + path)} />
                    <FeaturesSection />
                </Suspense>

                {/* CTA Footer Section */}
                <section className="py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5"></div>
                    <div className="max-w-3xl mx-auto px-margin-desktop text-center relative z-10">
                        <h2 className="font-display-lg text-display-lg text-primary mb-8">Ready to join the next generation of trading?</h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button 
                                onClick={() => navigate('/login')}
                                className="bg-primary-container text-on-primary-container px-12 py-5 rounded-xl font-headline-md text-headline-md hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,242,255,0.2)] cursor-pointer"
                            >
                                Connect Wallet
                            </button>
                            <button className="landing-metallic-border text-primary px-12 py-5 rounded-xl font-headline-md text-headline-md hover:bg-white/5 active:scale-95 transition-all cursor-pointer">
                                Join Discord
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-surface-container-lowest border-t border-outline-variant w-full py-12">
                <div className="flex flex-col md:flex-row justify-between items-center px-margin-desktop gap-gutter max-w-container-max mx-auto">
                    <div className="flex flex-col gap-2">
                        <div className="font-display-lg text-display-lg text-on-surface">PredictX</div>
                        <div className="font-label-caps text-label-caps text-on-surface-variant">© 2024 PredictX Protocol. Institutional Grade Prediction Markets.</div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8">
                        <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-secondary transition-colors uppercase" href="#">Privacy Policy</a>
                        <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-secondary transition-colors uppercase" href="#">Terms of Service</a>
                        <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-secondary transition-colors uppercase" href="#">Github</a>
                        <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-secondary transition-colors uppercase" href="#">Discord</a>
                        <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-secondary transition-colors uppercase" href="#">Status</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
