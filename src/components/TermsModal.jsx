import React from 'react';

export default function TermsModal({ isOpen, onClose, initialView = 'terms' }) {
    if (!isOpen) return null;

    // We can swap views if needed, or simply render both. Here we map both for simplicity.
    const [view, setView] = React.useState(initialView); // 'terms' | 'privacy'

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-surface w-full max-w-3xl h-full max-h-[85vh] rounded shadow-2xl flex flex-col overflow-hidden border border-border-dark animate-in zoom-in-95 duration-200 relative">
                
                {/* Header Navigation */}
                <div className="flex border-b border-border-dark bg-surface-highlight shrink-0">
                    <button 
                        className={`flex-1 py-4 text-sm font-bold tracking-widest transition-colors ${view === 'terms' ? 'text-primary border-b-2 border-primary bg-background-main' : 'text-text-muted hover:text-text-main hover:bg-background-main/50'}`}
                        onClick={() => setView('terms')}
                    >
                        B2B利用規約
                    </button>
                    <button 
                        className={`flex-1 py-4 text-sm font-bold tracking-widest transition-colors ${view === 'privacy' ? 'text-primary border-b-2 border-primary bg-background-main' : 'text-text-muted hover:text-text-main hover:bg-background-main/50'}`}
                        onClick={() => setView('privacy')}
                    >
                        プライバシーポリシー
                    </button>
                    <button onClick={onClose} className="px-6 border-l border-border-dark text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-background-main">
                    
                    {view === 'terms' && (
                        <div className="prose prose-sm prose-invert max-w-none text-text-main">
                            <h2 className="text-xl font-bold mb-6 text-primary tracking-tight">B2B取引 利用規約</h2>
                            <p className="text-xs text-text-muted mb-8">最終改定日: 2024年4月1日</p>
                            
                            <div className="space-y-8 leading-relaxed">
                                <section>
                                    <h3 className="text-sm font-bold mb-3 border-b border-border-dark pb-2 text-slate-200">第1条（適用）</h3>
                                    <p className="text-sm text-slate-300">
                                        本規約は、BIGROCK（以下「当社」といいます。）が提供するB2B発注システム（以下「本サービス」といいます。）を利用する販売店（以下「ディーラー」といいます。）と当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。<br />
                                        ディーラーは、本サービスの利用にあたり、本規約に同意し、これを遵守するものとします。
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold mb-3 border-b border-border-dark pb-2 text-slate-200">第2条（登録および審査）</h3>
                                    <p className="text-sm text-slate-300">
                                        1. 登録希望者は、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。<br />
                                        2. 当社は、登録希望者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。
                                    </p>
                                    <ul className="list-disc pl-5 mt-2 text-sm text-slate-400 space-y-1">
                                        <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                                        <li>本規約に違反したことがある者からの申請である場合</li>
                                        <li>その他、当社が利用登録を相当でないと判断した場合</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold mb-3 border-b border-border-dark pb-2 text-slate-200">第3条（Googleアカウントの連携と管理）</h3>
                                    <p className="text-sm text-slate-300">
                                        ディーラーは、本サービスのログインに利用するGoogleアカウントを自己の責任において適切に管理するものとします。アカウントの第三者への貸与、譲渡、売買等は禁止します。
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold mb-3 border-b border-border-dark pb-2 text-slate-200">第4条（禁止事項）</h3>
                                    <p className="text-sm text-slate-300">
                                        ディーラーは、本サービスの利用にあたり、以下の行為をしてはなりません。
                                    </p>
                                    <ul className="list-disc pl-5 mt-2 text-sm text-slate-400 space-y-1">
                                        <li>法令または公序良俗に違反する行為</li>
                                        <li>犯罪行為に関連する行為</li>
                                        <li>当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                                        <li>本サービスの運営を妨害するおそれのある行為</li>
                                        <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                                        <li>不正アクセスをし、またはこれを試みる行為</li>
                                        <li>他のユーザーに成りすます行為</li>
                                    </ul>
                                </section>
                                
                                <section>
                                    <h3 className="text-sm font-bold mb-3 border-b border-border-dark pb-2 text-slate-200">第5条（本サービスの提供の停止等）</h3>
                                    <p className="text-sm text-slate-300">
                                        当社は、以下のいずれかの事由があると判断した場合、ディーラーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
                                        当社は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。
                                    </p>
                                </section>
                                
                                <p className="text-xs text-text-muted mt-8 p-4 bg-surface rounded border border-border-dark">
                                    ※このテキストはダミーのひな形です。実際の運用に合わせて内容を書き換えてください。
                                </p>
                            </div>
                        </div>
                    )}

                    {view === 'privacy' && (
                        <div className="prose prose-sm prose-invert max-w-none text-text-main">
                            <h2 className="text-xl font-bold mb-6 text-primary tracking-tight">プライバシーポリシー</h2>
                            <p className="text-xs text-text-muted mb-8">最終改定日: 2024年4月1日</p>
                            
                            <div className="space-y-8 leading-relaxed">
                                <section>
                                    <h3 className="text-sm font-bold mb-3 border-b border-border-dark pb-2 text-slate-200">第1条（個人情報）</h3>
                                    <p className="text-sm text-slate-300">
                                        「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報、および容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold mb-3 border-b border-border-dark pb-2 text-slate-200">第2条（個人情報の収集方法）</h3>
                                    <p className="text-sm text-slate-300">
                                        当社は、ユーザーが利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレスなどの個人情報をお尋ねすることがあります。
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold mb-3 border-b border-border-dark pb-2 text-slate-200">第3条（個人情報を収集・利用する目的）</h3>
                                    <p className="text-sm text-slate-300">
                                        当社が個人情報を収集・利用する目的は、以下のとおりです。
                                    </p>
                                    <ul className="list-disc pl-5 mt-2 text-sm text-slate-400 space-y-1">
                                        <li>当社サービスの提供・運営のため</li>
                                        <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
                                        <li>ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等及び当社が提供する他のサービスの案内のメールを送付するため</li>
                                        <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
                                        <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
                                    </ul>
                                </section>

                                <p className="text-xs text-text-muted mt-8 p-4 bg-surface rounded border border-border-dark">
                                    ※このテキストはダミーのひな形です。実際の運用に合わせて内容を書き換えてください。
                                </p>
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
