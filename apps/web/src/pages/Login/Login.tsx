import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useWallet } from '@solana/wallet-adapter-react';
import { SolanaWalletBox } from './SolanaWalletBox';
import './Login.css';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { connected, publicKey, signMessage, disconnect } = useWallet();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isDemoAuthenticating, setIsDemoAuthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cardTransform, setCardTransform] = useState('');
    const [cardOpacity, setCardOpacity] = useState(1);

    useEffect(() => {
        const handleSignAndVerify = async () => {
            if (!publicKey || !signMessage || isAuthenticating) return;
            try {
                setIsAuthenticating(true);
                setError(null);
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                const challengeResponse = await fetch(`${API_URL}/api/auth/challenge?publicKey=${publicKey.toBase58()}`);
                if (!challengeResponse.ok) throw new Error('Challenge fetch failed');
                const { nonce } = await challengeResponse.json();
                const sig = await signMessage(new TextEncoder().encode(`Welcome to Nexus!\n\nSign this message to authenticate.\nNonce: ${nonce}`));
                const signatureHex = Array.from(sig).map(b => b.toString(16).padStart(2, '0')).join('');
                const verifyResponse = await fetch(`${API_URL}/api/auth/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ publicKey: publicKey.toBase58(), signature: signatureHex, nonce }),
                });
                if (!verifyResponse.ok) throw new Error('Verification failed');
                const { access_token, user } = await verifyResponse.json();
                localStorage.setItem('access_token', access_token);
                localStorage.setItem('user', JSON.stringify(user));
                window.dispatchEvent(new Event('auth-change'));
                setCardOpacity(0);
                setCardTransform('translateY(-20px)');
                setTimeout(() => navigate('/dashboard'), 500);
            } catch (err: any) {
                setError(err.message || 'Auth failed');
                await disconnect().catch(() => {});
            } finally {
                setIsAuthenticating(false);
            }
        };
        if (connected && publicKey && !isAuthenticating && signMessage) handleSignAndVerify();
    }, [connected, publicKey, signMessage, isAuthenticating, disconnect, navigate]);

    const handleDemoLogin = async () => {
        try {
            setIsDemoAuthenticating(true);
            setError(null);
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/api/auth/demo`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            if (!response.ok) throw new Error('Demo login failed');
            const { access_token, user } = await response.json();
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('user', JSON.stringify(user));
            window.dispatchEvent(new Event('auth-change'));
            setCardOpacity(0);
            setCardTransform('translateY(-20px)');
            setTimeout(() => navigate('/dashboard'), 500);
        } catch (err: any) {
            setError(err.message || 'Demo Login failed');
        } finally {
            setIsDemoAuthenticating(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen text-on-background font-body-md bg-[#0A0B0D]" onMouseMove={(e) => {
            if (cardOpacity === 0) return;
            setCardTransform(`rotateY(${(window.innerWidth/2 - e.pageX)/50}deg) rotateX(${(window.innerHeight/2 - e.pageY)/50}deg)`);
        }}>
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 login-grid-background opacity-40"></div>
                <div className="login-scanline"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]"></div>
            </div>
            <nav className="top-0 w-full z-50 flex justify-between items-center px-margin-desktop py-4 bg-surface/70 border-b border-outline-variant/30 sticky">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <span className="font-headline-md text-headline-md font-bold text-primary tracking-tighter">Nexus</span>
                </div>
                <button className="p-2 rounded-full hover:bg-surface-variant transition-colors cursor-pointer bg-transparent border-none" onClick={toggleTheme}>
                    <span className="material-symbols-outlined text-on-surface-variant">{isDark ? 'light_mode' : 'dark_mode'}</span>
                </button>
            </nav>
            <main className="flex-grow flex items-center justify-center relative z-10 px-margin-mobile flex-col min-h-[calc(100vh-64px-88px)]" style={{ perspective: '1000px' }}>
                <div className="login-glass-panel w-full max-w-md p-8 rounded-xl transition-all duration-500 my-auto flex flex-col items-center" style={{ background: 'rgba(18,19,21,0.8)', border: '1px solid rgba(0,242,255,0.2)', transform: cardTransform, opacity: cardOpacity }}>
                    <div className="text-center mb-8 w-full">
                        <h1 className="font-display-sm text-display-sm text-primary mb-2">Welcome to Nexus</h1>
                        <p className="font-body-md text-on-surface-variant opacity-80">Connect your Solana wallet to access your portfolio.</p>
                    </div>
                    {error && <div className="bg-error/10 border border-error/30 text-error p-3 rounded-lg text-sm text-center mb-6 w-full">{error}</div>}
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg mb-6 w-full text-xs text-on-surface-variant flex gap-3 text-left">
                        <span className="material-symbols-outlined text-primary text-lg">info</span>
                        <p className="leading-relaxed opacity-85">Connecting your wallet is free (zero gas fees). Trades use mock balances.</p>
                    </div>
                    <SolanaWalletBox isAuthenticating={isAuthenticating} isDemoAuthenticating={isDemoAuthenticating} onDemoLogin={handleDemoLogin} />
                </div>
            </main>
        </div>
    );
};

export default Login;
