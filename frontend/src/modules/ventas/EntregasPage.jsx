import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { cambiarEstadoEntrega } from '../../services/ventasService';

const dinero = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fecha = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('es-AR') : 'Sin fecha');
const ESTILOS = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200', en_camino: 'bg-blue-50 text-blue-700 border-blue-200',
  entregada: 'bg-emerald-50 text-emerald-700 border-emerald-200', cancelada: 'bg-slate-100 text-slate-500 border-slate-300',
};
const ETIQUETAS = { pendiente: 'Pendiente', en_camino: 'En camino', entregada: 'Entregada', cancelada: 'Cancelada' };

export default function EntregasPage({ entregas, recargar, toast }) {
  const [filtro, setFiltro] = useState('activas');
  const [ocupado, setOcupado] = useState(null);

  const visibles = entregas.filter((e) => e.estado_venta === 'confirmada' && (filtro === 'Todas'
    || (filtro === 'activas' ? ['pendiente', 'en_camino'].includes(e.estado) : e.estado === filtro)));
  const pendientes = entregas.filter((e) => e.estado_venta === 'confirmada' && ['pendiente', 'en_camino'].includes(e.estado)).length;

  const cambiar = async (e, estado) => {
    if (estado === 'cancelada' && !confirm('¿Cancelar esta entrega? La venta sigue vigente.')) return;
    const obs = estado === 'entregada' ? (prompt('Observaciones de la entrega (opcional):') ?? '') : null;
    setOcupado(e.id);
    try { await cambiarEstadoEntrega(e.id, estado, obs); toast('Entrega actualizada'); await recargar(); } catch (err) { alert(err.message); } finally { setOcupado(null); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3"><p className="text-[10px] uppercase font-bold text-amber-700">Entregas por hacer</p><p className="font-black text-sm text-amber-700">{pendientes}</p></div>
      <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="w-full sm:w-auto bg-white border border-slate-200 p-3 rounded-xl text-xs font-semibold text-slate-700">
        <option value="activas">Por hacer (pendientes y en camino)</option><option value="Todas">Todas</option>
        {Object.entries(ETIQUETAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      {visibles.length === 0 && <p className="text-xs text-slate-400 text-center py-8 bg-white rounded-2xl border">No hay entregas para mostrar. Se crean al registrar una venta con envío.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibles.map((e) => (
          <div key={e.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0"><h4 className="font-bold text-sm text-slate-800 truncate">Venta N° {e.venta_numero} • {e.cliente_nombre}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> {e.direccion}</p></div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${ESTILOS[e.estado]}`}>{ETIQUETAS[e.estado]}</span>
            </div>
            <p className="text-xs text-slate-500">{fecha(e.fecha_prevista)}{e.horario_preferido ? ` • ${e.horario_preferido}` : ''} • Envío {dinero(e.costo_envio)} • Total {dinero(e.total)} ({e.estado_pago})</p>
            {e.observaciones && <p className="text-[11px] text-slate-400">{e.observaciones}</p>}
            {['pendiente', 'en_camino'].includes(e.estado) && (
              <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                {e.estado === 'pendiente' && <button disabled={ocupado === e.id} onClick={() => cambiar(e, 'en_camino')} className="text-xs font-bold text-blue-700 px-3 py-1.5 rounded-lg bg-blue-50">En camino</button>}
                <button disabled={ocupado === e.id} onClick={() => cambiar(e, 'entregada')} className="text-xs font-bold text-emerald-700 px-3 py-1.5 rounded-lg bg-emerald-50">Entregada</button>
                <button disabled={ocupado === e.id} onClick={() => cambiar(e, 'cancelada')} className="text-xs font-bold text-rose-600 px-3 py-1.5 rounded-lg bg-rose-50">Cancelar</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
