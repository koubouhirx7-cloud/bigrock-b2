import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createCustomer, fetchCustomers } from '../services/microcms';

export default function Register({ setParentTab }) {
    const { loginWithGoogle, logout } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);

    // Initial State for Comprehensive Registration Form
    const [regForm, setRegForm] = useState({
        companyName: '',
        companyNameKana: '',
        representativeLastName: '',
        representativeFirstName: '',
        representativeLastNameKana: '',
        representativeFirstNameKana: '',
        department: '',
        contactLastName: '',
        contactFirstName: '',
        contactLastNameKana: '',
        contactFirstNameKana: '',
        postalCode: '',
        addressLine1: '',
        addressLine2: '',
        phone: '',
        mobilePhone: '',
        fax: '',
        establishedYearMonth: '',
        annualSales: '',
        industry: '',
        websiteUrl: '',
        newsletter: true,
        termsAgreed: false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setRegForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handlePostalCodeChange = async (e) => {
        const val = e.target.value;
        setRegForm(prev => ({ ...prev, postalCode: val }));
        
        const cleanCode = val.replace(/-/g, '');
        if (cleanCode.length === 7) {
            try {
                const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanCode}`);
                const data = await response.json();
                if (data.status === 200 && data.results) {
                    const result = data.results[0];
                    const address = `${result.address1}${result.address2}${result.address3}`;
                    setRegForm(prev => ({
                        ...prev,
                        addressLine1: address
                    }));
                }
            } catch (error) {
                console.error("Postal code search failed:", error);
            }
        }
    };

    const handleSubmit = async () => {
        if (!regForm.termsAgreed) {
            alert("利用規約への同意が必要です。");
            return;
        }

        // Basic Validation
        if (!regForm.companyName || !regForm.companyNameKana || !regForm.representativeLastName || !regForm.representativeFirstName || !regForm.contactLastName || !regForm.contactFirstName || !regForm.postalCode || !regForm.addressLine1 || !regForm.phone) {
            alert("必須項目(*)をすべて入力してください。");
            return;
        }

        setIsProcessing(true);
        try {
            const result = await loginWithGoogle();
            const userEmail = result.user.email;

            // Check if user already exists
            const customers = await fetchCustomers();
            const existing = customers.find(c => c.email === userEmail);
            
            if (!existing) {
                const fullAddress = `〒${regForm.postalCode} ${regForm.addressLine1} ${regForm.addressLine2}`.trim();
                const representativeName = `${regForm.representativeLastName} ${regForm.representativeFirstName}`.trim();
                const representativeNameKana = `${regForm.representativeLastNameKana} ${regForm.representativeFirstNameKana}`.trim();
                const contactName = `${regForm.contactLastName} ${regForm.contactFirstName}`.trim();
                const contactNameKana = `${regForm.contactLastNameKana} ${regForm.contactFirstNameKana}`.trim();

                await createCustomer({
                    companyName: regForm.companyName,
                    companyNameKana: regForm.companyNameKana,
                    repName: representativeName,
                    repNameKana: representativeNameKana,
                    department: regForm.department,
                    contactName: contactName,
                    contactNameKana: contactNameKana,
                    phone: regForm.phone,
                    mobilePhone: regForm.mobilePhone,
                    fax: regForm.fax,
                    established: regForm.establishedYearMonth,
                    annualSales: regForm.annualSales,
                    industry: regForm.industry,
                    websiteUrl: regForm.websiteUrl,
                    email: userEmail,
                    status: 'Inactive',
                    shippingAddress: fullAddress
                });
                console.log("Customer record created successfully");
                // The parent component or global state will trigger re-render on auth state change
            } else {
                alert("このGoogleアカウントは既に登録されています。ログイン画面からログインしてください。");
                setParentTab('login');
            }
        } catch (error) {
            console.error("Registration process failed:", error);
            if (error.code !== 'auth/popup-closed-by-user') {
                alert("認証プロセスに失敗しました。もう一度お試しください。");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-300 w-full">
            <h2 className="text-xl font-bold mb-6 text-center tracking-tight text-text-main">新規販売店アカウントの発行</h2>
            
            <p className="text-xs text-text-muted mb-6 bg-surface-highlight p-3 rounded border border-border-dark leading-relaxed">
                以下のフォームに必要事項をご入力の上、Googleアカウントで申請手続きを完了してください。<br/>
                申請後、弊社にて取引審査を行い、結果をご連絡いたします。
            </p>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                {/* 会社情報 */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold border-b border-border-dark pb-2 text-primary">会社情報</h3>
                    
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-text-main">会社名 / 店舗名 <span className="text-accent-red">*</span></label>
                        <input type="text" name="companyName" value={regForm.companyName} onChange={handleChange} className="w-full p-2.5 text-sm text-text-main placeholder-slate-500 focus:ring-1 focus:ring-primary focus:border-primary bg-surface border border-border-dark transition-all" placeholder="例: 株式会社ビッグロック" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-text-main">会社名カナ <span className="text-accent-red">*</span></label>
                        <input type="text" name="companyNameKana" value={regForm.companyNameKana} onChange={handleChange} className="w-full p-2.5 text-sm text-text-main placeholder-slate-500 focus:ring-1 focus:ring-primary focus:border-primary bg-surface border border-border-dark transition-all" placeholder="例: カブシキガイシャビッグロック" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-text-main">代表者姓 <span className="text-accent-red">*</span></label>
                            <input type="text" name="representativeLastName" value={regForm.representativeLastName} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark" placeholder="例: 山田" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-text-main">代表者名 <span className="text-accent-red">*</span></label>
                            <input type="text" name="representativeFirstName" value={regForm.representativeFirstName} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark" placeholder="例: 太郎" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-text-main">代表者姓カナ <span className="text-accent-red">*</span></label>
                            <input type="text" name="representativeLastNameKana" value={regForm.representativeLastNameKana} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark" placeholder="例: ヤマダ" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-text-main">代表者名カナ <span className="text-accent-red">*</span></label>
                            <input type="text" name="representativeFirstNameKana" value={regForm.representativeFirstNameKana} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark" placeholder="例: タロウ" />
                        </div>
                    </div>
                </div>

                {/* 担当者情報 */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold border-b border-border-dark pb-2 mt-8 text-primary">担当者情報</h3>
                    
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-text-main">部署名</label>
                        <input type="text" name="department" value={regForm.department} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark" placeholder="例: 営業部" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-text-main">担当者姓 <span className="text-accent-red">*</span></label>
                            <input type="text" name="contactLastName" value={regForm.contactLastName} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark" placeholder="例: 佐藤" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-text-main">担当者名 <span className="text-accent-red">*</span></label>
                            <input type="text" name="contactFirstName" value={regForm.contactFirstName} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark" placeholder="例: 次郎" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-text-main">担当者姓カナ <span className="text-accent-red">*</span></label>
                            <input type="text" name="contactLastNameKana" value={regForm.contactLastNameKana} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark" placeholder="例: サトウ" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-text-main">担当者名カナ <span className="text-accent-red">*</span></label>
                            <input type="text" name="contactFirstNameKana" value={regForm.contactFirstNameKana} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark" placeholder="例: ジロウ" />
                        </div>
                    </div>
                </div>

                {/* 連絡先・所在地 */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold border-b border-border-dark pb-2 mt-8 text-primary">連絡先・所在地</h3>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-text-main">郵便番号 <span className="text-accent-red">*</span></label>
                        <input type="text" name="postalCode" value={regForm.postalCode} onChange={handlePostalCodeChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark font-mono" placeholder="例: 1500001" maxLength={8} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-text-main">都道府県・市区町村・番地 <span className="text-accent-red">*</span></label>
                        <input type="text" name="addressLine1" value={regForm.addressLine1} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark" placeholder="例: 東京都渋谷区神宮前1-1-1" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-text-main">建物名・部屋番号など</label>
                        <input type="text" name="addressLine2" value={regForm.addressLine2} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark" placeholder="例: ビッグロックビル 1F" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-text-main">電話番号 (固定優先) <span className="text-accent-red">*</span></label>
                            <input type="tel" name="phone" value={regForm.phone} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark font-mono" placeholder="03-1234-5678" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-text-main">携帯番号</label>
                            <input type="tel" name="mobilePhone" value={regForm.mobilePhone} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark font-mono" placeholder="090-1234-5678" />
                        </div>
                    </div>
                    
                    <div className="space-y-1.5 pt-2">
                        <label className="block text-xs font-bold text-text-main">FAX番号</label>
                        <input type="tel" name="fax" value={regForm.fax} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark font-mono" placeholder="03-1234-5679" />
                    </div>
                </div>

                {/* 企業情報 */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold border-b border-border-dark pb-2 mt-8 text-primary">企業付加情報</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-text-main">設立年月</label>
                            <input type="text" name="establishedYearMonth" value={regForm.establishedYearMonth} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark font-mono" placeholder="例: 2010年4月" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-text-main">業態 / 業種</label>
                            <input type="text" name="industry" value={regForm.industry} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark" placeholder="例: 小売店 / プロショップ" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-text-main">年商 (千円)</label>
                        <input type="text" name="annualSales" value={regForm.annualSales} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark font-mono" placeholder="例: 10000" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-text-main">ホームページURL</label>
                        <input type="url" name="websiteUrl" value={regForm.websiteUrl} onChange={handleChange} className="w-full p-2.5 text-sm bg-surface border border-border-dark font-mono" placeholder="https://www.example.com" />
                    </div>
                </div>

                {/* 同意事項 */}
                <div className="pt-6 pb-2 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-surface-highlight border border-border-dark rounded hover:bg-black/5 transition-colors">
                        <input type="checkbox" name="newsletter" checked={regForm.newsletter} onChange={handleChange} className="w-4 h-4 text-primary bg-background-main border-border-dark rounded focus:ring-primary" />
                        <span className="text-sm text-text-main">お得な情報やご案内のメールを受け取る</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-surface-highlight border border-border-dark rounded hover:bg-black/5 transition-colors">
                        <input type="checkbox" name="termsAgreed" checked={regForm.termsAgreed} onChange={handleChange} className="w-4 h-4 text-primary bg-background-main border-border-dark rounded focus:ring-primary" />
                        <span className="text-sm text-text-main font-bold"><a href="#" className="text-primary hover:underline" onClick={(e) => e.preventDefault()}>B2B利用規約</a> および <a href="#" className="text-primary hover:underline" onClick={(e) => e.preventDefault()}>プライバシーポリシー</a> に同意する <span className="text-accent-red">*</span></span>
                    </label>
                </div>

                <div className="pt-4">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-4 px-4 transition-colors duration-200 shadow-md disabled:opacity-50 text-base"
                    >
                        {isProcessing ? (
                            <span className="material-symbols-outlined animate-spin text-slate-500">sync</span>
                        ) : (
                            <>
                                <svg height="22" viewBox="0 0 24 24" width="22" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                                </svg>
                                <span className="font-bold tracking-tight">Googleアカウントで申請手続きを完了する</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
