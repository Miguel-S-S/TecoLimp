import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { listarMovimientosCaja } from '../../services/cajaService';

const dinero = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fechaHora = (iso) => new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
const colorDif = (d) => (Math.abs(Number(d)) < 0.005 ? 'text-emerald-600' : Number(d) < 0 ? 'text-rose-600' : 'text-amber-600');

function Detalle({ sesion, onClose }) {
  const [movs, setMovs] = useState([]);
  useEffect(() => { listarMovimientosCaja({ sesionId: sesion.id, limite: 500 }).then(setMovs).catch((e) => alert(e.message)); }, [sesion.id]);
  return (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 max-h-full overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-800">Caja N° {sesion.numero}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-0.5">
          <p className="text-slate-500">Abrió {fechaHora(sesion.abierta_at)}{sesion.abierta_por ? ` (${sesion.abierta_por})` : ''} • Efectivo inicial {dinero(sesion.monto_inicial)}</p>
          <p className="text-slate-500">Cerró {fechaHora(sesion.cerrada_at)}{sesion.cerrada_por ? ` (${sesion.cerrada_por})` : ''}</p>
          {sesion.notas && <p className="text-slate-500">Notas: {sesion.notas}</p>}
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm space-y-1">
          <div className="flex justify-between text-slate-600"><span>Efectivo esperado</span><span>{dinero(sesion.efectivo_esperado)}</span></div>
          <div className="flex justify-between text-slate-600"><span>Efectivo contado</span><span>{dinero(sesion.efectivo_contado)}</span></div>
          <div className={`flex justify-between font-black pt-1 border-t ${colorDif(sesion.diferencia)}`}><span>Diferencia</span><span>{dinero(sesion.diferencia)}</span></div>
        </div>
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Por medio de pago</h4>
          {(sesion.resumen || []).map((r) => (
            <div key={r.medio} className="flex justify-between text-xs border border-slate-200 rounded-lg px-3 py-2">
              <span className="font-bold text-slate-700">{r.medio}</span><span className="text-slate-500">+{dinero(r.ingresos)} / −{dinero(r.egresos)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Movimientos ({movs.length})</h4>
          {movs.map((m) => (
            <div key={m.id} className="flex justify-between text-xs border border-slate-100 rounded-lg px-3 py-1.5">
              <span className="text-slate-600 truncate">{m.concepto} • {m.medio_pago}{m.descripcion ? ` • ${m.descripcion}` : ''}</span>
              <span className={`font-bold shrink-0 ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>{m.tipo === 'ingreso' ? '+' : '−'}{dinero(m.monto)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HistorialCajaPage({ sesiones }) {
  const [abierta, setAbierta] = useState(null);
  const cerradas = sesiones.filter((s) => s.estado === 'cerrada');
  return (
    <div className="space-y-3">
      {cerradas.length === 0 && <p className="text-xs text-slate-400 text-center py-8 bg-white rounded-2xl border">Todavía no hay cajas cerradas.</p>}
      {cerradas.map((s) => (
        <button key={s.id} onClick={() => setAbierta(s)} className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition">
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-800">Caja N° {s.numero}</p>
            <p className="text-xs text-slate-500">{fechaHora(s.abierta_at)} → {fechaHora(s.cerrada_at)}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-500">Esperado {dinero(s.efectivo_esperado)} • Contado {dinero(s.efectivo_contado)}</p>
            <p className={`font-black text-sm ${colorDif(s.diferencia)}`}>{Math.abs(Number(s.diferencia)) < 0.005 ? 'Justa' : `Diferencia ${dinero(s.diferencia)}`}</p>
          </div>
        </button>
      ))}
      {abierta && <Detalle sesion={abierta} onClose={() => setAbierta(null)} />}
    </div>
  );
}
