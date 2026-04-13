import React, { useState } from 'react';
import { updateCustomer } from '../services/microcms';

export default function Profile({ customerProfile, setCustomerProfile }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Initialize form state with customer profile data
    const [formData, setFormData] = useState({
        companyName: customerProfile?.companyName || '',
        companyNameKana: customerProfile?.companyNameKana || '',
        repName: customerProfile?.repName || '',
        repNameKana: customerProfile?.repNameKana || '',
        department: customerProfile?.department || '',
        contactName: customerProfile?.contactName || '',
        contactNameKana: customerProfile?.contactNameKana || '',
        phone: customerProfile?.phone || '',
        mobilePhone: customerProfile?.mobilePhone || '',
        fax: customerProfile?.fax || '',
        shippingAddress: customerProfile?.shippingAddress || '',
        industry: customerProfile?.industry || '',
        established: customerProfile?.established || '',
        annualSales: customerProfile?.annualSales || '',
        websiteUrl: customerProfile?.websiteUrl || ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        if (!customerProfile?.id) {
            alert('エラ－：顧客IDが見つかりません。');
            return;
        }

        // Basic validation
        if (!formData.companyName || !formData.repName || !formData.contactName || !formData.phone || !formData.shippingAddress) {
            alert('必須項目(*)を入力してください。');
            return;
        }

        setIsSaving(true);
        try {
            const updatedData = { ...formData };
            await updateCustomer(customerProfile.id, updatedData);
            
            // Update the global state
            setCustomerProfile(prev => ({
                ...prev,
                ...updatedData
            }));
            
            setIsEditing(false);
            alert('登録情報を更新しました。');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert(`情報の更新に失敗しました。\n詳細: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset form data to original profile data
        setFormData({
            companyName: customerProfile?.companyName || '',
            companyNameKana: customerProfile?.companyNameKana || '',
            repName: customerProfile?.repName || '',
            repNameKana: customerProfile?.repNameKana || '',
            department: customerProfile?.department || '',
            contactName: customerProfile?.contactName || '',
            contactNameKana: customerProfile?.contactNameKana || '',
            phone: customerProfile?.phone || '',
            mobilePhone: customerProfile?.mobilePhone || '',
            fax: customerProfile?.fax || '',
            shippingAddress: customerProfile?.shippingAddress || '',
            industry: customerProfile?.industry || '',
            established: customerProfile?.established || '',
            annualSales: customerProfile?.annualSales || '',
            websiteUrl: customerProfile?.websiteUrl || ''
        });
        setIsEditing(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 pb-24 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 border border-border-subtle rounded shadow-sm">
                <div>
                    <h2 className="text-xl font-bold font-display text-text-main flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">manage_accounts</span>
                        登録情報の確認・変更
                    </h2>
                    <p className="text-sm text-text-muted mt-2">
                        現在登録されているお客様のアカウント情報です。<br className="hidden md:block" />
                        住所や連絡先が変更になった場合は、こちらから更新をお願いいたします。
                    </p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-background-main border border-border-dark hover:bg-surface-highlight text-text-main font-bold py-2.5 px-6 rounded transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        編集モードにする
                    </button>
                )}
            </div>

            <div className={`bg-surface border ${isEditing ? 'border-primary ring-1 ring-primary/20' : 'border-border-subtle'} rounded p-6 shadow-sm`}>
                {isEditing && (
                    <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-md text-sm text-text-main">
                        <span className="material-symbols-outlined text-primary text-[18px] inline-block align-text-bottom mr-1">info</span>
                        編集モード中です。変更を保存するにはページ下部の「保存する」ボタンを押してください。
                    </div>
                )}

                <div className="space-y-8">
                    {/* 会社情報 */}
                    <div className="space-y-4">
                        <h3 className="text-base font-bold border-b border-border-dark pb-2 text-text-main">会社・店舗情報</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="会社名 / 店舗名" name="companyName" value={formData.companyName} onChange={handleChange} isEditing={isEditing} required />
                            <InputField label="会社名カナ" name="companyNameKana" value={formData.companyNameKana} onChange={handleChange} isEditing={isEditing} />
                            <InputField label="代表者名" name="repName" value={formData.repName} onChange={handleChange} isEditing={isEditing} required placeholder="例: 山田 太郎" />
                            <InputField label="代表者名カナ" name="repNameKana" value={formData.repNameKana} onChange={handleChange} isEditing={isEditing} placeholder="例: ヤマダ タロウ" />
                        </div>
                    </div>

                    {/* 担当者情報 */}
                    <div className="space-y-4">
                        <h3 className="text-base font-bold border-b border-border-dark pb-2 text-text-main">ご担当者情報</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="部署名" name="department" value={formData.department} onChange={handleChange} isEditing={isEditing} />
                            <InputField label="担当者名" name="contactName" value={formData.contactName} onChange={handleChange} isEditing={isEditing} required placeholder="例: 佐藤 次郎" />
                            <InputField label="担当者名カナ" name="contactNameKana" value={formData.contactNameKana} onChange={handleChange} isEditing={isEditing} placeholder="例: サトウ ジロウ" />
                        </div>
                    </div>

                    {/* 連絡先・所在地 */}
                    <div className="space-y-4">
                        <h3 className="text-base font-bold border-b border-border-dark pb-2 text-text-main">連絡先・配送先・請求先</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="電話番号 (固定優先)" name="phone" value={formData.phone} onChange={handleChange} isEditing={isEditing} required type="tel" />
                            <InputField label="携帯番号" name="mobilePhone" value={formData.mobilePhone} onChange={handleChange} isEditing={isEditing} type="tel" />
                            <InputField label="FAX番号" name="fax" value={formData.fax} onChange={handleChange} isEditing={isEditing} type="tel" />
                        </div>
                        
                        <div className="pt-2">
                            <label className="block text-xs font-bold text-text-main mb-1.5">
                                配送先住所・請求先情報 <span className="text-accent-red">*</span>
                            </label>
                            {isEditing ? (
                                <>
                                    <textarea
                                        name="shippingAddress"
                                        value={formData.shippingAddress}
                                        onChange={handleChange}
                                        rows={8}
                                        className="w-full bg-background-main border border-border-dark px-4 py-3 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all custom-scrollbar text-sm"
                                        placeholder="〒000-0000 東京都... / 請求先が異なる場合は併記してください"
                                    />
                                    <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                                        ※郵便番号から住所まで全てご記入ください。<br/>
                                        ※請求書送付先が異なる場合は、この欄に追記していただいて構いません。
                                    </p>
                                </>
                            ) : (
                                <div className="p-4 bg-background-main border border-border-subtle rounded min-h-[100px] text-sm whitespace-pre-wrap leading-relaxed text-text-main">
                                    {formData.shippingAddress || <span className="text-text-muted/50 italic">未登録</span>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 企業付加情報 */}
                    <div className="space-y-4">
                        <h3 className="text-base font-bold border-b border-border-dark pb-2 text-text-main">企業付加情報</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="設立年月" name="established" value={formData.established} onChange={handleChange} isEditing={isEditing} />
                            <InputField label="業態 / 業種" name="industry" value={formData.industry} onChange={handleChange} isEditing={isEditing} />
                            <InputField label="年商 (千円)" name="annualSales" value={formData.annualSales} onChange={handleChange} isEditing={isEditing} />
                            <InputField label="ホームページURL" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} isEditing={isEditing} type="url" />
                        </div>
                    </div>
                </div>

                {/* ログイン・メール情報（読み取り専用） */}
                <div className="mt-8 pt-6 border-t border-border-dark">
                    <h3 className="text-sm font-bold text-text-muted mb-4 uppercase tracking-wider">ログインアカウント情報 (変更不可)</h3>
                    <div className="bg-background-main p-4 rounded border border-border-subtle inline-block min-w-full md:min-w-[50%]">
                        <div className="text-xs text-text-muted mb-1">ログイン用Googleアカウント（Email）</div>
                        <div className="text-sm font-bold text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">mail</span>
                            {customerProfile?.email}
                        </div>
                        <p className="text-[10px] text-text-muted mt-2">※メールアドレスの変更をご希望の場合は、システム管理者へ直接お問い合わせください。</p>
                    </div>
                </div>

                {/* アクションボタン */}
                {isEditing && (
                    <div className="mt-8 pt-6 border-t border-border-dark flex flex-col md:flex-row justify-end gap-4 sticky bottom-4">
                        <button
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="px-8 py-3 rounded font-bold text-text-main bg-background-main border border-border-dark hover:bg-surface-highlight transition-colors w-full md:w-auto"
                        >
                            変更を破棄して戻る
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-8 py-3 rounded font-bold bg-primary text-white hover:bg-primary-hover shadow-lg transition-all flex items-center justify-center gap-2 min-w-[200px] w-full md:w-auto"
                        >
                            {isSaving ? (
                                <span className="material-symbols-outlined animate-spin">sync</span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">save</span>
                                    更新内容を保存する
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// 共通入力フィールドコンポーネント (Profile内包)
function InputField({ label, name, value, onChange, isEditing, required = false, type = "text", placeholder = "" }) {
    return (
        <div className="space-y-1.5 flex flex-col h-full">
            <label className="block text-xs font-bold text-text-main">
                {label} {required && <span className="text-accent-red">*</span>}
            </label>
            {isEditing ? (
                <input
                    type={type}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full bg-background-main border border-border-dark px-3 py-2.5 rounded text-sm text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all h-[42px]"
                />
            ) : (
                <div className="w-full bg-background-main border border-border-subtle px-3 py-2.5 rounded text-sm text-text-main h-[42px] flex items-center bg-opacity-50">
                    {value ? value : <span className="text-text-muted/50 italic text-xs">未登録</span>}
                </div>
            )}
        </div>
    );
}
