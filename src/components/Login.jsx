import React from 'react';

import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { loginWithGoogle } = useAuth();

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            console.error("Google sign in failed:", error);
            alert("ログインに失敗しました。もう一度お試しください。");
        }
    };

    return (
        <div className="font-display bg-background-main text-slate-100 min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Effect */}
            <div className="absolute inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'linear-gradient(rgba(242, 200, 74, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 200, 74, 0.03) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}>
            </div>

            {/* Login Container */}
            <div className="w-full max-w-[440px] flex flex-col gap-8 z-10">

                {/* Logo Section */}
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary flex items-center justify-center text-background-main">
                            <span className="material-symbols-outlined !text-4xl font-bold">architecture</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold tracking-tighter uppercase leading-none text-text-main">Big Rock</h1>
                            <span className="text-primary font-mono text-sm tracking-widest leading-none mt-1 font-bold">B2B PROCUREMENT</span>
                        </div>
                    </div>
                </div>

                {/* Auth Card */}
                <div className="bg-background-main border border-primary/20 p-8 md:p-10 relative overflow-hidden shadow-2xl">
                    {/* Decorative Accent Corner */}
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/40"></div>

                    <h2 class="text-2xl font-bold mb-8 text-center tracking-tight font-display">ログイン</h2>

                    {/* Google Sign-In */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 transition-colors duration-200"
                    >
                        <svg height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                        </svg>
                        <span className="text-sm font-mono tracking-tight">Googleでログイン</span>
                    </button>

                    <div className="relative my-8 flex items-center">
                        <div className="flex-grow border-t border-black/10"></div>
                        <span className="flex-shrink mx-4 text-xs font-mono text-slate-500 uppercase tracking-widest">または</span>
                        <div className="flex-grow border-t border-black/10"></div>
                    </div>

                    {/* Traditional Login Form */}
                    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Currently only Google Sign-In is supported for B2B accounts."); }}>
                        <div className="space-y-2">
                            <label className="block text-xs font-mono font-medium text-primary/80 uppercase tracking-widest">Email Address</label>
                            <input
                                className="w-full p-3 text-sm text-text-main placeholder-slate-600 focus:ring-1 focus:ring-primary focus:border-primary bg-black/5 border border-primary/20"
                                placeholder="name@company.com"
                                type="email"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="block text-xs font-mono font-medium text-primary/80 uppercase tracking-widest">Password</label>
                                <a className="text-[10px] font-mono text-slate-500 hover:text-primary transition-colors" href="#">パスワードを忘れた場合</a>
                            </div>
                            <div className="relative">
                                <input
                                    className="w-full p-3 text-sm text-text-main placeholder-slate-600 focus:ring-1 focus:ring-primary focus:border-primary bg-black/5 border border-primary/20"
                                    placeholder="••••••••"
                                    type="password"
                                />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary" type="button">
                                    <span className="material-symbols-outlined !text-lg">visibility</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 py-2">
                            <input className="w-4 h-4 bg-black/5 rounded-none checked:bg-primary border-primary/40 focus:ring-0" id="remember" type="checkbox" />
                            <label className="text-xs font-mono text-slate-400 cursor-pointer" htmlFor="remember">ログイン状態を保持する</label>
                        </div>

                        <button
                            className="w-full bg-primary hover:bg-[#e0b93d] text-background-main font-bold py-3 px-4 transition-all duration-200 uppercase tracking-widest text-sm font-mono flex items-center justify-center gap-2 group"
                            type="submit"
                        >
                            ログイン
                            <span className="material-symbols-outlined !text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                    </form>
                </div>

                {/* Support Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-2">
                    <div className="flex items-center gap-4">
                        <a className="text-xs font-mono text-slate-500 hover:text-primary uppercase tracking-tighter" href="#">新規登録リクエスト</a>
                        <span className="text-slate-800">|</span>
                        <a className="text-xs font-mono text-slate-500 hover:text-primary uppercase tracking-tighter" href="#">ヘルプセンター</a>
                    </div>
                    <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                        v2.4.0-STABLE
                    </div>
                </div>
            </div>

            {/* Decorative Schematic Background Elements */}
            <div className="absolute bottom-10 left-10 opacity-10 pointer-events-none hidden lg:block z-0">
                <div className="font-mono text-[10px] text-primary space-y-1">
                    <p>// SYSTEM_STATUS: OPERATIONAL</p>
                    <p>// AUTH_MODULE: READY</p>
                    <p>// ENCRYPTION: AES-256-GCM</p>
                </div>
            </div>

            <div className="absolute top-10 right-10 opacity-5 pointer-events-none z-0">
                <svg fill="none" height="200" stroke="#f2c84a" strokeWidth="0.5" viewBox="0 0 100 100" width="200" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 10H90V90H10V10Z"></path>
                    <path d="M10 50H90"></path>
                    <path d="M50 10V90"></path>
                    <circle cx="50" cy="50" r="30"></circle>
                    <path d="M20 20L80 80"></path>
                    <path d="M80 20L20 80"></path>
                </svg>
            </div>

        </div>
    );
}
