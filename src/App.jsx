import { useState, useEffect, useRef, useMemo } from 'react'
import productsDataFromJson from './data/products.json'
import Login from './components/Login'
import Admin from './components/Admin'
import { fetchProducts, createOrder, fetchOrders, fetchCustomers } from './services/microcms'
import { useAuth } from './context/AuthContext'

function App() {
  const { currentUser, logout } = useAuth()
  const [appMode, setAppMode] = useState('login')
  const [customerProfile, setCustomerProfile] = useState(null)
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false)
  const [activeTab, setActiveTab] = useState('catalog')
  const [products, setProducts] = useState(productsDataFromJson)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const toastTimer = useRef(null)
  
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false)
  const [adminPasswordInput, setAdminPasswordInput] = useState('')
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false)

  const verifyAdminAccess = async () => {
    if (!adminPasswordInput) return;
    setIsVerifyingAdmin(true);
    try {
      const res = await fetch('/api/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasswordInput })
      });
      const data = await res.json();
      if (data.success) {
        setAppMode('admin');
        setShowAdminAuthModal(false);
        setAdminPasswordInput('');
      } else {
        alert('パスワードが間違っています。');
        setAdminPasswordInput('');
      }
    } catch(e) {
      alert('認証エラーが発生しました。インターネット接続を確認してください。');
    } finally {
      setIsVerifyingAdmin(false);
    }
  }

  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false)
  const [orderCompleteData, setOrderCompleteData] = useState(null)
  
  const [selectionQuantities, setSelectionQuantities] = useState({})

  const handleVariantQuantityChange = (variantId, delta, maxStock) => {
    setSelectionQuantities(prev => {
      const current = prev[variantId] || 1;
      let next = current + delta;
      if (next < 1) next = 1;
      if (next > maxStock) next = maxStock;
      return { ...prev, [variantId]: next };
    })
  }

  const handleVariantQuantityInput = (variantId, valStr, maxStock) => {
    let next = parseInt(valStr, 10);
    if (isNaN(next) || next < 1) next = 1;
    if (next > maxStock) next = maxStock;
    setSelectionQuantities(prev => ({ ...prev, [variantId]: next }))
  }

  // Check localStorage for existing cart
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('bigrock_b2b_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [orderHistory, setOrderHistory] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyFilter, setHistoryFilter] = useState('all')

  const filteredOrderHistory = useMemo(() => {
    if (historyFilter === 'all') return orderHistory;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    return orderHistory.filter(order => {
      const orderDate = new Date(order.createdAt);
      if (historyFilter === 'thisYear') {
        return orderDate.getFullYear() === currentYear;
      }
      if (historyFilter === 'lastYear') {
        return orderDate.getFullYear() === currentYear - 1;
      }
      if (historyFilter === 'thisMonth') {
        return orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth;
      }
      if (historyFilter === 'lastMonth') {
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        return orderDate.getFullYear() === lastMonthDate.getFullYear() && orderDate.getMonth() === lastMonthDate.getMonth();
      }
      if (historyFilter === 'thisWeek') {
        // Last 7 days
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= sevenDaysAgo;
      }
      return true;
    });
  }, [orderHistory, historyFilter]);

  const addToCart = (product, variant, addedQuantity = 1) => {
    setCart(prevCart => {
      const cartItemId = variant ? `${product.id}_${variant.id}` : product.id;
      const existingItem = prevCart.find(item => item.cartItemId === cartItemId)
      if (existingItem) {
        return prevCart.map(item =>
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + addedQuantity } : item
        )
      }
      return [...prevCart, { ...product, cartItemId, variantId: variant?.id, variantName: variant?.name, quantity: addedQuantity }]
    })

    if (toastTimer.current) {
      clearTimeout(toastTimer.current)
    }
    const variantStr = variant ? ` (${variant.name})` : ''
    setToastMessage(`カートに追加しました：${product.name}${variantStr}`)
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000)
  }

  const updateCartItemQuantity = (cartItemId, delta) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQuantity = item.quantity + delta
        return { ...item, quantity: Math.max(0, newQuantity) }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeFromCart = (cartItemId) => {
    setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId))
  }

  const getCartTotalQuantity = () => cart.reduce((total, item) => total + item.quantity, 0)
  const getCartTotalPrice = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0)

  const placeOrder = async () => {
    if (cart.length === 0) return;

    const orderIdValue = `ORD-${Math.floor(Math.random() * 10000) + 4000}`;
    const totalQty = getCartTotalQuantity();
    const finalTotal = Math.floor(getCartTotalPrice() * 1.1);

    try {
      await createOrder({
        orderId: orderIdValue,
        customerEmail: customerProfile?.email || currentUser?.email || "b2b-client@example.com",
        companyName: customerProfile?.companyName || "ゲスト",
        items: JSON.stringify(cart),
        totalAmount: finalTotal,
        status: "処理中"
      });
      console.log("Order successfully created in MicroCMS");
    } catch (error) {
      console.error("Failed to push order to MicroCMS", error);
      alert("発注の送信に失敗しました。時間をおいてもう一度お試しください。");
      return; // Stop if it fails
    }

    const newOrder = {
      id: orderIdValue,
      date: new Date().toLocaleDateString('ja-JP'),
      items: totalQty,
      total: finalTotal,
      status: '処理中'
    }

    // 注文後はそのまま再フェッチするか、単純にローカルに追加して待つ
    // MicroCMSから再取得するため historyを開いた時に最新化される
    setCart([])
    setIsConfirmingOrder(false)
    setOrderCompleteData(newOrder)
  }

  // Fetch real order history
  useEffect(() => {
    if (activeTab === 'history') {
      const loadHistory = async () => {
        setIsLoadingHistory(true);
        try {
          const allOrders = await fetchOrders();
          const userEmail = customerProfile?.email || currentUser?.email || "b2b-client@example.com";
          // Filter by current user and sort descending
          const myOrders = allOrders
            .filter(o => o.customerEmail === userEmail)
            .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          setOrderHistory(myOrders);
        } catch (error) {
          console.error("Failed to load history", error);
        } finally {
          setIsLoadingHistory(false);
        }
      };
      loadHistory();
    }
  }, [activeTab]);

  // Fetch products explicitly as a stable callback
  const loadProducts = async () => {
    const data = await fetchProducts()
    if (data && data.length > 0) {
        // MicroCMS response mapped to our standard expected format
        const formattedData = data.map(item => {
          let parsedVariants = null;
          if (item.variants) {
            try {
              const rawVariants = typeof item.variants === 'string' ? JSON.parse(item.variants) : item.variants;
              if (Array.isArray(rawVariants)) {
                parsedVariants = rawVariants.map(v => ({
                    id: v.id || v.name, // Fallback to name if id is missing in Custom Field
                    name: v.name,
                    stock: v.stock
                }));
              }
            } catch (e) {
              console.warn('Failed to parse variants for', item.title);
            }
          }
          return {
            id: item.skuproducts || item.sku || item.id,
            microcmsId: item.id,
            name: item.title,
            category: item.category ? item.category[0] || item.category : 'General',
            price: item.basePrice || item.price || 0,
            stock: item.stock || 0,
            imageUrl: item.externalImageUrl || item.image?.url || '',
            variants: parsedVariants
          };
        })
        setProducts(formattedData)
      }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bigrock_b2b_cart', JSON.stringify(cart));
  }, [cart]);

  // Example filtering for quick access categories if needed
  const frames = products.filter(p => p.category === 'Frame')
  const components = products.filter(p => p.category === 'Components')
  const apparel = products.filter(p => p.category === 'Apparel')

  // Handle Authentication and Customer Profile check
  useEffect(() => {
    const checkAccess = async () => {
      if (!currentUser) {
        setAppMode('login');
        setCustomerProfile(null);
        return;
      }

      setIsCheckingCustomer(true);
      try {
        // Super Admin Bypass
        if (currentUser.email === 'koubou.hi.rx7@gmail.com') {
            setCustomerProfile({ email: currentUser.email, companyName: 'サイト管理者 (Admin)', status: 'Active' });
            if (appMode === 'login' || appMode === 'pending') {
                setAppMode('store'); // Change from admin to store so they see the catalog
                setActiveTab('catalog'); // explicitly lock to catalog tab
            }
            setIsCheckingCustomer(false);
            return;
        }

        const customers = await fetchCustomers();
        const profile = customers.find(c => c.email === currentUser.email);
        
        if (profile && profile.status === 'Active') {
          setCustomerProfile(profile);
          if (appMode === 'login' || appMode === 'pending') {
            setAppMode('store');
            setActiveTab('catalog'); // explicitly lock to catalog tab
          }
        } else {
          setCustomerProfile(null);
          setAppMode('pending');
        }
      } catch (err) {
        console.error("Error checking customer access:", err);
        setAppMode('pending');
      } finally {
        setIsCheckingCustomer(false);
      }
    };

    checkAccess();
  }, [currentUser]);

  if (appMode === 'login') {
    return <Login />
  }

  if (isCheckingCustomer) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-main text-text-main font-display">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-[48px] text-primary animate-spin">sync</span>
          <p className="font-bold tracking-wider">アカウント情報を確認しています...</p>
        </div>
      </div>
    );
  }

  if (appMode === 'pending') {
    return (
      <div className="flex items-center justify-center h-screen bg-background-main text-text-main font-display p-6 text-center">
        <div className="max-w-md w-full bg-surface p-8 rounded-xl border border-border-dark flex flex-col items-center gap-6 shadow-2xl">
          <div className="size-16 rounded-full bg-accent-red/10 flex items-center justify-center text-accent-red">
            <span className="material-symbols-outlined text-[32px]">pending_actions</span>
          </div>
          <div>
            <h1 className="text-xl font-bold mb-2">承認待ち、または未登録です</h1>
            <p className="text-sm text-text-muted leading-relaxed">
              現在のアカウント（{currentUser?.email}）は、B2B発注システムへのアクセス権限がありません。<br/><br/>
              管理者の承認をお待ちいただくか、アカウント情報が正しく登録されているかご確認ください。
            </p>
          </div>
          <div className="flex w-full gap-3 mt-4">
            <button onClick={logout} className="flex-1 py-3 border border-border-dark rounded font-bold hover:bg-surface-highlight transition-colors text-text-main">
              ログアウト
            </button>
            <button onClick={() => window.location.reload()} className="flex-1 py-3 bg-primary text-background-main rounded font-bold hover:bg-white transition-colors">
              再確認する
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appMode === 'admin') {
    return <Admin products={products} onExitAdmin={() => setAppMode('store')} refreshProducts={loadProducts} />
  }

  return (
    <div className="flex h-screen bg-background-main text-text-main">
      {/* Admin Password Modal */}
      {showAdminAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowAdminAuthModal(false)}>
          <div className="bg-surface rounded-xl shadow-2xl p-8 max-w-sm w-full font-display border border-border-dark animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 mx-auto">
              <span className="material-symbols-outlined !text-[28px]">lock</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-center text-text-main">管理者認証</h3>
            <p className="text-sm text-text-muted mb-6 text-center leading-relaxed">これより先は管理者専用エリアです。パスワードを入力してください。</p>
            <input 
              type="password" 
              value={adminPasswordInput}
              onChange={e => setAdminPasswordInput(e.target.value)}
              placeholder="パスワード"
              className="w-full p-3.5 bg-background-main border border-border-dark focus:border-primary focus:ring-1 focus:ring-primary rounded mb-6 text-text-main font-mono text-center tracking-widest shadow-inner shadow-black/5"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isVerifyingAdmin) {
                  verifyAdminAccess();
                }
              }}
            />
            <div className="flex gap-3">
              <button 
                className="flex-1 py-3.5 bg-background-main border border-border-dark text-text-main font-bold hover:bg-surface-highlight transition-colors rounded shadow-sm"
                onClick={() => {
                  setShowAdminAuthModal(false);
                  setAdminPasswordInput('');
                }}
              >
                キャンセル
              </button>
              <button 
                className="flex-1 py-3.5 bg-primary text-background-main font-bold hover:bg-white transition-colors rounded flex items-center justify-center gap-2 shadow-sm"
                onClick={verifyAdminAccess}
                disabled={isVerifyingAdmin}
              >
                {isVerifyingAdmin ? <span className="material-symbols-outlined animate-spin">sync</span> : '認証する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface border-r border-border-subtle flex flex-col shrink-0 z-20">
        {/* Logo Area */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border-subtle">
          <div className="size-8 bg-primary rounded-sm flex items-center justify-center text-background-main font-bold">
            <span className="material-symbols-outlined text-xl">landscape</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-text-main text-base font-bold tracking-wide leading-none">BIG ROCK</h1>
            <p className="text-text-muted text-[10px] font-mono leading-none mt-1 tracking-wider">PROCUREMENT HUB</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-1">
          {/* Catalog Item */}
          <button
            className={`group flex items-center w-full gap-3 px-6 py-3 transition-colors ${activeTab === 'catalog' ? 'bg-black/5 border-l-2 border-primary text-primary' : 'border-l-2 border-transparent text-text-muted hover:text-text-main hover:bg-black/5'}`}
            onClick={() => setActiveTab('catalog')}
          >
            <span className="material-symbols-outlined">inventory_2</span>
            <span className="text-sm font-medium">製品カタログ</span>
          </button>

          <button
            className={`group flex items-center w-full gap-3 px-6 py-3 transition-colors ${activeTab === 'history' ? 'bg-black/5 border-l-2 border-primary text-primary' : 'border-l-2 border-transparent text-text-muted hover:text-text-main hover:bg-black/5'}`}
            onClick={() => setActiveTab('history')}
          >
            <span className="material-symbols-outlined">history</span>
            <span className="text-sm font-medium">注文履歴</span>
          </button>

          {/* Cart Item */}
          <button
            className={`group flex items-center w-full gap-3 px-6 py-3 transition-colors ${activeTab === 'cart' ? 'bg-black/5 border-l-2 border-primary text-primary' : 'border-l-2 border-transparent text-text-muted hover:text-text-main hover:bg-black/5'}`}
            onClick={() => setActiveTab('cart')}
          >
            <div className="relative flex items-center justify-center">
              <span className="material-symbols-outlined">shopping_cart</span>
              {getCartTotalQuantity() > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-accent-red text-white text-[9px] font-bold px-1 rounded-full">{getCartTotalQuantity()}</span>
              )}
            </div>
            <span className="text-sm font-medium">カートを見る</span>
          </button>
        </nav>
        {/* Admin Link (Test) */}
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowAdminAuthModal(true)}
            className="w-full py-2 px-3 flex items-center gap-2 justify-center text-xs font-bold text-background-main bg-primary hover:bg-white transition-colors uppercase tracking-wider shadow-[0_0_10px_rgba(242,201,76,0.2)]"
          >
            <span className="material-symbols-outlined text-[16px]">settings_applications</span>
            <span>管理者メニューへ</span>
          </button>
        </div>

        {/* User Profile / Footer */}
        <div className="p-4 border-t border-border-subtle">
          <div className="flex items-center gap-3 p-2 rounded-sm bg-black/5 border border-border-subtle">
            <div className="size-8 rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${currentUser?.photoURL || '/src/assets/avatar.png'}')` }}></div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-bold text-text-main truncate">{currentUser?.displayName || 'USER'}</span>
              <span className="text-[10px] text-text-muted truncate">{currentUser?.email || 'B2B Client'}</span>
            </div>
            <button
              onClick={() => logout()}
              className="text-text-muted hover:text-text-main transition-colors"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 technical-grid bg-grid-pattern z-0"></div>

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-border-subtle bg-background-main/80 backdrop-blur-sm z-10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-text-main tracking-wide uppercase">{activeTab}</h2>
            <p className="text-xs text-text-muted font-mono">{new Date().toLocaleDateString('ja-JP').replace(/\//g, '.')} // SYSTEM ONLINE</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('cart')}
              className="relative flex items-center justify-center size-9 rounded-sm border border-border-subtle text-text-muted hover:text-primary hover:border-primary transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
              {getCartTotalQuantity() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 size-4 bg-accent-red text-white text-[9px] font-bold flex items-center justify-center rounded-full shadow-sm">
                  {getCartTotalQuantity()}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-surface border border-border-subtle">
              <div className="size-2 rounded-full bg-accent-green animate-pulse"></div>
              <span className="text-xs font-mono text-text-muted">API: CONNECTED</span>
            </div>
            <button className="flex items-center justify-center size-9 rounded-sm border border-border-subtle text-text-muted hover:text-primary hover:border-primary transition-all">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content Grid */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
          <div className="max-w-7xl mx-auto h-full">

            {/* --- CART VIEW --- */}
            {activeTab === 'cart' && (
              <div className="flex flex-col gap-6 animate-fade-in-up">
                {orderCompleteData ? (
                  <div className="max-w-xl mx-auto mt-12 bg-surface border border-border-subtle p-12 text-center rounded-sm w-full">
                    <div className="size-20 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-outlined text-4xl text-accent-green">check_circle</span>
                    </div>
                    <h3 className="text-2xl font-bold text-text-main mb-2">発注が完了しました</h3>
                    <p className="text-text-muted mb-8 text-sm leading-relaxed">
                      注文ID: <span className="font-mono bg-black/5 px-2 py-1 rounded">{orderCompleteData.id}</span>
                      <br/>ご注文ありがとうございます。近日中に担当者より確認のご連絡を差し上げます。
                    </p>
                    <button 
                      onClick={() => { setOrderCompleteData(null); setActiveTab('history'); }}
                      className="bg-surface-highlight border border-border-subtle text-text-main font-bold py-3 px-8 rounded-sm hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                      <span className="material-symbols-outlined text-[18px]">history</span>
                      注文履歴へ進む
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                      <h3 className="text-xl font-bold text-text-main uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-2xl">shopping_cart</span>
                    現在のカート
                  </h3>
                  <div className="text-right">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">合計金額</p>
                    <p className="text-2xl font-mono text-text-main">¥{getCartTotalPrice().toLocaleString()}</p>
                  </div>
                </div>

                {cart.length === 0 ? (
                  <div className="bg-surface border border-border-subtle rounded-sm p-12 flex flex-col items-center justify-center text-center mt-8">
                    <span className="material-symbols-outlined text-text-muted text-4xl mb-4">shopping_cart</span>
                    <h4 className="text-lg font-bold text-text-main mb-2">カートは空です</h4>
                    <p className="text-sm text-text-muted mb-6">カタログから商品を追加してください。</p>
                    <button onClick={() => setActiveTab('catalog')} className="bg-primary text-background-main font-bold px-6 py-2 rounded-sm hover:bg-primary-dim transition-colors">
                      カタログを見る
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 flex flex-col gap-4">
                      {cart.map(item => (
                        <div key={item.cartItemId} className="bg-surface border border-border-subtle p-4 rounded-sm flex items-center gap-4 group">
                          <div className="size-16 bg-black/5 rounded-sm overflow-hidden flex items-center justify-center shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            ) : (
                              <span className="material-symbols-outlined text-text-muted text-2xl group-hover:text-primary transition-colors">
                                {item.category === 'Frame' ? 'directions_bike' : item.category === 'Accessory' ? 'hardware' : 'settings'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-text-main truncate">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-sm">{item.sku}</span>
                              {item.variantName && (
                                <span className="text-[10px] font-mono text-text-muted border border-border-subtle px-1.5 py-0.5 rounded-sm">{item.variantName}</span>
                              )}
                              <span className="text-xs font-mono text-text-muted">¥{item.price.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 bg-background-main border border-border-subtle rounded-sm p-1 shrink-0">
                            <button onClick={() => updateCartItemQuantity(item.cartItemId, -1)} className="size-6 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-black/10 rounded-sm transition-colors">
                              <span className="material-symbols-outlined text-sm">remove</span>
                            </button>
                            <span className="text-sm font-mono w-6 text-center text-text-main">{item.quantity}</span>
                            <button onClick={() => updateCartItemQuantity(item.cartItemId, 1)} className="size-6 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-black/10 rounded-sm transition-colors">
                              <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                          </div>

                          <div className="w-24 text-right shrink-0">
                            <p className="text-sm font-bold text-text-main font-mono">¥{(item.price * item.quantity).toLocaleString()}</p>
                          </div>

                          <button onClick={() => removeFromCart(item.cartItemId)} className="size-8 flex items-center justify-center text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-sm transition-colors shrink-0">
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="lg:col-span-1">
                      <div className="bg-surface border border-border-subtle rounded-sm p-6 sticky top-0">
                        <h4 className="text-sm font-bold text-text-main uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">注文サマリー</h4>

                        <div className="flex flex-col gap-3 text-sm mb-6">
                          <div className="flex justify-between text-text-muted">
                            <span>商品小計 ({getCartTotalQuantity()}点)</span>
                            <span className="font-mono text-text-main">¥{getCartTotalPrice().toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-text-muted">
                            <span>消費税 (10%)</span>
                            <span className="font-mono text-text-main">¥{Math.floor(getCartTotalPrice() * 0.1).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-border-subtle">
                            <span className="text-text-main">合計</span>
                            <span className="font-mono text-primary">¥{Math.floor(getCartTotalPrice() * 1.1).toLocaleString()}</span>
                          </div>
                        </div>

                        <button onClick={() => setIsConfirmingOrder(true)} className="w-full bg-primary text-background-main font-bold py-3 rounded-sm hover:bg-primary-dim transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                          <span className="material-symbols-outlined">send</span>
                          発注を実行する
                        </button>

                        <p className="text-[10px] text-text-muted text-center mt-4">
                          発注を実行する前に確認画面が表示されます。
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                </>
                )}
              </div>
            )}

            {/* --- CATALOG VIEW --- */}
            {activeTab === 'catalog' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-surface border border-border-subtle rounded-sm flex flex-col group hover:border-primary/50 transition-colors overflow-hidden">
                    {/* Thumbnail Image */}
                    <div className="h-40 w-full bg-background-main relative border-b border-border-subtle overflow-hidden">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider bg-background-main/80 backdrop-blur-sm px-2 py-1 rounded-sm text-text-muted border border-black/10">
                          {product.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-base font-bold text-text-main mb-2 leading-tight">{product.name}</h3>
                      <div className="flex items-center gap-2 mb-4">
                        <p className="text-xs font-mono text-primary/80 bg-primary/10 inline-block w-fit px-1.5 py-0.5 rounded-sm border border-primary/20">{product.sku}</p>
                        <p className="text-sm font-bold font-mono text-text-main">¥{product.price.toLocaleString()}</p>
                      </div>

                      <div className="mt-auto pt-4 border-t border-border-subtle flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-text-muted uppercase">Variants</span>
                          <span className="text-xs font-mono text-text-main">
                            {product.variants?.length || 0} Options
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setSelectedProduct(product); setActiveTab('productDetail'); }} className="text-xs bg-surface-highlight border border-border-subtle text-text-main font-bold px-4 py-2 rounded-sm hover:border-primary hover:text-primary transition-colors flex items-center gap-1 group-hover:bg-primary/10">
                            詳細を見る <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* --- PRODUCT DETAIL VIEW --- */}
            {activeTab === 'productDetail' && selectedProduct && (
              <div className="flex flex-col gap-6">
                {/* Back Button & Header */}
                <div className="flex items-center gap-4 border-b border-border-subtle pb-4">
                  <button onClick={() => setActiveTab('catalog')} className="flex items-center justify-center size-10 rounded-sm border border-border-subtle text-text-muted hover:text-text-main hover:border-text-main transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <div>
                    <h3 className="text-xl font-bold text-text-main tracking-wider flex items-center gap-2">
                      製品詳細
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">{selectedProduct.category}</span>
                      <span className="text-[10px] text-text-muted">/</span>
                      <span className="text-[10px] font-mono text-primary/80">{selectedProduct.sku}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Product Info & Image */}
                  <div className="flex flex-col gap-6">
                    <div className="bg-background-main border border-border-subtle rounded-sm aspect-video overflow-hidden relative group">
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background-main to-transparent h-1/2 opacity-60"></div>
                      <div className="absolute inset-4 top-auto flex justify-between items-end">
                        <h2 className="text-2xl font-bold text-text-main drop-shadow-md">{selectedProduct.name}</h2>
                        <a href={selectedProduct.originalUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-medium text-text-main bg-black/10 backdrop-blur-md text-text-main px-3 py-1.5 rounded-full hover:bg-primary hover:text-background-main transition-colors border border-black/20">
                          公式サイト <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </a>
                      </div>
                    </div>

                    <div className="bg-surface border border-border-subtle p-6 rounded-sm">
                      <h4 className="text-sm font-bold text-text-main uppercase tracking-wider mb-2 border-b border-border-subtle pb-2">Description</h4>
                      <p className="text-sm text-text-muted leading-relaxed">
                        {selectedProduct.description}
                      </p>
                      <div className="mt-6 pt-4 border-t border-border-subtle">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Base Price</p>
                        <p className="text-2xl font-mono font-bold text-text-main">¥{selectedProduct.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Variants List */}
                  <div className="flex flex-col gap-4">
                    <h4 className="text-sm font-bold text-text-main uppercase tracking-wider mb-2">バリエーション選択 ({selectedProduct.variants?.length || 0})</h4>

                    <div className="bg-surface border border-border-subtle rounded-sm overflow-hidden flex flex-col">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-surface-highlight text-text-muted text-xs uppercase font-mono border-b border-border-subtle">
                          <tr>
                            <th className="px-5 py-3 font-medium">仕様 / サイズ</th>
                            <th className="px-5 py-3 font-medium text-center">在庫</th>
                            <th className="px-5 py-3 font-medium text-right">アクション</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {selectedProduct.variants?.map(variant => (
                            <tr key={variant.id} className="hover:bg-black/5 transition-colors group">
                              <td className="px-5 py-4 font-bold text-text-main text-sm">{variant.name}</td>
                              <td className="px-5 py-4 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border ${variant.stock > 5 ? 'bg-accent-green/10 text-accent-green border-accent-green/20' : variant.stock > 0 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-text-muted/10 text-text-muted border-border-subtle'}`}>
                                  {variant.stock > 0 ? `${variant.stock} units` : 'Out of Stock'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  {variant.stock > 0 && (
                                    <div className="flex items-center border border-border-subtle rounded-sm bg-background-main shadow-sm">
                                      <button 
                                        onClick={() => handleVariantQuantityChange(variant.id, -1, variant.stock)} 
                                        className="size-8 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-black/5 transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">remove</span>
                                      </button>
                                      <input 
                                        type="number" 
                                        min="1" 
                                        max={variant.stock} 
                                        value={selectionQuantities[variant.id] || 1} 
                                        onChange={(e) => handleVariantQuantityInput(variant.id, e.target.value, variant.stock)}
                                        className="w-12 h-8 text-center bg-transparent border-none text-sm font-mono focus:ring-0 p-0 text-text-main"
                                      />
                                      <button 
                                        onClick={() => handleVariantQuantityChange(variant.id, 1, variant.stock)} 
                                        className="size-8 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-black/5 transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">add</span>
                                      </button>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => {
                                      const addQty = selectionQuantities[variant.id] || 1;
                                      addToCart(selectedProduct, variant, addQty);
                                      setSelectionQuantities(prev => ({ ...prev, [variant.id]: 1 }));
                                    }}
                                    disabled={variant.stock === 0}
                                    className={`text-xs font-bold px-4 py-2 rounded-sm transition-colors flex items-center gap-1 shadow-sm ${variant.stock > 0 ? 'bg-primary text-background-main hover:bg-primary-dim shadow-primary/20' : 'bg-surface-highlight text-text-muted cursor-not-allowed border border-border-subtle'}`}
                                  >
                                    {variant.stock > 0 ? (
                                      <>カートに追加 <span className="material-symbols-outlined text-sm">add_shopping_cart</span></>
                                    ) : (
                                      <>在庫なし <span className="material-symbols-outlined text-sm">block</span></>
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- HISTORY VIEW --- */}
            {activeTab === 'history' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                  <h3 className="text-xl font-bold text-text-main uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-2xl">history</span>
                    注文履歴
                  </h3>
                  <div className="relative">
                    <select 
                      value={historyFilter}
                      onChange={(e) => setHistoryFilter(e.target.value)}
                      className="appearance-none bg-surface border border-border-subtle text-text-main py-2 pl-4 pr-10 rounded shadow-sm focus:outline-none focus:border-primary font-mono text-sm cursor-pointer"
                    >
                      <option value="all">すべての期間</option>
                      <option value="thisWeek">過去7日間</option>
                      <option value="thisMonth">今月</option>
                      <option value="lastMonth">先月</option>
                      <option value="thisYear">今年</option>
                      <option value="lastYear">昨年</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-[18px]">expand_more</span>
                  </div>
                </div>

                <div className="bg-surface border border-border-subtle rounded-sm overflow-hidden">
                  {isLoadingHistory ? (
                    <div className="p-12 pl-6 pr-6 text-center text-text-muted">
                      <span className="material-symbols-outlined animate-spin text-2xl mb-2 text-primary">sync</span>
                      <p>注文履歴を読み込み中...</p>
                    </div>
                  ) : filteredOrderHistory.length === 0 ? (
                    <div className="p-12 text-center text-text-muted">
                      まだ注文履歴がありません。
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface-highlight text-text-muted text-xs uppercase font-mono border-b border-border-subtle">
                        <tr>
                          <th className="px-6 py-4 font-medium">注文ID</th>
                          <th className="px-6 py-4 font-medium">発注日</th>
                          <th className="px-6 py-4 font-medium">商品点数</th>
                          <th className="px-6 py-4 font-medium">ステータス / 配送情報</th>
                          <th className="px-6 py-4 font-medium text-right">請求額</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {filteredOrderHistory.map(order => {
                           const items = JSON.parse(order.items || "[]");
                           const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                           return (
                            <tr key={order.id} className="hover:bg-black/5 transition-colors">
                              <td className="px-6 py-4 font-mono text-text-main font-bold">{order.orderId}</td>
                              <td className="px-6 py-4 text-text-muted font-mono">{new Date(order.createdAt).toLocaleDateString('ja-JP')}</td>
                              <td className="px-6 py-4 text-text-main">{totalItems}点</td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 items-start">
                                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${order.status === '処理中' ? 'bg-primary/10 text-primary border-primary/20' : order.status === '発送済' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-accent-green/10 text-accent-green border-accent-green/20'}`}>
                                    {order.status || '処理中'}
                                  </span>
                                  {order.shippingInfo && (
                                    <span className="text-[11px] text-text-muted bg-black/5 px-2 py-0.5 rounded flex items-center gap-1 mt-1">
                                      <span className="material-symbols-outlined text-[12px]">local_shipping</span>
                                      {order.shippingInfo}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-text-main font-bold text-primary">¥{(order.totalAmount || 0).toLocaleString()}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}


          </div>
        </div>

        {/* Order Confirmation Modal */}
        {isConfirmingOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-text-main/20 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-border-subtle w-full max-w-md rounded-sm shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-border-subtle bg-background-main">
                <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">gavel</span>
                  発注内容の最終確認
                </h3>
              </div>
              <div className="p-6">
                <p className="text-text-main text-sm mb-4">
                  以下の内容で発注を確定します。<br/>よろしいでしょうか？
                </p>
                <div className="bg-black/5 p-4 rounded-sm mb-6 border border-border-subtle">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-text-muted">合計点数:</span>
                    <span className="font-bold text-text-main">{getCartTotalQuantity()} 点</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">合計金額 (税込):</span>
                    <span className="font-bold text-text-main">¥{Math.floor(getCartTotalPrice() * 1.1).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsConfirmingOrder(false)}
                    className="flex-1 py-3 text-sm font-bold text-text-main bg-surface-highlight border border-border-subtle rounded-sm hover:bg-black/5 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button 
                    onClick={placeOrder}
                    className="flex-1 py-3 text-sm font-bold text-background-main bg-primary rounded-sm hover:bg-primary-dim transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    確定する
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-8 right-8 bg-background-main/95 border border-border-subtle border-l-4 border-l-accent-green text-text-main px-6 py-4 rounded-sm shadow-2xl z-50 flex items-center gap-3 animate-fade-in">
            <span className="material-symbols-outlined text-accent-green text-xl">check_circle</span>
            <span className="text-sm font-medium tracking-wide">{toastMessage}</span>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
