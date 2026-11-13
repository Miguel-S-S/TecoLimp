import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { listarMovimientos } from '../../services/inventarioService';

export const TIPOS_MOVIMIENTO = ['Compra', 'RegaloProveedor', 'ConsumoProduccion', 'Produccion', 'Envasado',
  'Venta', 'AjustePositivo', 'AjusteNegativo', 'Devolucion'];

const fechaHora = (iso) => new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

export function ListaMovimientos({ movimientos }) {
  if (movimientos.length === 0) {
    return <p className="text-xs text-slate-400 text-center py-8 bg-white rounded-2xl border">No hay movimientos para mostrar.</p>;
  }
  return (
    <div className="space-y-2">
      {movimientos.map((m) => (
        <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between gap-3 text-xs">
          <div className="min-w-0">
            <p className="font-bold text-slate-800 truncate">{m.articulo_nombre}</p>
            <p className="text-slate-500">
              {m.tipo}{m.codigo_lote ? ` • Lote ${m.codigo_lote}` : ''}
              {m.referencia_tipo === 'venta' ? ` • Venta #${m.referencia_id}` : ''}
            </p>
            {m.nota && <p className="text-slate-400 truncate">{m.nota}</p>}
            <p className="text-[10px] text-slate-400 mt-0.5">{fechaHora(m.created_at)}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`font-black text-sm ${m.signo > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {m.signo > 0 ? '+' : '−'}{Number(m.cantidad)} {m.unidad_codigo}
            </p>
            <p className="text-[10px] text-slate-400">Stock: {Number(m.stock_resultante)}</p>
            {m.costo_unitario != null && <p className="text-[10px] text-slate-400">Costo ${Number(m.costo_unitario)}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('Todos');

  const cargar = async () => {
    setCargando(true);
    try {
      setMovimientos(await listarMovimientos({ limite: 300 }));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };
  useEffect(() => { cargar(); }, []);

  const visibles = useMemo(() => movimientos.filter((m) =>
    (tipo === 'Todos' || m.tipo === tipo) &&
    (m.articulo_nombre + ' ' + (m.codigo_lote || '')).toLowerCase().includes(busqueda.toLowerCase())),
  [movimientos, busqueda, tipo]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input type="text" placeholder="Buscar por artículo o lote..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm" />
        </div>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-semibold text-slate-700">
          <option value="Todos">Tipo: Todos</option>
          {TIPOS_MOVIMIENTO.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={cargar} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 rounded-xl flex items-center justify-center" title="Actualizar"><RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} /></button>
      </div>
      {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</p>}
      <p className="text-[11px] text-slate-400">Se muestran los últimos 300 movimientos. Los movimientos confirmados no se pueden modificar: las correcciones se hacen con un ajuste.</p>
      <ListaMovimientos movimientos={visibles} />
    </div>
  );
}
