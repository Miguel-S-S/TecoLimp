import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  FlaskConical, 
  ShoppingBag, 
  Receipt, 
  BarChart3, 
  Plus, 
  Search, 
  X, 
  Edit3, 
  Trash2, 
  Settings, 
  Share2, 
  Phone
} from 'lucide-react';
import { supabase } from './supabaseClient';

const CATEGORIAS_JUMA = [
  'Todas', 
  'Líquidos', 
  'Polvos y Aditivos', 
  'Papelería y Descartables', 
  'Artículos de Limpieza'
];

export default function App() {
  const [activeTab, setActiveTab] = useState('stock');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cargar datos desde Supabase
  const fetchData = async () => {
    try {
      const [resProd, resSales, resExp] = await Promise.all([
        supabase.from('products').select('*').order('id', { ascending: false }),
        supabase.from('sales').select('*').order('id', { ascending: false }),
        supabase.from('expenses').select('*').order('id', { ascending: false })
      ]);

      if (resProd.data) setProducts(resProd.data);
      if (resSales.data) setSales(resSales.data);
      if (resExp.data) setExpenses(resExp.data);
    } catch (err) {
      console.error('Error al conectar con Supabase:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- STOCK ---
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [prodType, setProdType] = useState('Directo');
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Líquidos');
  const [prodUnit, setProdUnit] = useState('Litros');
  const [prodStock, setProdStock] = useState(0);
  const [prodCost, setProdCost] = useState(0);
  const [prodPrice, setProdPrice] = useState('');
  const [searchStock, setSearchStock] = useState('');
  const [filterCategoryStock, setFilterCategoryStock] = useState('Todas');

  const openCreateModal = () => {
    setEditingProductId(null);
    setProdType('Directo');
    setProdName('');
    setProdCategory('Líquidos');
    setProdUnit('Litros');
    setProdStock(0);
    setProdCost(0);
    setProdPrice('');
    setShowProductModal(true);
  };

  const openEditModal = (p) => {
    setEditingProductId(p.id);
    setProdType(p.type);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdUnit(p.unit);
    setProdStock(p.stock);
    setProdCost(p.cost);
    setProdPrice(p.price);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const payload = { 
      type: prodType, 
      name: prodName, 
      category: prodCategory, 
      unit: prodUnit, 
      stock: Number(prodStock), 
      cost: Number(prodCost), 
      price: Number(prodPrice || 0) 
    };

    if (editingProductId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProductId);
      if (!error) triggerToast('Producto actualizado en Supabase');
    } else {
      const { error } = await supabase.from('products').insert([payload]);
      if (!error) triggerToast('Nuevo producto guardado en Supabase');
    }
    setShowProductModal(false);
    fetchData();
  };

  const handleDeleteProduct = async (id) => {
    if (confirm('¿Eliminar producto?')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        triggerToast('Producto eliminado');
        fetchData();
      }
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchName = p.name.toLowerCase().includes(searchStock.toLowerCase());
      const matchCat = filterCategoryStock === 'Todas' || p.category === filterCategoryStock;
      return matchName && matchCat;
    });
  }, [products, searchStock, filterCategoryStock]);

  const totalStockUnits = useMemo(() => products.reduce((acc, p) => acc + Number(p.stock), 0), [products]);

  // --- PREPARADOS ---
  const [prepMode, setPrepMode] = useState('nuevo');
  const [prepName, setPrepName] = useState('');
  const [prepCategory, setPrepCategory] = useState('Líquidos');
  const [prepPrice, setPrepPrice] = useState('');
  const [prepQty, setPrepQty] = useState(10);
  const [selectedExistProd, setSelectedExistProd] = useState('');

  const handleFabricateSubmit = async (e) => {
    e.preventDefault();
    if (prepMode === 'nuevo') {
      const payload = { 
        type: 'Preparado', 
        name: prepName, 
        category: prepCategory, 
        unit: 'Litros', 
        stock: Number(prepQty), 
        cost: 0, 
        price: Number(prepPrice || 0) 
      };
      await supabase.from('products').insert([payload]);
      triggerToast(`Preparado "${prepName}" creado`);
      setPrepName('');
    } else {
      const targetP = products.find(p => p.id === Number(selectedExistProd));
      if (!targetP) return alert('Seleccioná un producto');
      const newStock = Number(targetP.stock) + Number(prepQty);
      await supabase.from('products').update({ stock: newStock }).eq('id', targetP.id);
      triggerToast(`Stock sumado a ${targetP.name}`);
    }
    fetchData();
  };

  // --- VENDER ---
  const [posSubTab, setPosSubTab] = useState('vender');
  const [customerName, setCustomerName] = useState('');
  const [cart, setCart] = useState([]);
  const [searchPos, setSearchPos] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState('Efectivo');

  const addToCart = (p) => {
    setCart(prev => {
      const exist = prev.find(i => i.id === p.id);
      if (exist) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const cartTotal = useMemo(() => cart.reduce((acc, i) => acc + (i.price * i.qty), 0), [cart]);

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    const salePayload = { 
      customer: customerName.trim() || 'Cliente Anónimo', 
      total: cartTotal, 
      method: posPaymentMethod, 
      items: cart 
    };

    const { error } = await supabase.from('sales').insert([salePayload]);
    if (error) return alert('Error al registrar venta');

    for (const item of cart) {
      const currentStock = products.find(p => p.id === item.id)?.stock || 0;
      const updatedStock = Math.max(0, currentStock - item.qty);
      await supabase.from('products').update({ stock: updatedStock }).eq('id', item.id);
    }

    setCart([]);
    setCustomerName('');
    triggerToast('¡Venta registrada en Supabase!');
    fetchData();
  };

  const filteredPosProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchPos.toLowerCase()) && p.price > 0);
  }, [products, searchPos]);

  // --- GASTOS ---
  const [expenseCat, setExpenseCat] = useState('Materia Prima y Químicos');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseSupplier, setExpenseSupplier] = useState('');
  const [isStockExpense, setIsStockExpense] = useState(false);
  const [expenseMethod, setExpenseMethod] = useState('Efectivo');
  const [searchExpense, setSearchExpense] = useState('');

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseAmount) return;
    const payload = { 
      category: expenseCat, 
      description: expenseDesc || expenseCat, 
      amount: Number(expenseAmount), 
      supplier: expenseSupplier, 
      is_stock_item: isStockExpense, 
      method: expenseMethod 
    };
    await supabase.from('expenses').insert([payload]);
    setExpenseAmount('');
    setExpenseDesc('');
    setExpenseSupplier('');
    setIsStockExpense(false);
    triggerToast('Gasto guardado');
    fetchData();
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(g => (g.description + ' ' + g.category).toLowerCase().includes(searchExpense.toLowerCase()));
  }, [expenses, searchExpense]);

  const totalExpensesAmount = useMemo(() => filteredExpenses.reduce((acc, g) => acc + g.amount, 0), [filteredExpenses]);

  // --- REPORTES ---
  const totalSalesAmount = useMemo(() => sales.reduce((a, s) => a + s.total, 0), [sales]);
  const netProfit = totalSalesAmount - totalExpensesAmount;
  const salesCash = useMemo(() => sales.filter(s => s.method === 'Efectivo').reduce((a, s) => a + s.total, 0), [sales]);
  const salesTransf = useMemo(() => sales.filter(s => s.method === 'Transferencia').reduce((a, s) => a + s.total, 0), [sales]);

  const generateWhatsAppReport = () => {
    const text = `Hola! Resumen JUMA:\n- Ventas: $${totalSalesAmount}\n- Gastos: $${totalExpensesAmount}\n- Ganancia Limpia: $${netProfit}`;
    navigator.clipboard.writeText(text);
    triggerToast('¡Resumen copiado para WhatsApp!');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start p-0 sm:p-4 text-slate-800 font-sans antialiased">
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[880px] sm:max-h-[920px] sm:rounded-3xl border border-slate-200 shadow-xl flex flex-col overflow-hidden relative">

        <header className="bg-gradient-to-r from-[#0100A3] to-[#0100FD] text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#0100FD] flex items-center justify-center font-black text-xl shadow-md">🇦🇷</div>
            <div>
              <h1 className="font-black text-base tracking-wide flex items-center gap-1.5">
                JUMA <span className="text-[10px] bg-sky-500/30 px-2 py-0.5 rounded-full font-bold">Cloud</span>
              </h1>
              <p className="text-[11px] text-sky-200 flex items-center gap-1">
                <Phone className="w-3 h-3"/> 3794409908 • Supabase DB
              </p>
            </div>
          </div>
          <button onClick={() => triggerToast('Sincronizado con Supabase')} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white">
            <Settings className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 pb-24">

          {/* STOCK */}
          {activeTab === 'stock' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="text-xs font-bold text-slate-700">{totalStockUnits} u. en stock</span>
                </div>
                <span className="text-xs font-extrabold text-[#0100FD] bg-blue-50 px-2.5 py-1 rounded-lg">DB Activa</span>
              </div>

              <button onClick={openCreateModal} className="w-full bg-[#0100FD] hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition">
                <Plus className="w-5 h-5" /> Nuevo Producto
              </button>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input type="text" placeholder="Buscar producto..." value={searchStock} onChange={e => setSearchStock(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm" />
              </div>

              <select value={filterCategoryStock} onChange={e => setFilterCategoryStock(e.target.value)} className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-semibold text-slate-700">
                {CATEGORIAS_JUMA.map(cat => <option key={cat} value={cat}>Categoría: {cat}</option>)}
              </select>

              <div className="space-y-2.5">
                {filteredProducts.map(p => (
                  <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-50 text-[#0100FD] rounded-md">{p.category}</span>
                      <h4 className="font-bold text-sm text-slate-800 mt-1">{p.name}</h4>
                      <p className="text-xs text-slate-500">Stock: {p.stock} {p.unit} | Venta: <span className="font-semibold text-emerald-600">${p.price}</span></p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditModal(p)} className="p-2 text-slate-400 hover:text-[#0100FD]"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PREPARADOS */}
          {activeTab === 'preparados' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
              <h3 className="font-bold text-slate-800 text-sm">ELABORACIÓN DE PREPARADOS</h3>
              <div className="flex gap-2">
                <button onClick={()=>setPrepMode('nuevo')} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${prepMode==='nuevo'?'bg-[#0100FD] text-white':'bg-white text-slate-600'}`}>Nuevo</button>
                <button onClick={()=>setPrepMode('existente')} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${prepMode==='existente'?'bg-[#0100FD] text-white':'bg-white text-slate-600'}`}>Sumar Stock</button>
              </div>
              <form onSubmit={handleFabricateSubmit} className="space-y-3">
                {prepMode === 'nuevo' ? (
                  <>
                    <input type="text" placeholder="Nombre" value={prepName} onChange={e=>setPrepName(e.target.value)} required className="w-full border p-2.5 rounded-xl text-sm" />
                    <input type="number" placeholder="Precio ($)" value={prepPrice} onChange={e=>setPrepPrice(e.target.value)} required className="w-full border p-2.5 rounded-xl text-sm" />
                  </>
                ) : (
                  <select value={selectedExistProd} onChange={e=>setSelectedExistProd(e.target.value)} required className="w-full border p-2.5 rounded-xl text-xs">
                    <option value="">-- Elegir producto --</option>
                    {products.map(p=><option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                  </select>
                )}
                <input type="number" value={prepQty} onChange={e=>setPrepQty(e.target.value)} required className="w-full border p-2.5 rounded-xl text-sm" />
                <button type="submit" className="w-full bg-[#0100FD] text-white py-3 rounded-xl font-bold">Guardar</button>
              </form>
            </div>
          )}

          {/* VENDER */}
          {activeTab === 'vender' && (
            <div className="space-y-4">
              <input type="text" placeholder="Cliente (opcional)" value={customerName} onChange={e=>setCustomerName(e.target.value)} className="w-full border p-3 rounded-xl text-sm bg-white" />
              <div className="bg-white p-4 rounded-2xl border space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs font-bold uppercase">Carrito</span>
                  <span className="text-sm font-extrabold text-[#0100FD]">${cartTotal}</span>
                </div>
                {cart.map(i => (
                  <div key={i.id} className="text-xs flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                    <span>{i.name} x{i.qty}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">${i.price * i.qty}</span>
                      <button onClick={() => removeFromCart(i.id)} className="text-rose-500"><X className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                ))}
                {cart.length > 0 && (
                  <>
                    <div className="flex gap-2">
                      {['Efectivo', 'Transferencia'].map(m => (
                        <button key={m} onClick={() => setPosPaymentMethod(m)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${posPaymentMethod === m ? 'bg-[#0100FD] text-white' : 'bg-slate-100 text-slate-600'}`}>{m}</button>
                      ))}
                    </div>
                    <button onClick={handleCompleteSale} className="w-full bg-[#0100FD] text-white py-3 rounded-xl font-bold">Cobrar Venta</button>
                  </>
                )}
              </div>
              <input type="text" placeholder="Buscar producto..." value={searchPos} onChange={e => setSearchPos(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm bg-white" />
              <div className="space-y-2">
                {filteredPosProducts.map(p => (
                  <div key={p.id} onClick={()=>addToCart(p)} className="bg-white p-3 rounded-2xl border flex justify-between items-center cursor-pointer">
                    <span>{p.name}</span>
                    <span className="font-extrabold text-[#0100FD]">${p.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GASTOS */}
          {activeTab === 'gastos' && (
            <form onSubmit={handleSaveExpense} className="bg-white border rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-sm">Cargar Gasto</h3>
              <input type="text" placeholder="Descripción" value={expenseDesc} onChange={e=>setExpenseDesc(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm" />
              <input type="number" placeholder="Monto ($)" value={expenseAmount} onChange={e=>setExpenseAmount(e.target.value)} required className="w-full border p-2.5 rounded-xl text-sm" />
              <button type="submit" className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold">Guardar Gasto</button>
            </form>
          )}

          {/* REPORTES */}
          {activeTab === 'reportes' && (
            <div className="space-y-4">
              <div className="bg-white border rounded-2xl p-5 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Ganancia Limpia</span>
                <h2 className="text-3xl font-black">${netProfit}</h2>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                  <div><span className="text-[10px] text-slate-400 block font-bold">VENTAS</span><span className="font-bold text-emerald-600">${totalSalesAmount}</span></div>
                  <div><span className="text-[10px] text-slate-400 block font-bold">GASTOS</span><span className="font-bold text-rose-600">-${totalExpensesAmount}</span></div>
                </div>
              </div>
              <button onClick={generateWhatsAppReport} className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4"/> Compartir Resumen x WhatsApp
              </button>
            </div>
          )}

        </main>

        {/* MODAL NUEVO PRODUCTO */}
        {showProductModal && (
          <div className="absolute inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold">Nuevo Producto</h3>
                <button onClick={()=>setShowProductModal(false)}><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleSaveProduct} className="space-y-3">
                <input type="text" placeholder="Nombre" value={prodName} onChange={e=>setProdName(e.target.value)} required className="w-full border p-2.5 rounded-xl text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Stock" value={prodStock} onChange={e=>setProdStock(e.target.value)} className="border p-2.5 rounded-xl text-sm" />
                  <input type="number" placeholder="Precio ($)" value={prodPrice} onChange={e=>setProdPrice(e.target.value)} className="border p-2.5 rounded-xl text-sm" />
                </div>
                <button type="submit" className="w-full bg-[#0100FD] text-white py-3 rounded-xl font-bold">Guardar</button>
              </form>
            </div>
          </div>
        )}

        {/* BOTTOM NAV BAR */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around z-30">
          <button onClick={()=>setActiveTab('stock')} className={`flex flex-col items-center p-2 ${activeTab==='stock'?'text-[#0100FD] font-bold':'text-slate-400'}`}>
            <Package className="w-5 h-5"/><span className="text-[10px]">Stock</span>
          </button>
          <button onClick={()=>setActiveTab('preparados')} className={`flex flex-col items-center p-2 ${activeTab==='preparados'?'text-[#0100FD] font-bold':'text-slate-400'}`}>
            <FlaskConical className="w-5 h-5"/><span className="text-[10px]">Preparados</span>
          </button>
          <button onClick={()=>setActiveTab('vender')} className={`flex flex-col items-center p-2 ${activeTab==='vender'?'text-[#0100FD] font-bold':'text-slate-400'}`}>
            <ShoppingBag className="w-5 h-5"/><span className="text-[10px]">Vender</span>
          </button>
          <button onClick={()=>setActiveTab('gastos')} className={`flex flex-col items-center p-2 ${activeTab==='gastos'?'text-[#0100FD] font-bold':'text-slate-400'}`}>
            <Receipt className="w-5 h-5"/><span className="text-[10px]">Gastos</span>
          </button>
          <button onClick={()=>setActiveTab('reportes')} className={`flex flex-col items-center p-2 ${activeTab==='reportes'?'text-[#0100FD] font-bold':'text-slate-400'}`}>
            <BarChart3 className="w-5 h-5"/><span className="text-[10px]">Reportes</span>
          </button>
        </nav>

        {toastMessage && <div className="absolute top-16 left-4 right-4 bg-slate-900 text-white text-xs py-2.5 px-4 rounded-xl z-50 text-center">{toastMessage}</div>}
      </div>
    </div>
  );
}