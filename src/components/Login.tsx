'use client';

import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

interface LoginProps {
    onLogin: (password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(false);

        // Simulate a small delay for premium feel
        setTimeout(() => {
            onLogin(password);
            setIsSubmitting(false);
            // If it returns, it means login failed in the parent
            setError(true);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-blue-500/30">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-700">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-blue-500/20 shadow-inner">
                            <Lock className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight italic">Salesforce Dashboard</h1>
                        <p className="text-slate-400 text-sm mt-2">正式版閲覧にはパスワードが必要です</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest ml-1">
                                Password
                            </label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 transition-all outline-none"
                                    autoFocus
                                />
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-700 group-focus-within:text-blue-500/50 transition-colors">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 animate-in slide-in-from-top-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span className="text-xs font-medium">パスワードが正しくありません</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || !password}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "ログイン"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-800/50 flex justify-center">
                        <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em]">
                            Secure Access Protocol v2.4
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
