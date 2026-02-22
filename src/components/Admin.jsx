import React, { useState } from 'react';

export default function Admin({ products, onExitAdmin }) {
    const [adminTab, setAdminTab] = useState('products');

    return (
        <div className="flex-1 flex overflow-hidden h-full bg-background-dark text-text-main font-display">
            {/* Admin Sidebar */}
            <aside className="w-[280px] flex-none border-r border-border-dark bg-surface overflow-y-auto flex flex-col">
                <div className="p-5 border-b border-border-dark flex items-center justify-between">
                    <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Admin Panel</h3>
                    <button onClick={onExitAdmin} className="text-xs text-text-muted hover:text-white underline decoration-dotted">
                        ストアに戻る
                    </button>
                </div>

                <div className="flex-1 p-5 space-y-2">
                    <button
                        onClick={() => setAdminTab('products')}
                        className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${adminTab === 'products' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-text-muted hover:text-white hover:bg-surface-highlight'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                        <span className="text-sm font-bold">製品管理</span>
                    </button>

                    <button
                        onClick={() => setAdminTab('orders')}
                        className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${adminTab === 'orders' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-text-muted hover:text-white hover:bg-surface-highlight'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                        <span className="text-sm font-bold">受注管理</span>
                    </button>

                    <button
                        onClick={() => setAdminTab('users')}
                        className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${adminTab === 'users' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-text-muted hover:text-white hover:bg-surface-highlight'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">group</span>
                        <span className="text-sm font-bold">顧客管理</span>
                    </button>
                </div>

                <div className="p-4 border-t border-border-dark text-xs text-text-muted text-center font-mono">
                    ADMIN MODE ACTIVE
                </div>
            </aside>

            {/* Admin Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-[#151517]">
                {/* Background Texture */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'6\\' height=\\'6\\' viewBox=\\'0 0 6 6\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'1\\' fill-rule=\\'evenodd\\'%3E%3Cpath d=\\'M5 0h1L0 6V5zM6 5v1H5z\\'/%3E%3C/g%3E%3C/svg%3E')" }}></div>

                {/* Toolbar */}
                <div className="flex-none p-6 border-b border-border-dark bg-background-dark z-10">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            {adminTab === 'products' && '製品在庫一覧 (Inventory)'}
                            {adminTab === 'orders' && '受注履歴 (Incoming Orders)'}
                            {adminTab === 'users' && '登録顧客 (Users)'}
                        </h1>

                        {adminTab === 'products' && (
                            <button className="flex items-center gap-2 h-10 px-4 bg-primary text-background-dark hover:bg-white transition-all text-sm font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[20px]">upload_file</span>
                                <span>製品インポート</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Dynamic Area */}
                <div className="flex-1 overflow-auto p-6 relative z-10">
                    {adminTab === 'products' && (
                        <div className="bg-surface border border-border-dark overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border-dark bg-surface-highlight text-xs uppercase tracking-wider text-text-muted font-mono">
                                        <th className="p-4 font-normal">製品名</th>
                                        <th className="p-4 font-normal">SKU/ID</th>
                                        <th className="p-4 font-normal">カテゴリー</th>
                                        <th className="p-4 font-normal text-right">単価 (卸)</th>
                                        <th className="p-4 font-normal text-right">在庫数</th>
                                        <th className="p-4 font-normal text-center">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {products.map(p => (
                                        <React.Fragment key={p.id}>
                                            {p.variants ? (
                                                p.variants.map((v, i) => (
                                                    <tr key={`${p.id}-${v.id}`} className="border-b border-border-dark/50 hover:bg-white/5 transition-colors">
                                                        <td className="p-4 font-bold text-white">
                                                            {i === 0 ? p.name : <span className="text-text-muted ml-4">↳ {v.name}</span>}
                                                        </td>
                                                        <td className="p-4 font-mono text-text-muted text-xs">{p.id}-{v.id}</td>
                                                        <td className="p-4 text-text-muted">{i === 0 ? p.category : ''}</td>
                                                        <td className="p-4 text-right font-mono text-primary">¥{(v.price || p.price).toLocaleString()}</td>
                                                        <td className="p-4 text-right">
                                                            <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 text-xs font-bold font-mono border ${v.stock > 0 ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-accent-red border-accent-red/30 bg-accent-red/10'}`}>
                                                                {v.stock}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <button className="text-text-muted hover:text-white transition-colors">
                                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr className="border-b border-border-dark hover:bg-white/5 transition-colors">
                                                    <td className="p-4 font-bold text-white">{p.name}</td>
                                                    <td className="p-4 font-mono text-text-muted text-xs">{p.id}</td>
                                                    <td className="p-4 text-text-muted">{p.category}</td>
                                                    <td className="p-4 text-right font-mono text-primary">¥{p.price.toLocaleString()}</td>
                                                    <td className="p-4 text-right">
                                                        <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 text-xs font-bold font-mono border ${p.stock > 0 ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-accent-red border-accent-red/30 bg-accent-red/10'}`}>
                                                            {p.stock !== undefined ? p.stock : 100}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button className="text-text-muted hover:text-white transition-colors">
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {adminTab === 'orders' && (
                        <div className="bg-surface border border-border-dark overflow-hidden flex flex-col items-center justify-center p-12 text-center">
                            <span className="material-symbols-outlined text-[48px] text-text-muted mb-4 opacity-50">receipt_long</span>
                            <h3 className="text-lg font-bold text-white mb-2">受注データなし</h3>
                            <p className="text-sm text-text-muted max-w-sm">
                                現在、新しい受注記録はありません。ダッシュボード（購入者側）から発注が行われるとここに表示されます。
                            </p>
                        </div>
                    )}

                    {adminTab === 'users' && (
                        <div className="bg-surface border border-border-dark overflow-hidden flex flex-col items-center justify-center p-12 text-center">
                            <span className="material-symbols-outlined text-[48px] text-text-muted mb-4 opacity-50">group</span>
                            <h3 className="text-lg font-bold text-white mb-2">顧客データ連携準備中</h3>
                            <p className="text-sm text-text-muted max-w-sm">
                                B2B顧客アカウントの管理機能は次のフェーズで実装予定です。
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
