import React, { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { movimientoManual, revertirMovimiento } from '../../services/cajaService';

const dinero = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fechaHora = (iso) => new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
const inp = 'w-full border p-2.5 rounded-xl text-sm';
const lbl = 'text-[11px] font-semibold text-slate-500 block mb-1';

export default function MovimientosCajaPage({ movimientos, sesiones, medios, recargar, toast }) {
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('Todos');
  const [medio, setMedio] = useState('Todos');
  const [sesion, setSesion] = useState('Todas');
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const abierta = sesiones.find((s) => s.estado === 'abierta');
  const activos = medios.filter((m) => m.activo);

  const visibles = useMemo(() => movimientos.filter((m) =>
    (tipo === 'Todos' || m.tipo === tipo) && (medio === 'Todos' || m.medio_pago_id === medio)
    && (sesion === 'Todas' || (sesion === 'sin' ? !m.sesion_id : m.sesion_id === sesion))
    && ((m.concepto || '') + ' ' + (m.descripcion || '')).toLowerCase().includes(busqueda.toLowerCase())), [movimientos, busqueda, tipo, medio, sesion]);

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try { await movimientoManual({ ...form, monto: Number(form.monto) }); toast('Movimiento registrado'); setForm(null); await recargar(); }
    catch (err) { alert(err.message); } finally { setGuardando(false); }
  };

  const revertir = async (m) => {
    const motivo = prompt('Motivo de la reversión:');
    if (!motivo || !motivo.trim()) return;
    try { await revertirMovimiento(m.id, motivo); toast('Movimiento revertido'); await recargar(); } catch (err) { alert(err.message); }
  };

  return (
    <div className="space-y-4">
      <button disabled={!abierta} onClick={() => setForm({ tipo: 'egreso', medio_pago_id: activos[0]?.id || '', monto: '', descripcion: '', usuario: '' })}
        className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition">
        <Plus className="w-5 h-5" /> Ingreso o egreso manual
      </button>
      {!abierta && <p className="text-[11px] text-slate-400 -mt-2">Abrí la caja para registrar movimientos manuales.</p>}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input type="text" placeholder="Buscar por concepto o descripción..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm" />
        </div>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-semibold text-slate-700"><option value="Todos">Tipo: Todos</option><option value="ingreso">Ingresos</option><option value="egreso">Egresos</option></select>
        <select value={medio} onChange={(e) => setMedio(e.target.value)} className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-semibold text-slate-700"><option value="Todos">Medio: Todos</option>{medios.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}</select>
        <select value={sesion} onChange={(e) => setSesion(e.target.value)} className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-semibold text-slate-700"><option value="Todas">Caja: Todas</option><option value="sin">Sin caja abierta</option>{sesiones.map((s) => <option key={s.id} value={s.id}>Caja N° {s.numero}</option>)}</select>
      </div>
      <p className="text-[11px] text-slate-400">Se muestran los últimos 300 movimientos. No se modifican ni se borran: las correcciones se hacen con un movimiento inverso.</p>

      {visibles.length === 0 && <p className="text-xs text-slate-400 text-center py-8 bg-white rounded-2xl border">No hay movimientos para mostrar.</p>}
      <div className="space-y-2">
        {visibles.map((m) => (
          <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between gap-3 text-xs">
            <div className="min-w-0">
              <p className="font-bold text-slate-800">{m.concepto} <span className="font-normal text-slate-400">• {m.medio_pago}</span></p>
              {m.descripcion && <p className="text-slate-500 truncate">{m.descripcion}</p>}
              <p className="text-[10px] text-slate-400 mt-0.5">{fechaHora(m.fecha)} • {m.sesion_numero ? `Caja N° ${m.sesion_numero}` : 'Sin caja abierta'}{m.usuario ? ` • ${m.usuario}` : ''}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-black text-sm ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>{m.tipo === 'ingreso' ? '+' : '−'}{dinero(m.monto)}</p>
              {m.origen_tipo === 'manual' && !m.revertido && <button onClick={() => revertir(m)} className="text-[10px] font-bold text-slate-400 hover:text-rose-500">Revertir</button>}
              {m.revertido && <span className="text-[10px] text-slate-400">Revertido</span>}
            </div>
          </div>
        ))}
      </div>

      {form && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800">Movimiento manual</h3>
              <button onClick={() => setForm(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardar} className="space-y-3">
              <div className="flex gap-2">
                {[['ingreso', 'Ingreso'], ['egreso', 'Egreso']].map(([v, l]) => (
                  <button type="button" key={v} onClick={() => setForm({ ...form, tipo: v })} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${form.tipo === v ? (v === 'ingreso' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white') : 'bg-white text-slate-600'}`}>{l}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Medio de pago</label><select className={inp + ' bg-white'} value={form.medio_pago_id} onChange={(e) => setForm({ ...form, medio_pago_id: e.target.value })}>{activos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}</select></div>
                <div><label className={lbl}>Monto $</label><input required type="number" min="0" step="any" className={inp} value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} /></div>
              </div>
              <div><label className={lbl}>Motivo (obligatorio)</label><input required className={inp} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej: retiro del dueño, cambio, pago a proveedor" /></div>
              <div><label className={lbl}>Registrado por (opcional)</label><input className={inp} value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} /></div>
              <p className="text-[11px] text-slate-400">Para pagos de mercadería a proveedores, registralo acá como egreso manual con el motivo.</p>
              <button type="submit" disabled={guardando} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition">{guardando ? 'Guardando…' : 'Registrar movimiento'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
