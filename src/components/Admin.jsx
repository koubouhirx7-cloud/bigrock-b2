import React, { useState, useEffect, useMemo } from 'react';
import { fetchOrders, updateOrder, deleteOrder, fetchCustomers, createCustomer, updateCustomer, deleteCustomer, updateProduct } from '../services/microcms';
import { auth } from '../services/firebase';

export default function Admin({ products, onExitAdmin, refreshProducts }) {
    const [adminTab, setAdminTab] = useState('products');
    const [ordersList, setOrdersList] = useState([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    
    // Freee Invoices State
    const [isGeneratingInvoices, setIsGeneratingInvoices] = useState(false);
    const [invoiceResults, setInvoiceResults] = useState(null);

    // Admin Orders Filtering State
    const [ordersFilterTime, setOrdersFilterTime] = useState('all');
    const [ordersFilterCustomer, setOrdersFilterCustomer] = useState('all');
    
    // Newsletter Modal state
    const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false);
    const [newsletterRecipients, setNewsletterRecipients] = useState([]);

    const uniqueCustomers = useMemo(() => {
        const names = ordersList.map(o => o.companyName || o.customerEmail || 'ゲスト');
        return [...new Set(names)].sort();
    }, [ordersList]);

    const filteredOrdersList = useMemo(() => {
        let list = ordersList;
        
        // 1. Filter by Customer
        if (ordersFilterCustomer !== 'all') {
            list = list.filter(o => {
                const identifier = o.companyName || o.customerEmail || 'ゲスト';
                return identifier === ordersFilterCustomer;
            });
        }

        // 2. Filter by Time
        if (ordersFilterTime !== 'all') {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            
            list = list.filter(order => {
                const orderDate = new Date(order.createdAt);
                if (ordersFilterTime === 'thisYear') {
                    return orderDate.getFullYear() === currentYear;
                }
                if (ordersFilterTime === 'lastYear') {
                    return orderDate.getFullYear() === currentYear - 1;
                }
                if (ordersFilterTime === 'thisMonth') {
                    return orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth;
                }
                if (ordersFilterTime === 'lastMonth') {
                    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
                    return orderDate.getFullYear() === lastMonthDate.getFullYear() && orderDate.getMonth() === lastMonthDate.getMonth();
                }
                if (ordersFilterTime === 'thisWeek') {
                    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return orderDate >= sevenDaysAgo;
                }
                return true;
            });
        }

        return list;
    }, [ordersList, ordersFilterTime, ordersFilterCustomer]);
    
    // Customers State
    const [customersList, setCustomersList] = useState([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerForm, setCustomerForm] = useState({ companyName: '', companyNameKana: '', repName: '', repNameKana: '', department: '', contactName: '', contactNameKana: '', email: '', phone: '', mobilePhone: '', fax: '', established: '', annualSales: '', industry: '', websiteUrl: '', shippingAddress: '', status: 'Active', newsletter: false });
    const [isSavingCustomer, setIsSavingCustomer] = useState(false);
    const [viewingCustomer, setViewingCustomer] = useState(null);

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

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm("本当にこの注文を削除しますか？\nこの操作は元に戻せません。")) return;
        
        setIsLoadingOrders(true);
        try {
            await deleteOrder(orderId);
            setOrdersList(prev => prev.filter(o => o.id !== orderId));
        } catch (error) {
            alert('注文の削除に失敗しました: ' + error.message);
        } finally {
            setIsLoadingOrders(false);
        }
    };

    const loadCustomers = async () => {
        setIsLoadingCustomers(true);
        const data = await fetchCustomers();
        setCustomersList(data);
        setIsLoadingCustomers(false);
    };

    useEffect(() => {
        // Ensure customers are loaded to display full details in orders view
        if (!isLoadingCustomers && customersList.length === 0) {
            loadCustomers();
        }
        
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

    const handleSendNewsletter = () => {
        const recipients = customersList
            .filter(c => (Array.isArray(c.status) ? c.status.includes('Active') : c.status === 'Active') && c.newsletter === true)
            .map(c => c.email)
            .filter(email => !!email);

        if (recipients.length === 0) {
            alert('メルマガ配信を希望している有効な顧客(Active)が見つかりません。');
            return;
        }

        setNewsletterRecipients(recipients);
        setIsNewsletterModalOpen(true);
    };

    const handleDeleteCustomer = async (id, companyName) => {
        if (!window.confirm(`顧客「${companyName}」を削除してもよろしいですか？\nこの操作は取り消せません。`)) {
            return;
        }
        setIsLoadingCustomers(true);
        try {
            await deleteCustomer(id);
            setCustomersList(customersList.filter(c => c.id !== id));
            alert('顧客を削除しました。');
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert(`顧客の削除に失敗しました。\n詳細: ${error.message}`);
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    const openCustomerModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setCustomerForm({
                companyName: customer.companyName || '',
                companyNameKana: customer.companyNameKana || '',
                repName: customer.repName || '',
                repNameKana: customer.repNameKana || '',
                department: customer.department || '',
                contactName: customer.contactName || '',
                contactNameKana: customer.contactNameKana || '',
                email: customer.email || '',
                phone: customer.phone || '',
                mobilePhone: customer.mobilePhone || '',
                fax: customer.fax || '',
                established: customer.established || '',
                annualSales: customer.annualSales || '',
                industry: customer.industry || '',
                websiteUrl: customer.websiteUrl || '',
                shippingAddress: customer.shippingAddress || '',
                status: Array.isArray(customer.status) ? customer.status : [customer.status || 'Active'],
                newsletter: customer.newsletter || false
            });
        } else {
            setEditingCustomer(null);
            setCustomerForm({ 
                companyName: '', companyNameKana: '', repName: '', repNameKana: '', 
                department: '', contactName: '', contactNameKana: '', email: '', 
                phone: '', mobilePhone: '', fax: '', established: '', annualSales: '', 
                industry: '', websiteUrl: '', shippingAddress: '', status: ['Active'], newsletter: false 
            });
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
                    manufacturer: v.manufacturer || '',
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

                    <button
                        onClick={() => setAdminTab('invoices')}
                        className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${adminTab === 'invoices' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-text-muted hover:text-text-main hover:bg-surface-highlight'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">request_quote</span>
                        <span className="text-sm font-bold">月次請求発行</span>
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
                        {adminTab !== 'orders' && (
                            <h1 className="text-2xl font-bold text-text-main tracking-tight">
                                {adminTab === 'products' && '製品在庫一覧 (Inventory)'}
                                {adminTab === 'users' && '登録顧客 (Users)'}
                                {adminTab === 'invoices' && '月次請求発行 (Freee Integration)'}
                            </h1>
                        )}
                        
                        {adminTab === 'orders' && (
                            <div className="flex items-center gap-4 flex-1">
                                <h1 className="text-2xl font-bold text-text-main tracking-tight mr-auto">
                                    受注履歴 (Incoming Orders)
                                </h1>
                                
                                {/* Customer Filter */}
                                <div className="relative">
                                    <select 
                                        value={ordersFilterCustomer}
                                        onChange={(e) => setOrdersFilterCustomer(e.target.value)}
                                        className="appearance-none bg-surface border border-border-dark text-text-main py-2 pl-3 pr-8 rounded focus:outline-none focus:border-primary font-mono text-xs cursor-pointer h-10 w-48"
                                    >
                                        <option value="all">すべての顧客</option>
                                        {uniqueCustomers.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-[16px]">expand_more</span>
                                </div>
                                
                                {/* Time Filter */}
                                <div className="relative">
                                    <select 
                                        value={ordersFilterTime}
                                        onChange={(e) => setOrdersFilterTime(e.target.value)}
                                        className="appearance-none bg-surface border border-border-dark text-text-main py-2 pl-3 pr-8 rounded focus:outline-none focus:border-primary font-mono text-xs cursor-pointer h-10 w-40"
                                    >
                                        <option value="all">すべての期間</option>
                                        <option value="thisWeek">過去7日間</option>
                                        <option value="thisMonth">今月</option>
                                        <option value="lastMonth">先月</option>
                                        <option value="thisYear">今年</option>
                                        <option value="lastYear">昨年</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-[16px]">expand_more</span>
                                </div>
                            </div>
                        )}

                        {adminTab === 'products' && (
                            <button className="flex items-center gap-2 h-10 px-4 bg-primary text-background-main hover:bg-white transition-all text-sm font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[20px]">upload_file</span>
                                <span>製品インポート</span>
                            </button>
                        )}
                        {adminTab === 'users' && (
                            <div className="flex items-center gap-3">
                                <button onClick={handleSendNewsletter} className="flex items-center gap-2 h-10 px-4 bg-background-main border border-border-dark text-text-main hover:bg-surface-highlight transition-all text-sm font-bold uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                    <span>メルマガ一斉作成</span>
                                </button>
                                <button onClick={() => openCustomerModal()} className="flex items-center gap-2 h-10 px-4 bg-primary text-background-main hover:bg-white transition-all text-sm font-bold uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                                    <span>新規顧客登録</span>
                                </button>
                            </div>
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
                            ) : filteredOrdersList.length === 0 ? (
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
                                        {filteredOrdersList.map(order => {
                                            const items = JSON.parse(order.items || "[]");
                                            const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                                            return (
                                                <tr key={order.id} className="border-b border-border-dark/50 hover:bg-black/5 transition-colors cursor-pointer" onClick={(e) => { if (!e.target.closest('button')) openEditModal(order); }}>
                                                    <td className="p-4 font-mono font-bold text-text-main">{order.orderId}</td>
                                                    <td className="p-4">
                                                        <div className="text-xs text-text-muted">{new Date(order.createdAt).toLocaleString('ja-JP')}</div>
                                                        <div className="text-sm font-bold text-text-main">{order.companyName || order.customerEmail || 'ゲスト'}</div>
                                                        {order.companyName && order.customerEmail && <div className="text-[10px] text-text-muted/70">{order.customerEmail}</div>}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex -space-x-2 overflow-hidden mb-1">
                                                            {items.slice(0, 5).map((item, idx) => (
                                                                item.imageUrl ? (
                                                                    <img key={idx} src={item.imageUrl} alt={item.productName || item.name} className="inline-block h-6 w-6 rounded-full border border-border-dark object-cover bg-white" title={`${item.productName || item.name} x${item.quantity}`} />
                                                                ) : (
                                                                    <div key={idx} className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-border-dark bg-surface-highlight text-[8px] text-text-muted" title={`${item.productName || item.name} x${item.quantity}`}>画像なし</div>
                                                                )
                                                            ))}
                                                            {items.length > 5 && <div className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-border-dark bg-black/10 text-[9px] font-bold text-text-main z-10">+{items.length - 5}</div>}
                                                        </div>
                                                        <div className="text-xs text-text-muted">{totalItems}点</div>
                                                    </td>
                                                    <td className="p-4 text-right font-mono font-bold text-primary">¥{(order.totalAmount || 0).toLocaleString()}</td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button 
                                                                onClick={() => openEditModal(order)}
                                                                className={`inline-flex items-center px-3 py-1.5 rounded text-[11px] font-bold tracking-wider uppercase font-mono border hover:opacity-80 transition-opacity cursor-pointer shadow-sm ${order.status === '処理中' ? 'bg-primary/5 text-primary border-primary/20' : order.status === '発送済' ? 'bg-blue-500/5 text-blue-500 border-blue-500/20' : 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20'}`}>
                                                                {order.status || '未定義'}
                                                                <span className="material-symbols-outlined text-[14px] ml-1 opacity-70">edit</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteOrder(order.id)}
                                                                className="inline-flex items-center p-1.5 rounded text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                                                                title="注文を削除"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                                            </button>
                                                        </div>
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
                                            <tr key={customer.id} className="border-b border-border-dark/50 hover:bg-black/5 transition-colors cursor-pointer" onClick={(e) => { if (!e.target.closest('button')) setViewingCustomer(customer); }}>
                                                <td className="p-4">
                                                    <div className="font-bold text-text-main">{customer.companyName}</div>
                                                    <div className="text-xs text-text-muted mt-0.5">{customer.contactName || '担当者未設定'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm text-text-main">{customer.email}</div>
                                                    {customer.phone && <div className="text-xs text-text-muted font-mono mt-0.5">{customer.phone}</div>}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-bold tracking-wider uppercase font-mono border ${(Array.isArray(customer.status) ? customer.status.includes('Active') : customer.status === 'Active') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-text-muted/10 text-text-muted border-border-dark'}`}>
                                                        {(Array.isArray(customer.status) ? customer.status[0] : customer.status) || 'Active'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => openCustomerModal(customer)} className="text-text-muted hover:text-text-main transition-colors p-1" title="編集">
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button onClick={() => handleDeleteCustomer(customer.id, customer.companyName)} className="text-text-muted hover:text-red-500 transition-colors p-1 ml-2" title="削除">
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {adminTab === 'invoices' && (
                        <div className="bg-surface border border-border-dark overflow-hidden flex flex-col min-h-[400px] p-8">
                            <div className="max-w-2xl mx-auto w-full">
                                <div className="text-center mb-8">
                                    <span className="material-symbols-outlined text-[48px] text-primary mb-4">request_quote</span>
                                    <h2 className="text-xl font-bold mb-2">会計freee連携・月次請求書の一括発行</h2>
                                    <p className="text-sm text-text-muted">
                                        毎月20日締めで、当月（前月21日〜当月20日）の受注データを集計し、
                                        翌月10日払い（土日祝の場合は翌営業日）の請求書をfreee上に作成します。
                                    </p>
                                </div>
                                
                                {invoiceResults ? (
                                    <div className="bg-surface-highlight border border-border-dark p-6 rounded mb-8">
                                        <h3 className="font-bold text-emerald-500 mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined">check_circle</span>
                                            処理が完了しました
                                        </h3>
                                        <p className="text-sm mb-4 text-text-muted">
                                            対象期間: {new Date(invoiceResults.billingPeriod?.start).toLocaleDateString('ja-JP')} 〜 {new Date(invoiceResults.billingPeriod?.end).toLocaleDateString('ja-JP')}
                                        </p>
                                        <div className="max-h-64 overflow-y-auto mt-4 space-y-2">
                                            {invoiceResults.results?.map((res, i) => (
                                                <div key={i} className="flex justify-between text-sm p-3 bg-background-main border border-border-dark rounded">
                                                    <span className="font-bold text-text-main">{res.company || res.email}</span>
                                                    {res.status === 'Success' ? (
                                                        <span className="text-emerald-500 font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">done</span> 発行済</span>
                                                    ) : (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-accent-red font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> エラー</span>
                                                            <span className="text-[10px] text-text-muted mt-1 max-w-[200px] truncate" title={res.error}>{res.error}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {(!invoiceResults.results || invoiceResults.results.length === 0) && (
                                                <div className="text-text-muted text-sm text-center py-4">今月の請求対象となる受注データはありませんでした。</div>
                                            )}
                                        </div>
                                        <div className="mt-6 flex justify-center">
                                            <button onClick={() => setInvoiceResults(null)} className="text-sm text-text-muted hover:text-text-main underline">
                                                戻る
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-4 justify-center mt-8 pt-6 border-t border-border-dark/50">
                                        <button 
                                            onClick={() => { window.location.href = '/api/freee-auth'; }}
                                            className="px-6 py-3 bg-surface-highlight border border-border-dark hover:bg-black/5 flex items-center gap-2 rounded transition-colors text-sm font-bold text-text-main shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">sync_saved_locally</span>
                                            Freeeと連携する
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                if(!window.confirm('今月の月次請求書をfreee上に発行します。実行してよろしいですか？')) return;
                                                setIsGeneratingInvoices(true);
                                                try {
                                                    const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
                                                    const res = await fetch('/api/create-invoices', { 
                                                        method: 'POST',
                                                        headers: {
                                                            'Authorization': `Bearer ${token}`
                                                        }
                                                    });
                                                    const data = await res.json();
                                                    if(res.ok) setInvoiceResults(data);
                                                    else alert("エラー: " + data.message);
                                                } catch(err) {
                                                    alert("通信エラー: " + err.message);
                                                } finally {
                                                    setIsGeneratingInvoices(false);
                                                }
                                            }}
                                            disabled={isGeneratingInvoices}
                                            className="px-6 py-3 bg-primary text-white hover:bg-primary-hover flex items-center gap-2 rounded transition-colors text-sm font-bold shadow-md disabled:opacity-50"
                                        >
                                            {isGeneratingInvoices ? (
                                                <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-[18px]">send</span>
                                            )}
                                            {isGeneratingInvoices ? '処理中...' : '今月の請求書を発行'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Newsletter Modal */}
            {isNewsletterModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-background-main w-full max-w-lg rounded shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-4 border-b border-border-dark bg-surface">
                            <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[24px]">mail</span>
                                メルマガ宛先 (BCC)
                            </h2>
                            <button onClick={() => setIsNewsletterModalOpen(false)} className="text-text-muted hover:text-text-main p-1 rounded transition-colors cursor-pointer">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="mb-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                    <span className="material-symbols-outlined text-[16px]">group</span>
                                    対象顧客: {newsletterRecipients.length}件
                                </span>
                                <p className="text-xs text-text-muted mt-2">
                                    メルマガ配信希望であり、ステータスがActiveの顧客のみ抽出されています。
                                </p>
                            </div>
                            
                            <div className="space-y-2 mb-6">
                                <label className="block text-sm font-bold text-text-main">抽出リスト (カンマ区切り)</label>
                                <textarea
                                    readOnly
                                    value={newsletterRecipients.join(', ')}
                                    className="w-full h-32 p-3 bg-surface border border-border-dark text-xs text-text-main focus:outline-none focus:border-primary font-mono tracking-tight leading-relaxed resize-none rounded"
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(newsletterRecipients.join(','));
                                        alert('BCC用メールアドレスをクリップボードにコピーしました。\nmassエディタやメールソフトのBCC欄に貼り付けてご使用ください。');
                                    }}
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-surface border border-border-dark hover:bg-surface-highlight hover:border-primary text-text-main font-bold transition-all shadow-sm rounded"
                                >
                                    <span className="material-symbols-outlined text-[20px]">content_copy</span>
                                    <span>BCCアドレスをコピーする</span>
                                </button>
                                
                                <button 
                                    onClick={() => {
                                        const bccString = newsletterRecipients.join(',');
                                        const subject = encodeURIComponent('【お知らせ】BIGROCKより');
                                        const body = encodeURIComponent('各位\n\n平素は格別のお引き立てを賜り厚く御礼申し上げます。\n\n----\n株式会社ビッグロック');
                                        window.location.href = `mailto:?bcc=${bccString}&subject=${subject}&body=${body}`;
                                    }}
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-background-main hover:bg-white font-bold transition-all shadow-md rounded"
                                >
                                    <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                                    <span>メールソフトを起動する</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Edit Modal */}
            {editingOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-surface w-full max-w-4xl rounded-xl shadow-2xl flex flex-col overflow-hidden border border-border-dark animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border-dark flex justify-between items-center bg-surface-highlight">
                            <h2 className="text-xl font-bold font-display text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">receipt_long</span>
                                注文詳細・ステータス変更
                            </h2>
                            <button onClick={() => setEditingOrder(null)} className="text-text-muted hover:text-text-main transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            {/* Left Column: Order Details */}
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h3 className="text-sm font-bold text-text-muted border-b border-border-dark pb-2 mb-3">注文情報</h3>
                                    <div className="text-sm space-y-2">
                                        {(() => {
                                            const fullCustomer = customersList.find(c => c.email === editingOrder.customerEmail);
                                            return (
                                                <>
                                                    <div className="flex justify-between"><span className="text-text-muted">注文ID:</span><span className="font-mono font-bold">{editingOrder.orderId}</span></div>
                                                    <div className="flex justify-between"><span className="text-text-muted">日時:</span><span>{new Date(editingOrder.createdAt).toLocaleString('ja-JP')}</span></div>
                                                    <div className="flex justify-between items-start gap-4">
                                                        <span className="text-text-muted whitespace-nowrap">顧客:</span>
                                                        <div className="text-right">
                                                            <div className="font-bold">{fullCustomer?.companyName || editingOrder.companyName || 'ゲスト'}</div>
                                                            {fullCustomer?.contactName && <div className="text-xs text-text-muted mt-0.5">{fullCustomer.department} {fullCustomer.contactName} 様</div>}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between"><span className="text-text-muted">Email:</span><span>{editingOrder.customerEmail}</span></div>
                                                    {fullCustomer?.phone && <div className="flex justify-between"><span className="text-text-muted">電話番号:</span><span className="font-mono">{fullCustomer.phone}</span></div>}
                                                    {fullCustomer?.shippingAddress && (
                                                        <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-border-dark/50">
                                                            <span className="text-text-muted text-xs">配送先住所:</span>
                                                            <span className="text-sm leading-relaxed whitespace-pre-wrap">{fullCustomer.shippingAddress}</span>
                                                        </div>
                                                    )}
                                                    {editingOrder.shippingOption && <div className="flex justify-between mt-2 pt-2 border-t border-border-dark/50"><span className="text-text-muted">配送指定:</span><span className="text-primary font-bold">{Array.isArray(editingOrder.shippingOption) ? editingOrder.shippingOption[0] : editingOrder.shippingOption}</span></div>}
                                                    {editingOrder.memo && editingOrder.memo !== "メモなし" && (
                                                        <div className="mt-2 bg-accent-red/5 p-3 rounded border border-accent-red/20">
                                                            <span className="block text-xs font-bold text-accent-red mb-1">備考 / メモ</span>
                                                            <span className="text-text-main">{editingOrder.memo}</span>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-bold text-text-muted border-b border-border-dark pb-2 mb-3">注文内容</h3>
                                    <div className="bg-background-main border border-border-dark rounded-lg overflow-hidden divide-y divide-border-dark">
                                        {JSON.parse(editingOrder.items || "[]").map((item, idx) => {
                                            const snapVariant = item.variants?.find(v => v.id === item.variantId);
                                            const isActuallyBO = item.isBO || (snapVariant && snapVariant.stock < item.quantity);
                                            
                                            return (
                                              <div key={idx} className="p-3 flex items-center gap-3">
                                                  {item.imageUrl ? (
                                                      <img src={item.imageUrl} alt={item.productName || item.name} className="w-12 h-12 object-cover rounded bg-white border border-border-dark" />
                                                  ) : (
                                                      <div className="w-12 h-12 rounded bg-surface-highlight border border-border-dark flex items-center justify-center text-[10px] text-text-muted">画像なし</div>
                                                  )}
                                                  <div className="flex-1 min-w-0">
                                                      <div className="text-xs font-medium text-text-muted truncate">{item.productName || item.name}</div>
                                                      <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
                                                          {item.variantName && (
                                                              <div className="text-base font-bold text-text-main leading-none truncate pt-0.5">
                                                                  {item.variantName}
                                                              </div>
                                                          )}
                                                          {isActuallyBO ? (
                                                              <span className="inline-flex shrink-0 items-center justify-center rounded bg-accent-red/10 px-1.5 py-[3px] text-[9px] font-bold text-accent-red border border-accent-red/20 tracking-wider leading-none">BO品</span>
                                                          ) : (
                                                              <span className="inline-flex shrink-0 items-center justify-center rounded bg-emerald-500/10 px-1.5 py-[3px] text-[9px] font-bold text-emerald-600 border border-emerald-500/20 tracking-wider leading-none">在庫品</span>
                                                          )}
                                                      </div>
                                                      <div className="flex flex-wrap items-center justify-between mt-2 gap-2">
                                                          <div className="text-xs font-mono text-text-muted">¥{(item.price || 0).toLocaleString()}</div>
                                                          <div className="flex items-center gap-3">
                                                              <div className="text-base font-bold bg-primary/10 text-primary border border-primary/20 px-3 py-0.5 rounded shadow-sm">
                                                                  {item.quantity}点
                                                              </div>
                                                              <div className="text-sm font-bold font-mono">¥{((item.price || 0) * item.quantity).toLocaleString()}</div>
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>
                                            );
                                        })}
                                    </div>
                                    <div className="text-right mt-3">
                                        <div className="text-xs text-text-muted">合計金額</div>
                                        <div className="text-xl font-bold text-primary font-mono">¥{(editingOrder.totalAmount || 0).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Right Column: Status Edit */}
                            <div className="flex flex-col gap-6">
                                <h3 className="text-sm font-bold text-text-muted border-b border-border-dark pb-2">対応状況</h3>
                                
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-text-main">ステータス <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select 
                                            value={editStatus}
                                            onChange={(e) => setEditStatus(e.target.value)}
                                            className="w-full bg-background-main border border-border-dark px-4 py-3 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer font-bold"
                                        >
                                            <option value="処理中">処理中 (Processing)</option>
                                            <option value="本国手配中">本国手配中 (Backordered)</option>
                                            <option value="発送済">発送済 (Shipped)</option>
                                            <option value="下書き">注文保留 (Hold)</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">expand_more</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-text-main flex items-center gap-2">
                                        配送情報 (追跡番号など)
                                    </label>
                                    <textarea 
                                        value={editShippingInfo}
                                        onChange={(e) => setEditShippingInfo(e.target.value)}
                                        placeholder="例: ヤマト運輸 1234-5678-9012"
                                        rows={4}
                                        className="w-full bg-background-main border border-border-dark px-4 py-3 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted/50"
                                    />
                                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                        入力された情報は購入者の注文履歴画面に表示されます。配送後の追跡に利用されます。
                                    </p>
                                </div>
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
                        <div className="p-6 flex flex-col gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            
                            {/* アカウント・必須項目 */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold border-b border-border-dark pb-2 text-primary">アカウント情報</h3>
                                
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-text-main">ログインメールアドレス <span className="text-red-500">*</span></label>
                                    <input 
                                        type="email"
                                        value={customerForm.email}
                                        onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                                        placeholder="ログインIDと一致する必要があります"
                                        className="w-full bg-surface border border-border-dark px-3 py-2.5 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-text-main">アカウント状態 <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select 
                                            value={Array.isArray(customerForm.status) ? customerForm.status[0] : customerForm.status}
                                            onChange={(e) => setCustomerForm({...customerForm, status: [e.target.value]})}
                                            className="w-full bg-surface border border-border-dark px-3 py-2.5 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer font-bold text-sm"
                                        >
                                            <option value="Active">有効 (Active)</option>
                                            <option value="Inactive">無効 (Inactive - 承認待ち等)</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-base">expand_more</span>
                                    </div>
                                </div>
                                
                                <label className="flex items-center gap-2 cursor-pointer mt-2 p-2 bg-background-main border border-border-dark rounded">
                                    <input type="checkbox" checked={customerForm.newsletter} onChange={(e) => setCustomerForm({...customerForm, newsletter: e.target.checked})} className="w-4 h-4 text-primary bg-surface border-border-dark rounded focus:ring-primary" />
                                    <span className="text-xs font-bold text-text-main">メルマガ配信を希望する</span>
                                </label>
                            </div>

                            {/* 会社情報 */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold border-b border-border-dark pb-2 text-primary">会社情報</h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-text-main">会社名 / 店舗名 <span className="text-red-500">*</span></label>
                                        <input type="text" value={customerForm.companyName} onChange={e => setCustomerForm({...customerForm, companyName: e.target.value})} className="w-full bg-surface border border-border-dark px-3 py-2.5 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-text-main">会社名カナ</label>
                                        <input type="text" value={customerForm.companyNameKana} onChange={e => setCustomerForm({...customerForm, companyNameKana: e.target.value})} className="w-full bg-surface border border-border-dark px-3 py-2.5 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-text-main">代表者名</label>
                                        <input type="text" value={customerForm.repName} onChange={e => setCustomerForm({...customerForm, repName: e.target.value})} className="w-full bg-surface border border-border-dark px-3 py-2.5 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-text-main">代表者カナ</label>
                                        <input type="text" value={customerForm.repNameKana} onChange={e => setCustomerForm({...customerForm, repNameKana: e.target.value})} className="w-full bg-surface border border-border-dark px-3 py-2.5 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" />
                                    </div>
                                </div>
                            </div>

                            {/* 担当・連絡先 */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold border-b border-border-dark pb-2 text-primary">担当・連絡先</h3>
                                
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="flex flex-col gap-2 col-span-1">
                                        <label className="text-xs font-bold text-text-main">部署名</label>
                                        <input type="text" value={customerForm.department} onChange={e => setCustomerForm({...customerForm, department: e.target.value})} className="w-full bg-surface border border-border-dark px-3 py-2.5 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" />
                                    </div>
                                    <div className="flex flex-col gap-2 col-span-1">
                                        <label className="text-xs font-bold text-text-main">担当者名</label>
                                        <input type="text" value={customerForm.contactName} onChange={e => setCustomerForm({...customerForm, contactName: e.target.value})} className="w-full bg-surface border border-border-dark px-3 py-2.5 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" />
                                    </div>
                                    <div className="flex flex-col gap-2 col-span-1">
                                        <label className="text-xs font-bold text-text-main">担当者カナ</label>
                                        <input type="text" value={customerForm.contactNameKana} onChange={e => setCustomerForm({...customerForm, contactNameKana: e.target.value})} className="w-full bg-surface border border-border-dark px-3 py-2.5 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-text-main">電話番号</label>
                                        <input type="text" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full bg-surface border border-border-dark px-3 py-2.5 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-mono" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-text-main">携帯番号</label>
                                        <input type="text" value={customerForm.mobilePhone} onChange={e => setCustomerForm({...customerForm, mobilePhone: e.target.value})} className="w-full bg-surface border border-border-dark px-3 py-2.5 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-mono" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-text-main">FAX</label>
                                        <input type="text" value={customerForm.fax} onChange={e => setCustomerForm({...customerForm, fax: e.target.value})} className="w-full bg-surface border border-border-dark px-3 py-2.5 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-mono" />
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-text-main">初期配送先住所</label>
                                    <textarea value={customerForm.shippingAddress} onChange={e => setCustomerForm({...customerForm, shippingAddress: e.target.value})} className="w-full bg-surface border border-border-dark px-3 py-2.5 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y min-h-[60px] text-sm" />
                                </div>
                            </div>
                            
                            {/* 企業付加情報 */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold border-b border-border-dark pb-2 text-primary">企業付加情報</h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-text-main">設立年月</label>
                                        <input type="text" value={customerForm.established} onChange={e => setCustomerForm({...customerForm, established: e.target.value})} className="w-full bg-surface border border-border-dark px-3 py-2.5 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-text-main">業態 / 業種</label>
                                        <input type="text" value={customerForm.industry} onChange={e => setCustomerForm({...customerForm, industry: e.target.value})} className="w-full bg-surface border border-border-dark px-3 py-2.5 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-text-main">年商 (千円)</label>
                                        <input type="text" value={customerForm.annualSales} onChange={e => setCustomerForm({...customerForm, annualSales: e.target.value})} className="w-full bg-surface border border-border-dark px-3 py-2.5 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-mono" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-text-main">サイトURL</label>
                                        <input type="text" value={customerForm.websiteUrl} onChange={e => setCustomerForm({...customerForm, websiteUrl: e.target.value})} className="w-full bg-surface border border-border-dark px-3 py-2.5 rounded text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-mono" />
                                    </div>
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
                                            <div className="flex gap-4 flex-1 flex-wrap">
                                                <div className="flex-1 min-w-[120px]">
                                                    <label className="block text-[10px] text-text-muted mb-1 font-mono uppercase tracking-wider">メーカー</label>
                                                    <input 
                                                        type="text" 
                                                        value={v.manufacturer || ''}
                                                        onChange={(e) => {
                                                            const newV = [...productForm.variants];
                                                            newV[i] = { ...newV[i], manufacturer: e.target.value };
                                                            setProductForm({ ...productForm, variants: newV });
                                                        }}
                                                        placeholder="例: Specialized"
                                                        className="w-full p-2.5 text-sm bg-surface border border-border-dark rounded focus:border-primary focus:ring-1 focus:ring-primary text-text-main transition-all"
                                                    />
                                                </div>
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

        {/* Customer Details Modal (Read-Only) */}
        {viewingCustomer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-main/50 backdrop-blur-sm shadow-2xl animate-fade-in" onClick={() => setViewingCustomer(null)}>
                <div className="bg-surface w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-border-dark bg-background-main flex justify-between items-center z-10 shrink-0">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">badge</span>
                            顧客登録情報
                        </h2>
                        <button onClick={() => setViewingCustomer(null)} className="text-text-muted hover:text-text-main transition-colors p-1 rounded-full hover:bg-black/5">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto bg-background-main/50 space-y-6 flex-1">
                        <div className="bg-surface p-5 rounded-lg border border-border-dark shadow-sm">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">基本情報 (Basic Info)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">会社名</p>
                                    <p className="text-sm font-bold text-text-main mt-0.5">{viewingCustomer.companyName}</p>
                                    <p className="text-[10px] text-text-muted">{viewingCustomer.companyNameKana}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">代表者名</p>
                                    <p className="text-sm font-medium text-text-main mt-0.5">{viewingCustomer.repName || '未登録'}</p>
                                    {viewingCustomer.repNameKana && <p className="text-[10px] text-text-muted">{viewingCustomer.repNameKana}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface p-5 rounded-lg border border-border-dark shadow-sm">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">担当者・連絡先 (Contact Details)</h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                <div>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">部署名</p>
                                    <p className="text-sm text-text-main mt-0.5">{viewingCustomer.department || '未登録'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">担当者名</p>
                                    <p className="text-sm font-medium text-text-main mt-0.5">{viewingCustomer.contactName}</p>
                                    <p className="text-[10px] text-text-muted">{viewingCustomer.contactNameKana}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">メールアドレス</p>
                                    <p className="text-sm font-mono text-text-main mt-0.5">{viewingCustomer.email}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">電話番号</p>
                                    <p className="text-sm font-mono text-text-main mt-0.5">{viewingCustomer.phone || '未登録'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">携帯番号</p>
                                    <p className="text-sm font-mono text-text-main mt-0.5">{viewingCustomer.mobilePhone || '未登録'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">配送先住所</p>
                                    <p className="text-sm text-text-main mt-0.5 whitespace-pre-wrap">{viewingCustomer.shippingAddress || '未登録'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface p-5 rounded-lg border border-border-dark shadow-sm">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">会社情報 (Company Profile)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">設立年</p>
                                    <p className="text-sm text-text-main mt-0.5">{viewingCustomer.established || '未登録'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">年商</p>
                                    <p className="text-sm text-text-main mt-0.5">{viewingCustomer.annualSales || '未登録'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">主な事業内容</p>
                                    <p className="text-sm text-text-main mt-0.5">{viewingCustomer.industry || '未登録'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">ウェブサイト / SNS</p>
                                    <p className="text-sm text-primary font-mono truncate mt-0.5">
                                        {viewingCustomer.websiteUrl ? (
                                            <a href={viewingCustomer.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{viewingCustomer.websiteUrl}</a>
                                        ) : '未登録'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        </div>
    );
}
