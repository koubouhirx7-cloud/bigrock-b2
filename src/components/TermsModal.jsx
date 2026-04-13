import React from 'react';

export default function TermsModal({ isOpen, onClose, initialView = 'terms' }) {
    if (!isOpen) return null;

    // We can swap views if needed, or simply render both. Here we map both for simplicity.
    const [view, setView] = React.useState(initialView); // 'terms' | 'privacy'

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-surface w-full max-w-3xl h-full max-h-[85vh] rounded shadow-2xl flex flex-col overflow-hidden border border-border-dark animate-in zoom-in-95 duration-200 relative">
                
                {/* Header Navigation */}
                <div className="flex border-b border-border-dark bg-surface-highlight shrink-0 flex-wrap">
                    <button 
                        className={`flex-1 py-4 px-2 text-xs md:text-sm font-bold tracking-widest transition-colors whitespace-nowrap ${view === 'terms' ? 'text-primary border-b-2 border-primary bg-background-main' : 'text-text-muted hover:text-text-main hover:bg-background-main/50'}`}
                        onClick={() => setView('terms')}
                    >
                        B2B利用規約
                    </button>
                    <button 
                        className={`flex-1 py-4 px-2 text-xs md:text-sm font-bold tracking-widest transition-colors whitespace-nowrap ${view === 'privacy' ? 'text-primary border-b-2 border-primary bg-background-main' : 'text-text-muted hover:text-text-main hover:bg-background-main/50'}`}
                        onClick={() => setView('privacy')}
                    >
                        プライバシーポリシー
                    </button>
                    <button 
                        className={`flex-1 py-4 px-2 text-xs md:text-sm font-bold tracking-widest transition-colors whitespace-nowrap ${view === 'tokushoho' ? 'text-primary border-b-2 border-primary bg-background-main' : 'text-text-muted hover:text-text-main hover:bg-background-main/50'}`}
                        onClick={() => setView('tokushoho')}
                    >
                        特定商取引法に基づく表記
                    </button>
                    <button onClick={onClose} className="px-4 md:px-6 border-l border-border-dark text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-background-main">
                    
                    {view === 'terms' && (
                        <div className="prose prose-sm prose-invert max-w-none text-text-main">
                            <h2 className="text-xl font-bold mb-6 text-primary tracking-tight">B2B取引 利用規約</h2>
                            
                            <div className="space-y-8 leading-relaxed">
                                <section>
                                    <h3 className="text-sm font-bold mb-3 border-b border-border-dark pb-2 text-slate-200">第1条（目的および適用範囲）</h3>
                                    <p className="text-sm text-slate-300">
                                        本規約は、Highlander / 里山の自転車店（以下「当社」といいます）が運営するB2B発注システム（以下「本システム」といいます）を、販売店（以下「ディーラー」といいます）が利用する際の条件を定めるものです。
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold mb-3 border-b border-border-dark pb-2 text-slate-200">第2条（利用登録とアカウント管理）</h3>
                                    <p className="text-sm text-slate-300">
                                        1. 本システムの利用を希望する法人は、本規約に同意の上、当社所定の方法により利用登録を申請するものとします。<br />
                                        2. 登録にはGoogleアカウントが必要となります。ディーラーは自身のアカウント（メールアドレス等）を自己の責任において厳重に管理し、第三者への貸与や譲渡を禁じます。<br />
                                        3. 当社は、申請者が当社の取引基準を満たさないと判断した場合、登録を承認しない権利を有します。
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold mb-3 border-b border-border-dark pb-2 text-slate-200">第3条（商品の発注および売買契約の成立）</h3>
                                    <p className="text-sm text-slate-300">
                                        1. ディーラーは、本システムを通じて提供される価格・在庫情報を元に商品の発注を行うことができます。<br />
                                        2. 発注に対する当社からの「注文確認（または入金確認）」の通知がディーラーに到達した時点で、該当商品に関する売買契約が成立するものとします。<br />
                                        3. 納期遅延、在庫不足、またはその他の不可抗力により、ご希望の数量や納期での提供が困難な場合、当社は契約の変更またはキャンセルを協議する権利を有します。
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold mb-3 border-b border-border-dark pb-2 text-slate-200">第4条（支払条件）</h3>
                                    <p className="text-sm text-slate-300">
                                        発注代金の支払いは、別途当社が指定する銀行振込、または両者間で別途合意した取引条件（掛売り等）に従うものとします。振込手数料は原則としてディーラーの負担とします。
                                    </p>
                                </section>
                                
                                <section>
                                    <h3 className="text-sm font-bold mb-3 border-b border-border-dark pb-2 text-slate-200">第5条（免責事項および損害賠償）</h3>
                                    <p className="text-sm text-slate-300">
                                        1. 当社は、本システムの稼働状態について細心の注意を払いますが、システム障害やデータ消失によりディーラーに事業上の損害が生じた場合であっても、当社は原則として賠償の責任を負わないものとします。<br />
                                        2. 当社に故意または重過失があった場合に限り、該当取引の金額を上限として損害を賠償します。
                                    </p>
                                </section>
                            </div>
                        </div>
                    )}

                    {view === 'privacy' && (
                        <div className="prose prose-sm prose-invert max-w-none text-text-main">
                            <h2 className="text-xl font-bold mb-6 text-primary tracking-tight">プライバシーポリシー</h2>
                            
                            <div className="space-y-8 leading-relaxed">
                                <section>
                                    <h3 className="text-sm font-bold mb-3 border-b border-border-dark pb-2 text-slate-200">第1条（個人情報の取得方針）</h3>
                                    <p className="text-sm text-slate-300">
                                        Highlander / 里山の自転車店（以下「当社」といいます）は、B2B業務の遂行および本システムの提供にあたり、ディーラーの担当者様の氏名、連絡先（電話番号、メールアドレス等）、所在地の情報を適正かつ公正な手段で取得します。
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold mb-3 border-b border-border-dark pb-2 text-slate-200">第2条（個人情報の利用目的）</h3>
                                    <p className="text-sm text-slate-300">
                                        当社が取得した個人情報の利用目的は以下の通りです。
                                    </p>
                                    <ul className="list-disc pl-5 mt-2 text-sm text-slate-400 space-y-1">
                                        <li>商品の発送、納品書・請求書の送付等、取引の履行のため</li>
                                        <li>本システムのアカウント管理および認証のため</li>
                                        <li>製品情報、重要なお知らせ（リコール等を含む）の提供のため</li>
                                        <li>お問い合わせへの対応および業務上の連絡のため</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold mb-3 border-b border-border-dark pb-2 text-slate-200">第3条（第三者への提供制限）</h3>
                                    <p className="text-sm text-slate-300">
                                        当社は、以下の場合を除き、取得した個人情報を第三者に提供・開示することはいたしません。
                                        (1) 本人の同意がある場合
                                        (2) 法令に基づき開示を要請された場合
                                        (3) 配送業者等、業務の遂行に必要な範囲で業務委託先に提供する場合
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold mb-3 border-b border-border-dark pb-2 text-slate-200">第4条（安全管理措置）</h3>
                                    <p className="text-sm text-slate-300">
                                        当社は、取り扱う個人情報の漏洩、滅失またはき損の防止、その他個人情報の安全管理のために必要かつ適切な措置を講じます。
                                    </p>
                                </section>
                            </div>
                        </div>
                    )}

                    {view === 'tokushoho' && (
                        <div className="prose prose-sm prose-invert max-w-none text-text-main">
                            <h2 className="text-xl font-bold mb-6 text-primary tracking-tight">特定商取引法に基づく表記</h2>
                            
                            <div className="space-y-6 leading-relaxed">
                                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 border-b border-border-dark pb-4">
                                    <div className="font-bold text-slate-200 text-sm">販売業者</div>
                                    <div className="text-sm text-slate-300">Highlander / 里山の自転車店</div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 border-b border-border-dark pb-4">
                                    <div className="font-bold text-slate-200 text-sm">運営責任者</div>
                                    <div className="text-sm text-slate-300">村上 大輔</div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 border-b border-border-dark pb-4">
                                    <div className="font-bold text-slate-200 text-sm">所在地</div>
                                    <div className="text-sm text-slate-300">〒669-2222<br />兵庫県丹波篠山市味間南558-3</div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 border-b border-border-dark pb-4">
                                    <div className="font-bold text-slate-200 text-sm">電話番号</div>
                                    <div className="text-sm text-slate-300">079-598-2334</div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 border-b border-border-dark pb-4">
                                    <div className="font-bold text-slate-200 text-sm">メールアドレス</div>
                                    <div className="text-sm text-slate-300">info@bigrock-bike.jp</div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                </div>
                
                {/* Footer Action */}
                <div className="p-6 border-t border-border-dark bg-background-main flex justify-end shrink-0">
                    <button 
                        onClick={onClose} 
                        className="px-8 py-3 rounded font-bold bg-primary text-white hover:bg-primary-hover shadow-lg transition-all"
                    >
                        確認して閉じる
                    </button>
                </div>

            </div>
        </div>
    );
}
