import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createCustomer, fetchCustomers } from '../services/microcms';

export default function Login() {
    const { loginWithGoogle } = useAuth();
    const [tab, setTab] = useState('login'); // 'login' | 'register'
    const [isProcessing, setIsProcessing] = useState(false);

    // Registration Form State
    const [regForm, setRegForm] = useState({
        companyName: '',
        contactName: '',
        phone: '',
    });

    const handleGoogleAuth = async (isRegistering) => {
        setIsProcessing(true);
        try {
            if (isRegistering) {
                // Validate form first
                if (!regForm.companyName) {
                    alert("会社名 / 店舗名を入力してください。");
                    setIsProcessing(false);
                    return;
                }

                const result = await loginWithGoogle();
                const userEmail = result.user.email;

                // Check if user already exists
                const customers = await fetchCustomers();
                const existing = customers.find(c => c.email === userEmail);
                
                if (!existing) {
                    await createCustomer({
                        companyName: regForm.companyName,
                        contactName: regForm.contactName,
                        phone: regForm.phone,
                        email: userEmail,
                        status: 'Inactive',
                        shippingAddress: ''
                    });
                    console.log("Customer record created successfully");
                }
            } else {
                // Normal Login
                await loginWithGoogle();
            }
        } catch (error) {
            console.error("Google auth process failed:", error);
            // Ignore popup closed errors, but alert on true failures
            if (error.code !== 'auth/popup-closed-by-user') {
                alert("認証プロセスに失敗しました。もう一度お試しください。");
            }
        } finally {
            setIsProcessing(false);
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
            <div className="w-full max-w-[440px] flex flex-col gap-8 z-10 animate-in fade-in zoom-in-95 duration-500">

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
                <div className="bg-background-main border border-border-dark p-8 md:p-10 relative overflow-hidden shadow-2xl">
                    {/* Decorative Accent Corner */}
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/40"></div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-border-dark mb-8">
                        <button 
                            className={`flex-1 py-3 text-sm font-bold tracking-widest transition-colors ${tab === 'login' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-text-muted hover:text-text-main'}`}
                            onClick={() => setTab('login')}
                        >
                            ログイン
                        </button>
                        <button 
                            className={`flex-1 py-3 text-sm font-bold tracking-widest transition-colors ${tab === 'register' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-text-muted hover:text-text-main'}`}
                            onClick={() => setTab('register')}
                        >
                            新規販売店登録
                        </button>
                    </div>

                    {tab === 'login' ? (
                        /* LOGIN VIEW */
                        <div className="animate-in fade-in duration-300">
                            <h2 className="text-xl font-bold mb-6 text-center tracking-tight text-text-main">既存アカウントでログイン</h2>
                            <p className="text-xs text-text-muted text-center mb-8 leading-relaxed">
                                登録済みのGoogleアカウントを使用して<br/>B2B発注システムにアクセスします。
                            </p>

                            <button
                                type="button"
                                onClick={() => handleGoogleAuth(false)}
                                disabled={isProcessing}
                                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 px-4 transition-colors duration-200 shadow-md disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <span className="material-symbols-outlined animate-spin text-slate-500">sync</span>
                                ) : (
                                    <>
                                        <svg height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                                        </svg>
                                        <span className="text-sm font-bold tracking-tight">Googleでログイン</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        /* REGISTER VIEW */
                        <div className="animate-in fade-in duration-300">
                            <h2 className="text-xl font-bold mb-6 text-center tracking-tight text-text-main">新規販売店アカウントの発行</h2>
                            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-text-main">会社名 / 店舗名 <span className="text-accent-red">*</span></label>
                                    <input
                                        type="text"
                                        value={regForm.companyName}
                                        onChange={(e) => setRegForm({...regForm, companyName: e.target.value})}
                                        className="w-full p-2.5 text-sm text-text-main placeholder-slate-500 focus:ring-1 focus:ring-primary focus:border-primary bg-surface border border-border-dark transition-all"
                                        placeholder="例: 株式会社ビッグロック"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-text-main">担当者名</label>
                                        <input
                                            type="text"
                                            value={regForm.contactName}
                                            onChange={(e) => setRegForm({...regForm, contactName: e.target.value})}
                                            className="w-full p-2.5 text-sm text-text-main placeholder-slate-500 focus:ring-1 focus:ring-primary focus:border-primary bg-surface border border-border-dark transition-all"
                                            placeholder="例: 山田太郎"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-text-main">電話番号</label>
                                        <input
                                            type="tel"
                                            value={regForm.phone}
                                            onChange={(e) => setRegForm({...regForm, phone: e.target.value})}
                                            className="w-full p-2.5 text-sm text-text-main placeholder-slate-500 focus:ring-1 focus:ring-primary focus:border-primary bg-surface border border-border-dark transition-all font-mono"
                                            placeholder="03-1234-5678"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <p className="text-[10px] text-text-muted mb-3 leading-relaxed">
                                        「Googleアカウントで連携して申請する」をクリックすると、選択したGoogleアカウントのメールアドレスがB2Bログイン用IDとして登録されます。※登録後、取引審査のため「承認待ち」となります。
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => handleGoogleAuth(true)}
                                        disabled={isProcessing || !regForm.companyName}
                                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 px-4 transition-colors duration-200 shadow-md disabled:opacity-50"
                                    >
                                        {isProcessing ? (
                                            <span className="material-symbols-outlined animate-spin text-slate-500">sync</span>
                                        ) : (
                                            <>
                                                <svg height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                                                </svg>
                                                <span className="text-sm font-bold tracking-tight">Google連携で申請する</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Footer Links */}
                <div className="flex justify-center gap-6 mt-4">
                    <a href="#" className="text-xs text-text-muted hover:text-primary transition-colors hover:underline decoration-dotted underline-offset-4 tracking-widest uppercase font-mono">B2B利用規約</a>
                    <a href="#" className="text-xs text-text-muted hover:text-primary transition-colors hover:underline decoration-dotted underline-offset-4 tracking-widest uppercase font-mono">プライバシーポリシー</a>
                    <a href="#" className="text-xs text-text-muted hover:text-primary transition-colors hover:underline decoration-dotted underline-offset-4 tracking-widest uppercase font-mono">公式ウェブサイト</a>
                </div>
            </div>
        </div>
    );
}
