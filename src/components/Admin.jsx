import React, { useState, useEffect } from 'react';
import { fetchOrders, updateOrder, fetchCustomers, createCustomer, updateCustomer, updateProduct } from '../services/microcms';

export default function Admin({ products, onExitAdmin, refreshProducts }) {
    const [adminTab, setAdminTab] = useState('products');
    const [ordersList, setOrdersList] = useState([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    
    // Customers State
    const [customersList, setCustomersList] = useState([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerForm, setCustomerForm] = useState({ companyName: '', contactName: '', email: '', phone: '', shippingAddress: '', status: 'Active' });
    const [isSavingCustomer, setIsSavingCustomer] = useState(false);

    // Product Editing State
    const [editingProduct, setEditingProduct] = useState(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productForm, setProductForm] = useState({ price: '', stock: '', variants: null });
    const [isSavingProduct, setIsSavingProduct] = useState(false);

    // Order Editing State
    const [editingOrder, setEditingOrder] = useState(null);
    const [editStatus, setEditStatus] = useState('');
    const [editShippingInfo, setEditShippingInfo] = useState('');
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

    const openEditModal = (order) => {
        setEditingOrder(order);
        setEditStatus(order.status || '処理中');
        setEditShippingInfo(order.shippingInfo || '');
    };

    const handleUpdateOrder = async () => {
        if (!editingOrder) return;
        setIsUpdatingOrder(true);
        try {
            await updateOrder(editingOrder.id, {
                status: editStatus,
                shippingInfo: editShippingInfo
            });
            // Re-fetch orders
            const data = await fetchOrders();
            const sortedOrders = data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrdersList(sortedOrders);
            setEditingOrder(null);
        } catch (error) {
            alert('Failed to update order: ' + error.message);
        } finally {
            setIsUpdatingOrder(false);
        }
    };

    const loadCustomers = async () => {
        setIsLoadingCustomers(true);
        const data = await fetchCustomers();
        setCustomersList(data);
        setIsLoadingCustomers(false);
    };

    useEffect(() => {
        if (adminTab === 'orders') {
            const loadOrders = async () => {
                setIsLoadingOrders(true);
                const data = await fetchOrders();
                // order by creation date descending
                const sortedOrders = data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOrdersList(sortedOrders);
                setIsLoadingOrders(false);
            };
            loadOrders();
        } else if (adminTab === 'users') {
            loadCustomers();
        }
    }, [adminTab]);

    const openCustomerModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setCustomerForm({
                companyName: customer.companyName || '',
                contactName: customer.contactName || '',
                email: customer.email || '',
                phone: customer.phone || '',
                shippingAddress: customer.shippingAddress || '',
                status: customer.status || 'Active'
            });
        } else {
            setEditingCustomer(null);
            setCustomerForm({ companyName: '', contactName: '', email: '', phone: '', shippingAddress: '', status: 'Active' });
        }
        setIsCustomerModalOpen(true);
    };

    const handleSaveCustomer = async () => {
        setIsSavingCustomer(true);
        try {
            if (editingCustomer) {
                await updateCustomer(editingCustomer.id, customerForm);
            } else {
                await createCustomer(customerForm);
            }
            await loadCustomers();
            setIsCustomerModalOpen(false);
        } catch (error) {
            alert('Failed to save customer: ' + error.message);
        } finally {
            setIsSavingCustomer(false);
        }
    };

    const openProductModal = (product) => {
        setEditingProduct(product);
        setProductForm({
            price: product.price || 0,
            stock: product.stock !== undefined ? product.stock : 100,
            variants: product.variants ? JSON.parse(JSON.stringify(product.variants)) : null
        });
        setIsProductModalOpen(true);
    };

    const handleSaveProduct = async () => {
        if (!editingProduct) return;
        setIsSavingProduct(true);
        try {
            const updates = {};
            if (productForm.variants) {
                // Return an array of objects to MicroCMS with the exact Custom Field schema
                updates.variants = productForm.variants.map(v => ({
                    fieldId: v.fieldId || "variantItemY",
                    name: String(v.name),
                    stock: Number(v.stock)
                }));
            } else {
                updates.basePrice = Number(productForm.price);
                updates.stock = Number(productForm.stock);
            }
            
            // Use the native MicroCMS ID (microcmsId), NOT the frontend display ID (which might be the SKU)
            const updateTargetId = editingProduct.microcmsId || editingProduct.id;
            
            await updateProduct(updateTargetId, updates);
            if (refreshProducts) {
                await refreshProducts(); // Update the products list locally
            }
            setIsProductModalOpen(false);
        } catch (error) {
            alert('製品の更新に失敗しました: ' + error.message);
        } finally {
            setIsSavingProduct(false);
        }
    };

    return (
        <div className="flex-1 flex overflow-hidden h-full bg-background-main text-text-main font-display">
            {/* Admin Sidebar */}
            <aside className="w-[280px] flex-none border-r border-border-dark bg-surface overflow-y-auto flex flex-col">
                <div className="p-5 border-b border-border-dark flex items-center justify-between">
                    <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Admin Panel</h3>
                    <button onClick={onExitAdmin} className="text-xs text-text-muted hover:text-text-main underline decoration-dotted">
                        ストアに戻る
                    </button>
                </div>

                <div className="flex-1 p-5 space-y-2">
                    <button
                        onClick={() => setAdminTab('products')}
                        className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${adminTab === 'products' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-text-muted hover:text-text-main hover:bg-surface-highlight'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                        <span className="text-sm font-bold">製品管理</span>
                    </button>

                    <button
                        onClick={() => setAdminTab('orders')}
                        className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${adminTab === 'orders' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-text-muted hover:text-text-main hover:bg-surface-highlight'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                        <span className="text-sm font-bold">受注管理</span>
                    </button>

                    <button
                        onClick={() => setAdminTab('users')}
                        className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${adminTab === 'users' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-text-muted hover:text-text-main hover:bg-surface-highlight'}`}
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
                <div className="flex-none p-6 border-b border-border-dark bg-background-main z-10">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-text-main tracking-tight">
                            {adminTab === 'products' && '製品在庫一覧 (Inventory)'}
                            {adminTab === 'orders' && '受注履歴 (Incoming Orders)'}
                            {adminTab === 'users' && '登録顧客 (Users)'}
                        </h1>

                        {adminTab === 'products' && (
                            <button className="flex items-center gap-2 h-10 px-4 bg-primary text-background-main hover:bg-white transition-all text-sm font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[20px]">upload_file</span>
                                <span>製品インポート</span>
                            </button>
                        )}
                        {adminTab === 'users' && (
                            <button onClick={() => openCustomerModal()} className="flex items-center gap-2 h-10 px-4 bg-primary text-background-main hover:bg-white transition-all text-sm font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[20px]">person_add</span>
                                <span>新規顧客登録</span>
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
                                        <th className="p-4 font-normal w-12"></th>
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
                                                    <tr key={`${p.id}-${v.id || i}`} className="border-b border-border-dark/50 hover:bg-black/5 transition-colors">
                                                        <td className="p-4">
                                                            {i === 0 && (
                                                                p.imageUrl ? (
                                                                    <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-contain bg-white rounded border border-border-dark shrink-0" />
                                                                ) : (
                                                                    <div className="w-10 h-10 bg-black/5 rounded border border-border-dark flex items-center justify-center shrink-0">
                                                                        <span className="material-symbols-outlined text-text-muted text-[20px]">image</span>
                                                                    </div>
                                                                )
                                                            )}
                                                        </td>
                                                        <td className="p-4 font-bold text-text-main max-w-[200px]">
                                                            {i === 0 ? <span className="truncate block" title={p.name}>{p.name}</span> : (
                                                                <span className="text-text-muted ml-4">
                                                                    ↳ {v.type === 'color' ? 'Color' : 'Size'}: {v.name}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 font-mono text-text-muted text-xs">{p.id}-{v.id || `V${i}`}</td>
                                                        <td className="p-4 text-text-muted">{i === 0 ? p.category : ''}</td>
                                                        <td className="p-4 text-right font-mono text-primary">¥{(v.price || p.price).toLocaleString()}</td>
                                                        <td className="p-4 text-right">
                                                            <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 text-xs font-bold font-mono border ${v.stock > 0 ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-accent-red border-accent-red/30 bg-accent-red/10'}`}>
                                                                {v.stock}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <button onClick={() => openProductModal(p)} className="text-text-muted hover:text-text-main transition-colors" title="製品を編集">
                                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr className="border-b border-border-dark hover:bg-black/5 transition-colors">
                                                    <td className="p-4">
                                                        {p.imageUrl ? (
                                                            <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-contain bg-white rounded border border-border-dark shrink-0" />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-black/5 rounded border border-border-dark flex items-center justify-center shrink-0">
                                                                <span className="material-symbols-outlined text-text-muted text-[20px]">image</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4 font-bold text-text-main max-w-[200px] truncate" title={p.name}>{p.name}</td>
                                                    <td className="p-4 font-mono text-text-muted text-xs">{p.id}</td>
                                                    <td className="p-4 text-text-muted">{p.category}</td>
                                                    <td className="p-4 text-right font-mono text-primary">¥{p.price.toLocaleString()}</td>
                                                    <td className="p-4 text-right">
                                                        <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 text-xs font-bold font-mono border ${p.stock > 0 ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-accent-red border-accent-red/30 bg-accent-red/10'}`}>
                                                            {p.stock !== undefined ? p.stock : 100}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button onClick={() => openProductModal(p)} className="text-text-muted hover:text-text-main transition-colors" title="製品を編集">
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
                        <div className="bg-surface border border-border-dark overflow-hidden flex flex-col min-h-[400px]">
                            {isLoadingOrders ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                    <span className="material-symbols-outlined text-[48px] text-primary animate-pulse mb-4">sync</span>
                                    <h3 className="text-lg font-bold text-text-main mb-2">データを読み込み中...</h3>
                                </div>
                            ) : ordersList.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                    <span className="material-symbols-outlined text-[48px] text-text-muted mb-4 opacity-50">receipt_long</span>
                                    <h3 className="text-lg font-bold text-text-main mb-2">受注データなし</h3>
                                    <p className="text-sm text-text-muted max-w-sm">
                                        現在、新しい受注記録はありません。ダッシュボード（購入者側）から発注が行われるとここに表示されます。
                                    </p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border-dark bg-surface-highlight text-xs uppercase tracking-wider text-text-muted font-mono">
                                            <th className="p-4 font-normal">注文ID</th>
                                            <th className="p-4 font-normal">作成日時 / 顧客</th>
                                            <th className="p-4 font-normal">商品数</th>
                                            <th className="p-4 font-normal text-right">合計金額</th>
                                            <th className="p-4 font-normal text-center">ステータス</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {ordersList.map(order => {
                                            const items = JSON.parse(order.items || "[]");
                                            const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                                            return (
                                                <tr key={order.id} className="border-b border-border-dark/50 hover:bg-black/5 transition-colors">
                                                    <td className="p-4 font-mono font-bold text-text-main">{order.orderId}</td>
                                                    <td className="p-4">
                                                        <div className="text-xs text-text-muted">{new Date(order.createdAt).toLocaleString('ja-JP')}</div>
                                                        <div className="text-sm font-bold text-text-main">{order.companyName || order.customerEmail || 'ゲスト'}</div>
                                                        {order.companyName && order.customerEmail && <div className="text-[10px] text-text-muted/70">{order.customerEmail}</div>}
                                                    </td>
                                                    <td className="p-4 text-text-muted">{totalItems}点</td>
                                                    <td className="p-4 text-right font-mono font-bold text-primary">¥{(order.totalAmount || 0).toLocaleString()}</td>
                                                    <td className="p-4 text-center">
                                                        <button 
                                                            onClick={() => openEditModal(order)}
                                                            className={`inline-flex items-center px-3 py-1.5 rounded text-[11px] font-bold tracking-wider uppercase font-mono border hover:opacity-80 transition-opacity cursor-pointer shadow-sm ${order.status === '処理中' ? 'bg-primary/5 text-primary border-primary/20' : order.status === '発送済' ? 'bg-blue-500/5 text-blue-500 border-blue-500/20' : 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20'}`}>
                                                            {order.status || '未定義'}
                                                            <span className="material-symbols-outlined text-[14px] ml-1 opacity-70">edit</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {adminTab === 'users' && (
                        <div className="bg-surface border border-border-dark overflow-hidden flex flex-col min-h-[400px]">
                            {isLoadingCustomers ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                    <span className="material-symbols-outlined text-[48px] text-primary animate-pulse mb-4">sync</span>
                                    <h3 className="text-lg font-bold text-text-main mb-2">顧客データを読み込み中...</h3>
                                </div>
                            ) : customersList.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                    <span className="material-symbols-outlined text-[48px] text-text-muted mb-4 opacity-50">group</span>
                                    <h3 className="text-lg font-bold text-text-main mb-2">顧客データなし</h3>
                                    <p className="text-sm text-text-muted max-w-sm mb-6">
                                        まだ登録されているB2B顧客がいません。新規顧客を登録してください。
                                    </p>
                                    <button onClick={() => openCustomerModal()} className="px-6 py-2.5 bg-primary text-background-main font-bold flex items-center gap-2 hover:bg-white transition-all">
                                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                                        新規顧客を登録
                                    </button>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border-dark bg-surface-highlight text-xs uppercase tracking-wider text-text-muted font-mono">
                                            <th className="p-4 font-normal">会社名 / 担当者</th>
                                            <th className="p-4 font-normal">連絡先</th>
                                            <th className="p-4 font-normal">ステータス</th>
                                            <th className="p-4 font-normal text-center">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {customersList.map(customer => (
                                            <tr key={customer.id} className="border-b border-border-dark/50 hover:bg-black/5 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-text-main">{customer.companyName}</div>
                                                    <div className="text-xs text-text-muted mt-0.5">{customer.contactName || '担当者未設定'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm text-text-main">{customer.email}</div>
                                                    {customer.phone && <div className="text-xs text-text-muted font-mono mt-0.5">{customer.phone}</div>}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-bold tracking-wider uppercase font-mono border ${customer.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-text-muted/10 text-text-muted border-border-dark'}`}>
                                                        {customer.status || 'Active'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => openCustomerModal(customer)} className="text-text-muted hover:text-text-main transition-colors p-1">
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Order Edit Modal */}
            {editingOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-surface w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden border border-border-dark animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border-dark flex justify-between items-center bg-surface-highlight">
                            <h2 className="text-xl font-bold font-display text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">local_shipping</span>
                                ステータスの変更
                            </h2>
                            <button onClick={() => setEditingOrder(null)} className="text-text-muted hover:text-text-main transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-6">
                            <div className="bg-background-main p-4 rounded-lg border border-border-dark font-mono text-sm shadow-inner flex justify-between items-center">
                                <span className="text-text-muted text-xs">注文ID</span>
                                <span className="font-bold text-text-main">{editingOrder.orderId}</span>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-main">ステータス <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select 
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value)}
                                        className="w-full bg-background-main border border-border-dark px-4 py-3 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer font-bold"
                                    >
                                        <option value="処理中">処理中 (Processing)</option>
                                        <option value="発送準備中">発送準備中 (Preparing to Ship)</option>
                                        <option value="発送済">発送済 (Shipped)</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">expand_more</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-main flex items-center gap-2">
                                    配送情報 (追跡番号など)
                                </label>
                                <input 
                                    type="text"
                                    value={editShippingInfo}
                                    onChange={(e) => setEditShippingInfo(e.target.value)}
                                    placeholder="例: ヤマト運輸 1234-5678-9012"
                                    className="w-full bg-background-main border border-border-dark px-4 py-3 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted/50"
                                />
                                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                    入力された情報は購入者の注文履歴画面に表示されます。配送後の追跡に利用されます。
                                </p>
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-border-dark bg-background-main flex justify-end gap-3">
                            <button 
                                onClick={() => setEditingOrder(null)} 
                                className="px-6 py-2.5 rounded font-bold text-text-main hover:bg-surface-highlight transition-colors border border-border-dark"
                                disabled={isUpdatingOrder}
                            >
                                キャンセル
                            </button>
                            <button 
                                onClick={handleUpdateOrder}
                                className="px-6 py-2.5 rounded font-bold bg-primary text-white hover:bg-primary-hover shadow-lg transition-all flex items-center justify-center min-w-[120px]"
                                disabled={isUpdatingOrder}
                            >
                                {isUpdatingOrder ? (
                                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                                ) : (
                                    "更新する"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Edit Modal */}
            {isCustomerModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-surface w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden border border-border-dark animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border-dark flex justify-between items-center bg-surface-highlight">
                            <h2 className="text-xl font-bold font-display text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">{editingCustomer ? 'edit' : 'person_add'}</span>
                                {editingCustomer ? '顧客情報の編集' : '新規顧客登録'}
                            </h2>
                            <button onClick={() => setIsCustomerModalOpen(false)} className="text-text-muted hover:text-text-main transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                            
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-main">会社名 / 店舗名 <span className="text-red-500">*</span></label>
                                <input 
                                    type="text"
                                    value={customerForm.companyName}
                                    onChange={(e) => setCustomerForm({...customerForm, companyName: e.target.value})}
                                    placeholder="例: 株式会社ビッグロック"
                                    className="w-full bg-background-main border border-border-dark px-4 py-3 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-text-main">担当者名</label>
                                    <input 
                                        type="text"
                                        value={customerForm.contactName}
                                        onChange={(e) => setCustomerForm({...customerForm, contactName: e.target.value})}
                                        className="w-full bg-background-main border border-border-dark px-4 py-3 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-text-main">電話番号</label>
                                    <input 
                                        type="text"
                                        value={customerForm.phone}
                                        onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                                        className="w-full bg-background-main border border-border-dark px-4 py-3 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-main">ログインメールアドレス <span className="text-red-500">*</span></label>
                                <input 
                                    type="email"
                                    value={customerForm.email}
                                    onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                                    placeholder="ログインIDと一致する必要があります"
                                    className="w-full bg-background-main border border-border-dark px-4 py-3 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                                />
                                <p className="text-xs text-text-muted">このメールアドレスでGoogleログインした際にアクセス可能になります。</p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-main">初期配送先住所</label>
                                <textarea 
                                    value={customerForm.shippingAddress}
                                    onChange={(e) => setCustomerForm({...customerForm, shippingAddress: e.target.value})}
                                    className="w-full bg-background-main border border-border-dark px-4 py-3 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y min-h-[80px]"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-main">アカウント状態</label>
                                <div className="relative">
                                    <select 
                                        value={customerForm.status}
                                        onChange={(e) => setCustomerForm({...customerForm, status: e.target.value})}
                                        className="w-full bg-background-main border border-border-dark px-4 py-3 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer font-bold"
                                    >
                                        <option value="Active">有効 (Active)</option>
                                        <option value="Inactive">無効 (Inactive - アクセス停止)</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">expand_more</span>
                                </div>
                            </div>

                        </div>
                        
                        <div className="p-6 border-t border-border-dark bg-background-main flex justify-end gap-3 z-10 shrink-0">
                            <button 
                                onClick={() => setIsCustomerModalOpen(false)} 
                                className="px-6 py-2.5 rounded font-bold text-text-main hover:bg-surface-highlight transition-colors border border-border-dark"
                                disabled={isSavingCustomer}
                            >
                                キャンセル
                            </button>
                            <button 
                                onClick={handleSaveCustomer}
                                className="px-6 py-2.5 rounded font-bold bg-primary text-white hover:bg-primary-hover shadow-lg transition-all flex items-center justify-center min-w-[120px]"
                                disabled={isSavingCustomer || !customerForm.companyName || !customerForm.email}
                            >
                                {isSavingCustomer ? (
                                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                                ) : (
                                    "保存する"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        {/* Edit Product Modal */}
        {isProductModalOpen && editingProduct && (
            <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsProductModalOpen(false)}>
                <div className="bg-surface rounded-xl shadow-2xl max-w-lg w-full font-display border border-border-dark flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between p-6 border-b border-border-dark bg-background-main z-10 shrink-0 rounded-t-xl">
                        <h3 className="text-xl font-bold font-display text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">inventory_2</span>
                            製品情報の編集
                        </h3>
                        <button onClick={() => setIsProductModalOpen(false)} className="text-text-muted hover:text-text-main transition-colors p-1" disabled={isSavingProduct}>
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto space-y-6">
                        <div className="flex gap-4 items-center bg-black/5 p-4 rounded-lg border border-border-dark">
                            {editingProduct.imageUrl ? (
                                <img src={editingProduct.imageUrl} alt={editingProduct.name} className="w-16 h-16 object-contain bg-white rounded border border-border-dark shrink-0" />
                            ) : (
                                <div className="w-16 h-16 bg-background-main rounded border border-border-dark flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-text-muted">image</span>
                                </div>
                            )}
                            <div>
                                <div className="font-bold text-text-main mb-1 leading-tight">{editingProduct.name}</div>
                                <div className="text-xs font-mono text-text-muted bg-background-main px-2 py-0.5 rounded-sm inline-block border border-border-dark">{editingProduct.id}</div>
                            </div>
                        </div>

                        {productForm.variants ? (
                            <div className="space-y-3">
                                <p className="text-sm font-bold text-text-main border-l-2 border-primary pl-2 uppercase tracking-wide">バリエーション設定</p>
                                <div className="grid gap-3">
                                    {productForm.variants.map((v, i) => (
                                        <div key={i} className="flex gap-4 p-4 border border-border-dark rounded-lg bg-background-main items-center relative">
                                            <div className="w-24 shrink-0 font-bold text-sm text-text-main break-words">
                                                {v.name}
                                            </div>
                                            <div className="flex gap-4 flex-1">
                                                <div className="flex-1 max-w-[100px]">
                                                    <label className="block text-[10px] text-text-muted mb-1 font-mono uppercase tracking-wider">在庫数</label>
                                                    <input 
                                                        type="number" 
                                                        value={v.stock}
                                                        onChange={(e) => {
                                                            const newV = [...productForm.variants];
                                                            newV[i] = { ...newV[i], stock: e.target.value !== '' ? Number(e.target.value) : '' };
                                                            setProductForm({ ...productForm, variants: newV });
                                                        }}
                                                        className="w-full p-2.5 text-sm bg-surface border border-border-dark rounded focus:border-primary focus:ring-1 focus:ring-primary text-text-main font-mono transition-all"
                                                        min="0"
                                                    />
                                                </div>
                                                <div className="flex-1 text-xs text-text-muted flex items-end pb-2 opacity-60">
                                                    ※ バリエーションの価格設定は商品ページで共通になります。
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-4 bg-background-main p-5 rounded-lg border border-border-dark">
                                <div className="flex-1">
                                    <label className="block text-[10px] text-text-muted mb-1.5 font-bold uppercase tracking-wider">単価 (卸価格)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-mono font-bold">¥</span>
                                        <input 
                                            type="number" 
                                            value={productForm.price}
                                            onChange={(e) => setProductForm({...productForm, price: e.target.value !== '' ? Number(e.target.value) : ''})}
                                            className="w-full p-3 pl-8 bg-surface border border-border-dark rounded focus:border-primary focus:ring-1 focus:ring-primary text-text-main font-mono transition-colors"
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 max-w-[120px]">
                                    <label className="block text-[10px] text-text-muted mb-1.5 font-bold uppercase tracking-wider">在庫数</label>
                                    <input 
                                        type="number" 
                                        value={productForm.stock}
                                        onChange={(e) => setProductForm({...productForm, stock: e.target.value !== '' ? Number(e.target.value) : ''})}
                                        className="w-full p-3 bg-surface border border-border-dark rounded focus:border-primary focus:ring-1 focus:ring-primary text-text-main font-mono transition-colors"
                                        min="0"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-6 border-t border-border-dark bg-background-main flex justify-end gap-3 z-10 shrink-0 rounded-b-xl">
                        <button 
                            onClick={() => setIsProductModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-bold text-text-main border border-border-dark hover:bg-surface-highlight transition-colors rounded"
                            disabled={isSavingProduct}
                        >
                            キャンセル
                        </button>
                        <button 
                            onClick={handleSaveProduct}
                            disabled={isSavingProduct}
                            className="px-6 py-2.5 text-sm font-bold bg-primary text-background-main hover:bg-white transition-all rounded flex items-center justify-center min-w-[120px]"
                        >
                            {isSavingProduct ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : "保存する"}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}
