import { useState, useEffect, useRef } from 'react'
import productsDataFromJson from './data/products.json'
import Login from './components/Login'
import Admin from './components/Admin'
import { fetchProducts, createOrder } from './services/microcms'
import { useAuth } from './context/AuthContext'

function App() {
  const { currentUser, logout } = useAuth()
  const [appMode, setAppMode] = useState('login')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [products, setProducts] = useState(productsDataFromJson)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const toastTimer = useRef(null)
  // Check localStorage for existing cart
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('bigrock_b2b_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [orderHistory, setOrderHistory] = useState([
    { id: 'ORD-3921', date: '2023/10/22', items: 3, total: 128000, status: '発送済' },
    { id: 'ORD-3920', date: '2023/10/20', items: 1, total: 45000, status: '完了' }
  ])

  const addToCart = (product, variant) => {
    setCart(prevCart => {
      const cartItemId = variant ? `${product.id}_${variant.id}` : product.id;
      const existingItem = prevCart.find(item => item.cartItemId === cartItemId)
      if (existingItem) {
        return prevCart.map(item =>
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prevCart, { ...product, cartItemId, variantId: variant?.id, variantName: variant?.name, quantity: 1 }]
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
        customerEmail: "b2b-client@example.com", // TODO: Replace with real user email when Auth is added
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

    setOrderHistory([newOrder, ...orderHistory])
    setCart([])
    setActiveTab('history')
  }

  useEffect(() => {
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

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      setAppMode('login')
    } else if (appMode === 'login') {
      setAppMode('store')
    }
  }, [currentUser, appMode])

  if (appMode === 'login') {
    return <Login />
  }

  if (appMode === 'admin') {
    return <Admin products={products} onExitAdmin={() => setAppMode('store')} />
  }

  return (
    <div className="flex h-screen bg-[#111113] text-white">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface border-r border-border-subtle flex flex-col shrink-0 z-20">
        {/* Logo Area */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border-subtle">
          <div className="size-8 bg-primary rounded-sm flex items-center justify-center text-background-dark font-bold">
            <span className="material-symbols-outlined text-xl">landscape</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-white text-base font-bold tracking-wide leading-none">BIG ROCK</h1>
            <p className="text-text-muted text-[10px] font-mono leading-none mt-1 tracking-wider">PROCUREMENT HUB</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-1">
          {/* Dashboard Item */}
          <button
            className={`group flex items-center w-full gap-3 px-6 py-3 transition-colors ${activeTab === 'dashboard' ? 'bg-white/5 border-l-2 border-primary text-primary' : 'border-l-2 border-transparent text-text-muted hover:text-white hover:bg-white/5'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm font-bold tracking-wide">ダッシュボード</span>
          </button>

          {/* Catalog Item */}
          <button
            className={`group flex items-center w-full gap-3 px-6 py-3 transition-colors ${activeTab === 'catalog' ? 'bg-white/5 border-l-2 border-primary text-primary' : 'border-l-2 border-transparent text-text-muted hover:text-white hover:bg-white/5'}`}
            onClick={() => setActiveTab('catalog')}
          >
            <span className="material-symbols-outlined">inventory_2</span>
            <span className="text-sm font-medium">製品カタログ</span>
          </button>

          <button
            className={`group flex items-center w-full gap-3 px-6 py-3 transition-colors ${activeTab === 'history' ? 'bg-white/5 border-l-2 border-primary text-primary' : 'border-l-2 border-transparent text-text-muted hover:text-white hover:bg-white/5'}`}
            onClick={() => setActiveTab('history')}
          >
            <span className="material-symbols-outlined">history</span>
            <span className="text-sm font-medium">注文履歴</span>
          </button>
        </nav>
        {/* Admin Link (Test) */}
        <div className="px-4 pb-2">
          <button
            onClick={() => setAppMode('admin')}
            className="w-full py-2 px-3 flex items-center gap-2 justify-center text-xs font-bold text-background-dark bg-primary hover:bg-white transition-colors uppercase tracking-wider shadow-[0_0_10px_rgba(242,201,76,0.2)]"
          >
            <span className="material-symbols-outlined text-[16px]">settings_applications</span>
            <span>管理者メニューへ</span>
          </button>
        </div>

        {/* User Profile / Footer */}
        <div className="p-4 border-t border-border-subtle">
          <div className="flex items-center gap-3 p-2 rounded-sm bg-white/5 border border-border-subtle">
            <div className="size-8 rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${currentUser?.photoURL || '/src/assets/avatar.png'}')` }}></div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-bold text-white truncate">{currentUser?.displayName || 'USER'}</span>
              <span className="text-[10px] text-text-muted truncate">{currentUser?.email || 'B2B Client'}</span>
            </div>
            <button
              onClick={() => logout()}
              className="text-text-muted hover:text-white transition-colors"
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
        <header className="h-16 flex items-center justify-between px-8 border-b border-border-subtle bg-background-dark/80 backdrop-blur-sm z-10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide uppercase">{activeTab}</h2>
            <p className="text-xs text-text-muted font-mono">{new Date().toLocaleDateString('ja-JP').replace(/\//g, '.')} // SYSTEM ONLINE</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-surface border border-border-subtle">
              <div className="size-2 rounded-full bg-accent-green animate-pulse"></div>
              <span className="text-xs font-mono text-text-muted">API: CONNECTED</span>
            </div>
            <button className="flex items-center justify-center size-9 rounded-sm border border-border-subtle text-text-muted hover:text-primary hover:border-primary transition-all">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content Grid */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
          <div className="max-w-7xl mx-auto h-full">

            {/* --- DASHBOARD VIEW --- */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Center/Main Column */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  {/* KPI Cards Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-surface border border-border-subtle p-5 rounded-sm flex flex-col justify-between group hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <span className="text-text-muted text-xs font-bold uppercase tracking-wider">今月の支出</span>
                        <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors">payments</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold text-white font-mono tracking-tight">¥450,000</span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] text-accent-green font-mono bg-accent-green/10 px-1 rounded-sm">+12%</span>
                          <span className="text-[10px] text-text-muted">vs last month</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface border border-border-subtle p-5 rounded-sm flex flex-col justify-between group hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <span className="text-text-muted text-xs font-bold uppercase tracking-wider">進行中の注文</span>
                        <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors">local_shipping</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold text-white font-mono tracking-tight">12<span className="text-sm ml-1 text-text-muted">件</span></span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] text-primary font-mono bg-primary/10 px-1 rounded-sm">Processing</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface border border-border-subtle p-5 rounded-sm flex flex-col justify-between group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setActiveTab('cart')}>
                      <div className="flex justify-between items-start">
                        <span className="text-text-muted text-xs font-bold uppercase tracking-wider">カート</span>
                        <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors">shopping_cart</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold text-white font-mono tracking-tight">{getCartTotalQuantity()}<span className="text-sm ml-1 text-text-muted">点</span></span>
                        <div className="flex items-center gap-1 mt-1">
                          <button className="text-[10px] text-primary underline decoration-primary/50 hover:decoration-primary" onClick={(e) => { e.stopPropagation(); setActiveTab('cart'); }}>確認する →</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Budget Meter & Recent Orders */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                    <div className="bg-surface border border-border-subtle rounded-sm p-6 flex flex-col items-center justify-center relative min-h-[320px]">
                      <h3 className="absolute top-6 left-6 text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span className="size-2 bg-primary rounded-full"></span>
                        今月の予算使用率
                      </h3>
                      <div className="relative size-48">
                        <svg className="size-full" viewBox="0 0 100 100">
                          <circle className="text-border-subtle stroke-current" cx="50" cy="50" fill="transparent" r="42" strokeWidth="8"></circle>
                          <circle className="text-primary stroke-current" cx="50" cy="50" fill="transparent" r="42" strokeDasharray="264" strokeDashoffset="145" strokeLinecap="butt" strokeWidth="8"></circle>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-white font-mono">45%</span>
                          <span className="text-[10px] text-text-muted uppercase tracking-widest mt-1">USED</span>
                        </div>
                      </div>
                      <div className="w-full mt-6 grid grid-cols-2 gap-4 border-t border-border-subtle pt-4">
                        <div>
                          <p className="text-[10px] text-text-muted uppercase tracking-wider">SPENT</p>
                          <p className="text-lg font-mono text-white">¥450,000</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-text-muted uppercase tracking-wider">LIMIT</p>
                          <p className="text-lg font-mono text-text-muted">¥1,000,000</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface border border-border-subtle rounded-sm flex flex-col min-h-[320px]">
                      <div className="p-5 border-b border-border-subtle flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">最近の注文</h3>
                        <a className="text-xs text-primary hover:text-white transition-colors" href="#">すべて見る</a>
                      </div>
                      <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-surface-highlight text-text-muted text-xs uppercase font-mono border-b border-border-subtle">
                            <tr>
                              <th className="px-5 py-3 font-medium">ID</th>
                              <th className="px-5 py-3 font-medium">Date</th>
                              <th className="px-5 py-3 font-medium">Status</th>
                              <th className="px-5 py-3 font-medium text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle">
                            {orderHistory.slice(0, 3).map(order => (
                              <tr key={order.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setActiveTab('history')}>
                                <td className="px-5 py-3 font-mono text-white group-hover:text-primary">#{order.id}</td>
                                <td className="px-5 py-3 text-text-muted font-mono text-xs">{order.date}</td>
                                <td className="px-5 py-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${order.status === '処理中' ? 'bg-primary/10 text-primary border-primary/20' : order.status === '発送済' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-accent-green/10 text-accent-green border-accent-green/20'}`}>{order.status}</span>
                                </td>
                                <td className="px-5 py-3 text-right font-mono text-text-main">¥{order.total.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (Sidebar Extras) */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">クイックアクセス</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Component Quick Links */}
                      <a className="group relative bg-surface border border-border-subtle p-4 rounded-sm hover:-translate-y-1 hover:border-primary transition-all duration-200" href="#">
                        <div className="size-10 rounded bg-white/5 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                          <span className="material-symbols-outlined text-white group-hover:text-primary">directions_bike</span>
                        </div>
                        <p className="text-sm font-bold text-white">フレーム</p>
                      </a>
                      <a className="group relative bg-surface border border-border-subtle p-4 rounded-sm hover:-translate-y-1 hover:border-primary transition-all duration-200" href="#">
                        <div className="size-10 rounded bg-white/5 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                          <span className="material-symbols-outlined text-white group-hover:text-primary">settings</span>
                        </div>
                        <p className="text-sm font-bold text-white">パーツ</p>
                      </a>
                    </div>
                  </div>

                  {/* Alerts */}
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">アラート</h3>
                    </div>
                    <div className="bg-surface border border-accent-red/40 rounded-sm p-4 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-accent-red/10 rounded-bl-full -mr-8 -mt-8 z-0"></div>
                      <div className="relative z-10">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-accent-red/10 rounded-sm text-accent-red shrink-0">
                            <span className="material-symbols-outlined text-lg">warning</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">在庫切れ間近</p>
                            <p className="text-xs text-text-muted mt-1 leading-snug">BR-HND-V2<br />SKYLINE V2 Handlebar</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] font-mono text-accent-red">残り: {products.find(p => p.sku === 'BR-HND-V2')?.stock || 0} units</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- CART VIEW --- */}
            {activeTab === 'cart' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-2xl">shopping_cart</span>
                    現在のカート
                  </h3>
                  <div className="text-right">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">合計金額</p>
                    <p className="text-2xl font-mono text-white">¥{getCartTotalPrice().toLocaleString()}</p>
                  </div>
                </div>

                {cart.length === 0 ? (
                  <div className="bg-surface border border-border-subtle rounded-sm p-12 flex flex-col items-center justify-center text-center mt-8">
                    <span className="material-symbols-outlined text-text-muted text-4xl mb-4">shopping_cart</span>
                    <h4 className="text-lg font-bold text-white mb-2">カートは空です</h4>
                    <p className="text-sm text-text-muted mb-6">カタログから商品を追加してください。</p>
                    <button onClick={() => setActiveTab('catalog')} className="bg-primary text-background-dark font-bold px-6 py-2 rounded-sm hover:bg-primary-dim transition-colors">
                      カタログを見る
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 flex flex-col gap-4">
                      {cart.map(item => (
                        <div key={item.cartItemId} className="bg-surface border border-border-subtle p-4 rounded-sm flex items-center gap-4 group">
                          <div className="size-16 bg-white/5 rounded-sm overflow-hidden flex items-center justify-center shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            ) : (
                              <span className="material-symbols-outlined text-text-muted text-2xl group-hover:text-primary transition-colors">
                                {item.category === 'Frame' ? 'directions_bike' : item.category === 'Accessory' ? 'hardware' : 'settings'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-sm">{item.sku}</span>
                              {item.variantName && (
                                <span className="text-[10px] font-mono text-text-muted border border-border-subtle px-1.5 py-0.5 rounded-sm">{item.variantName}</span>
                              )}
                              <span className="text-xs font-mono text-text-muted">¥{item.price.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 bg-background-dark border border-border-subtle rounded-sm p-1 shrink-0">
                            <button onClick={() => updateCartItemQuantity(item.cartItemId, -1)} className="size-6 flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 rounded-sm transition-colors">
                              <span className="material-symbols-outlined text-sm">remove</span>
                            </button>
                            <span className="text-sm font-mono w-6 text-center text-white">{item.quantity}</span>
                            <button onClick={() => updateCartItemQuantity(item.cartItemId, 1)} className="size-6 flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 rounded-sm transition-colors">
                              <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                          </div>

                          <div className="w-24 text-right shrink-0">
                            <p className="text-sm font-bold text-white font-mono">¥{(item.price * item.quantity).toLocaleString()}</p>
                          </div>

                          <button onClick={() => removeFromCart(item.cartItemId)} className="size-8 flex items-center justify-center text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-sm transition-colors shrink-0">
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="lg:col-span-1">
                      <div className="bg-surface border border-border-subtle rounded-sm p-6 sticky top-0">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">注文サマリー</h4>

                        <div className="flex flex-col gap-3 text-sm mb-6">
                          <div className="flex justify-between text-text-muted">
                            <span>商品小計 ({getCartTotalQuantity()}点)</span>
                            <span className="font-mono text-white">¥{getCartTotalPrice().toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-text-muted">
                            <span>消費税 (10%)</span>
                            <span className="font-mono text-white">¥{Math.floor(getCartTotalPrice() * 0.1).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-border-subtle">
                            <span className="text-white">合計</span>
                            <span className="font-mono text-primary">¥{Math.floor(getCartTotalPrice() * 1.1).toLocaleString()}</span>
                          </div>
                        </div>

                        <button onClick={placeOrder} className="w-full bg-primary text-background-dark font-bold py-3 rounded-sm hover:bg-primary-dim transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                          <span className="material-symbols-outlined">send</span>
                          発注を実行する
                        </button>

                        <p className="text-[10px] text-text-muted text-center mt-4">
                          発注を確定すると、登録メールアドレスに確認が送信されます。
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- CATALOG VIEW --- */}
            {activeTab === 'catalog' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-surface border border-border-subtle rounded-sm flex flex-col group hover:border-primary/50 transition-colors overflow-hidden">
                    {/* Thumbnail Image */}
                    <div className="h-40 w-full bg-background-dark relative border-b border-border-subtle overflow-hidden">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider bg-background-dark/80 backdrop-blur-sm px-2 py-1 rounded-sm text-text-muted border border-white/10">
                          {product.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-base font-bold text-white mb-2 leading-tight">{product.name}</h3>
                      <div className="flex items-center gap-2 mb-4">
                        <p className="text-xs font-mono text-primary/80 bg-primary/10 inline-block w-fit px-1.5 py-0.5 rounded-sm border border-primary/20">{product.sku}</p>
                        <p className="text-sm font-bold font-mono text-text-main">¥{product.price.toLocaleString()}</p>
                      </div>

                      <div className="mt-auto pt-4 border-t border-border-subtle flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-text-muted uppercase">Variants</span>
                          <span className="text-xs font-mono text-white">
                            {product.variants?.length || 0} Options
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setSelectedProduct(product); setActiveTab('productDetail'); }} className="text-xs bg-surface-highlight border border-border-subtle text-white font-bold px-4 py-2 rounded-sm hover:border-primary hover:text-primary transition-colors flex items-center gap-1 group-hover:bg-primary/10">
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
                  <button onClick={() => setActiveTab('catalog')} className="flex items-center justify-center size-10 rounded-sm border border-border-subtle text-text-muted hover:text-white hover:border-white transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
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
                    <div className="bg-background-dark border border-border-subtle rounded-sm aspect-video overflow-hidden relative group">
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background-dark to-transparent h-1/2 opacity-60"></div>
                      <div className="absolute inset-4 top-auto flex justify-between items-end">
                        <h2 className="text-2xl font-bold text-white drop-shadow-md">{selectedProduct.name}</h2>
                        <a href={selectedProduct.originalUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-medium text-white bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full hover:bg-primary hover:text-background-dark transition-colors border border-white/20">
                          公式サイト <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </a>
                      </div>
                    </div>

                    <div className="bg-surface border border-border-subtle p-6 rounded-sm">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2 border-b border-border-subtle pb-2">Description</h4>
                      <p className="text-sm text-text-muted leading-relaxed">
                        {selectedProduct.description}
                      </p>
                      <div className="mt-6 pt-4 border-t border-border-subtle">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Base Price</p>
                        <p className="text-2xl font-mono font-bold text-white">¥{selectedProduct.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Variants List */}
                  <div className="flex flex-col gap-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">バリエーション選択 ({selectedProduct.variants?.length || 0})</h4>

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
                            <tr key={variant.id} className="hover:bg-white/5 transition-colors group">
                              <td className="px-5 py-4 font-bold text-white text-sm">{variant.name}</td>
                              <td className="px-5 py-4 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border ${variant.stock > 5 ? 'bg-accent-green/10 text-accent-green border-accent-green/20' : variant.stock > 0 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-text-muted/10 text-text-muted border-border-subtle'}`}>
                                  {variant.stock > 0 ? `${variant.stock} units` : 'Out of Stock'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <button
                                  onClick={() => {
                                    addToCart(selectedProduct, variant)
                                    // Optionally show a toast or feedback here
                                  }}
                                  disabled={variant.stock === 0}
                                  className={`text-xs font-bold px-4 py-2 rounded-sm transition-colors flex items-center gap-1 ml-auto shadow-sm ${variant.stock > 0 ? 'bg-primary text-background-dark hover:bg-primary-dim shadow-primary/20' : 'bg-surface-highlight text-text-muted cursor-not-allowed border border-border-subtle'}`}
                                >
                                  {variant.stock > 0 ? (
                                    <>カートに追加 <span className="material-symbols-outlined text-sm">add_shopping_cart</span></>
                                  ) : (
                                    <>在庫なし <span className="material-symbols-outlined text-sm">block</span></>
                                  )}
                                </button>
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
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-2xl">history</span>
                    注文履歴
                  </h3>
                </div>

                <div className="bg-surface border border-border-subtle rounded-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-highlight text-text-muted text-xs uppercase font-mono border-b border-border-subtle">
                      <tr>
                        <th className="px-6 py-4 font-medium">注文ID</th>
                        <th className="px-6 py-4 font-medium">発注日</th>
                        <th className="px-6 py-4 font-medium">商品点数</th>
                        <th className="px-6 py-4 font-medium">ステータス</th>
                        <th className="px-6 py-4 font-medium text-right">請求額</th>
                        <th className="px-6 py-4 font-medium text-center">アクション</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {orderHistory.map(order => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-mono text-white font-bold">#{order.id}</td>
                          <td className="px-6 py-4 text-text-muted font-mono">{order.date}</td>
                          <td className="px-6 py-4 text-text-main">{order.items}点</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${order.status === '処理中' ? 'bg-primary/10 text-primary border-primary/20' : order.status === '発送済' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-accent-green/10 text-accent-green border-accent-green/20'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-text-main font-bold">¥{order.total.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                            <button className="text-primary hover:text-white transition-colors border border-border-subtle px-3 py-1 rounded-sm text-xs">
                              詳細
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-8 right-8 bg-background-dark/95 border border-border-subtle border-l-4 border-l-accent-green text-white px-6 py-4 rounded-sm shadow-2xl z-50 flex items-center gap-3 animate-fade-in">
            <span className="material-symbols-outlined text-accent-green text-xl">check_circle</span>
            <span className="text-sm font-medium tracking-wide">{toastMessage}</span>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
