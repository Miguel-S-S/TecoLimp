import React, { useState, useEffect, useCallback } from 'react';
import { Package, FlaskConical, ShoppingBag, BarChart3, Settings, Phone, Users, Receipt } from 'lucide-react';
import { supabase } from './supabaseClient';
import useArticulos from './hooks/useArticulos';
import StockPage from './modules/stock/StockPage';
import PreparadosPage from './modules/preparados/PreparadosPage';
import VenderPage from './modules/ventas/VenderPage';
import ClientesPage from './modules/clientes/ClientesPage';
import GastosPage from './modules/gastos/GastosPage';
import ReportesPage from './modules/reportes/ReportesPage';

const nav = [
  { id: 'stock', label: 'Stock', icon: Package },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'preparados', label: 'Preparados', icon: FlaskConical },
  { id: 'vender', label: 'Vender', icon: ShoppingBag },
  { id: 'gastos', label: 'Gastos', icon: Receipt },
  { id: 'reportes', label: 'Reportes', icon: BarChart3 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('stock');
  const [toastMessage, setToastMessage] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const { articulos, categorias, unidades, error: errorCatalogo, recargar: recargarCatalogo } = useArticulos();

  const toast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const recargarOperativo = useCallback(async () => {
    try {
      const [s, e, c] = await Promise.all([
        supabase.from('sales').select('*').order('id', { ascending: false }),
        supabase.from('expenses').select('*').order('id', { ascending: false }),
        supabase.from('clientes').select('*').order('id', { ascending: false }),
      ]);
      if (s.data) setVentas(s.data);
      if (e.data) setGastos(e.data);
      if (c.data) setClientes(c.data);
    } catch (err) {
      console.error('Error al conectar con Supabase:', err);
    }
  }, []);

  useEffect(() => { recargarOperativo(); }, [recargarOperativo]);

  const recargarTodo = useCallback(async () => {
    await Promise.all([recargarCatalogo(), recargarOperativo()]);
  }, [recargarCatalogo, recargarOperativo]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start p-0 sm:p-6 text-slate-800 font-sans antialiased">
      {/* Contenedor principal estructurado estrictamente en columna flex */}
      <div className="w-full max-w-md sm:max-w-4xl bg-white h-screen sm:h-[90vh] sm:rounded-3xl border border-slate-200 shadow-xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <header className="bg-gradient-to-r from-[#0100A3] to-[#0100FD] text-white px-5 py-4 flex items-center justify-between z-20 shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#0100FD] flex items-center justify-center font-black text-xl shadow-md">🇦🇷</div>
            <div>
              <h1 className="font-black text-base tracking-wide flex items-center gap-1.5">
                JUMA <span className="text-[10px] bg-sky-500/30 px-2 py-0.5 rounded-full font-bold">Cloud</span>
              </h1>
              <p className="text-[11px] text-sky-200 flex items-center gap-1"><Phone className="w-3 h-3" /> 3794409908 • Supabase DB</p>
            </div>
          </div>
          <button onClick={async () => { await recargarTodo(); toast('Sincronizado con Supabase'); }} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white">
            <Settings className="w-5 h-5" />
          </button>
        </header>

        {/* Main con flex-1 y overflow-y-auto para que el scroll ocurra exclusivamente aquí dentro */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {errorCatalogo && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3">
              No se pudo cargar el catálogo: {errorCatalogo}. Verificá que la migración de la Etapa 1 esté aplicada.
            </div>
          )}
          {activeTab === 'stock' && <StockPage articulos={articulos} categorias={categorias} unidades={unidades} recargar={recargarCatalogo} toast={toast} />}
          {activeTab === 'clientes' && <ClientesPage clientes={clientes} recargar={recargarOperativo} toast={toast} />}
          {activeTab === 'preparados' && <PreparadosPage articulos={articulos} recargar={recargarCatalogo} toast={toast} />}
          {activeTab === 'vender' && <VenderPage articulos={articulos} clientes={clientes} recargar={recargarTodo} toast={toast} />}
          {activeTab === 'gastos' && <GastosPage gastos={gastos} recargar={recargarOperativo} toast={toast} />}
          {activeTab === 'reportes' && <ReportesPage ventas={ventas} gastos={gastos} toast={toast} />}
        </main>

        {/* Barra de navegación fija pero integrada al flujo flex como shrink-0 (nunca flotante absolute que tape contenido) */}
        <nav className="bg-white border-t border-slate-200 px-2 py-2.5 flex justify-around items-center z-30 shadow-lg shrink-0">
          {nav.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`flex flex-col items-center p-2 rounded-xl transition ${activeTab === id ? 'text-[#0100FD] font-bold bg-blue-50/85' : 'text-slate-400 hover:text-slate-600'}`}>
              <Icon className="w-5 h-5" /><span className="text-[10px] mt-0.5">{label}</span>
            </button>
          ))}
        </nav>

        {toastMessage && (
          <div className="absolute top-16 left-4 right-4 bg-slate-900 text-white text-xs py-2.5 px-4 rounded-xl z-50 text-center shadow-lg">{toastMessage}</div>
        )}
      </div>
    </div>
  );
}