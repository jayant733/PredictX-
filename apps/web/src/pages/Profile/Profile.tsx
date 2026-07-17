import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header/Header';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { useTheme } from '../../hooks/useTheme';

const SecurityAlertsPanel = lazy(() =>
  import('./SecurityAlertsPanel').then(module => ({ default: module.SecurityAlertsPanel }))
);

const Profile: React.FC = () => {
    const { isLoggedIn, loading, claims, userId, publicKey, loginTime, signOut, profile, session } = useAuth();
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loadingAlerts, setLoadingAlerts] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const fetchFraudAlerts = async () => {
        if (!isLoggedIn || !session?.access_token) return;
        try {
            const res = await fetch(`${API_URL}/api/fraud/alerts`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAlerts(data);
            }
        } catch (e) {
            console.error("Failed to fetch security alerts:", e);
        } finally {
            setLoadingAlerts(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) fetchFraudAlerts();
    }, [isLoggedIn, session]);

    useEffect(() => {
        if (!loading && !isLoggedIn) navigate('/login');
    }, [loading, isLoggedIn, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className={`bg-background text-on-background font-body-md selection:bg-primary/30 min-h-screen ${isDark ? 'dark' : ''}`}>
            <Header />
            <Sidebar />

            <main className="ml-64 pt-24 px-margin-desktop pb-12 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="font-display-md text-primary tracking-tight">Your Profile</h1>
                    <button 
                        onClick={() => { signOut(); navigate('/'); }}
                        className="bg-error/10 text-error hover:bg-error/20 border border-error/20 px-6 py-2 rounded-full font-label-caps transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        Sign Out
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-6 relative overflow-hidden animate-fade-in">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[50px] -z-10 pointer-events-none"></div>
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-surface-container-high border-2 border-primary flex items-center justify-center overflow-hidden">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-3xl text-primary">person</span>
                                )}
                            </div>
                            <div>
                                <h2 className="font-headline-sm text-on-surface">Authenticated User</h2>
                                <p className="text-sm text-outline font-data-mono">{userId || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-outline-variant/20">
                            <div>
                                <span className="text-xs text-outline font-label-caps block mb-1">CONNECTED WALLET</span>
                                <div className="bg-surface-container-low px-4 py-2 rounded-lg font-data-mono text-sm text-on-surface break-all flex justify-between items-center group">
                                    <span>{publicKey || 'Not connected'}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-outline font-label-caps block mb-1">LAST LOGIN</span>
                                <div className="text-sm text-on-surface">{loginTime || 'Unknown'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-4 animate-fade-in">
                        <h3 className="font-headline-sm text-secondary flex items-center gap-2">
                            <span className="material-symbols-outlined">data_object</span> Raw Claims
                        </h3>
                        <p className="text-xs text-outline">JWT payload from Supabase wallet verify.</p>
                        <div className="bg-[#0A0B0D] rounded-lg p-4 overflow-auto border border-outline-variant/20 h-full max-h-[300px]">
                            <pre className="text-xs text-[#00F2FF] font-data-mono leading-relaxed">
                                {claims ? JSON.stringify(claims, null, 2) : 'No claims available.'}
                            </pre>
                        </div>
                    </div>
                </div>

                <Suspense fallback={<div className="h-24 flex items-center justify-center"><div className="h-6 w-6 border-2 border-error border-t-transparent rounded-full animate-spin"></div></div>}>
                    <SecurityAlertsPanel alerts={alerts} loadingAlerts={loadingAlerts} onRefresh={fetchFraudAlerts} />
                </Suspense>
            </main>
        </div>
    );
};

export default Profile;
