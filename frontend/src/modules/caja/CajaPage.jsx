import React, { useState } from 'react';
import { X } from 'lucide-react';
import { abrirCaja, cerrarCaja } from '../../services/cajaService';
import { guardarParametro } from '../../services/ventasService';

const dinero = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fechaHora = (iso) => new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
const inp = 'w-full border p-2.5 rounded-xl text-sm';
const lbl = 'text-[11px] font-semibold text-slate-500 block mb-1';

export default function CajaPage({ sesiones, totales, parametros, sinCaja, recargar, toast }) {
  const abierta = sesiones.find((s) => s.estado === 'abierta');
  const ultima = sesiones.find((s) => s.estado === 'cerrada');
  const [inicial, setInicial] = useState('');
  const [usuario, setUsuario] = useState('');
  const [notas, setNotas] = useState('');
  const [cierre, setCierre] = useState(null); // { contado, usuario, notas }
  const [ocupado, setOcupado] = useState(false);
  const obligatoria = parametros.caja_obligatoria === '1';

  const abrir = async (e) => {
    e.preventDefault();
    setOcupado(true);
    try { await abrirCaja({ monto_inicial: Number(inicial || 0), usuario, notas }); toast('Caja abierta'); setInicial(''); setNotas(''); await recargar(); }
    catch (err) { alert(err.message); } finally { setOcupado(false); }
  };

  const cerrar = async (e) => {
    e.preventDefault();
    if (cierre.contado === '') return alert('Indicá el efectivo contado');
    setOcupado(true);
    try { await cerrarCaja({ efectivo_contado: Number(cierre.contado), usuario: cierre.usuario, notas: cierre.notas }); toast('Caja cerrada'); setCierre(null); await recargar(); }
    catch (err) { alert(err.message); } finally { setOcupado(false); }
  };

  const alternarObligatoria = async () => {
    try { await guardarParametro('caja_obligatoria', obligatoria ? 0 : 1); await recargar(); toast(obligatoria ? 'La caja ya no es obligatoria' : 'Ahora hace falta caja abierta para cobrar y registrar gastos'); }
    catch (err) { alert(err.message); }
  };

  const dif = cierre && cierre.contado !== '' ? Number(cierre.contado) - Number(abierta.efectivo_esperado) : null;

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {sinCaja > 0 && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">Hay {sinCaja} movimientos registrados sin caja abierta (cobros o gastos). Se ven en la sección Movimientos.</p>}

      {!abierta ? (
        <form onSubmit={abrir} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span><h3 className="font-bold text-sm uppercase tracking-wide">Caja cerrada</h3></div>
          {ultima && <p className="text-xs text-slate-500">Último cierre: caja N° {ultima.numero}, {fechaHora(ultima.cerrada_at)} • diferencia {dinero(ultima.diferencia)}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Efectivo inicial (cambio) $</label><input type="number" min="0" step="any" className={inp} value={inicial} onChange={(e) => setInicial(e.target.value)} placeholder="0" /></div>
            <div><label className={lbl}>Abre (nombre)</label><input className={inp} value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Opcional" /></div>
          </div>
          <input className={inp} placeholder="Notas (opcional)" value={notas} onChange={(e) => setNotas(e.target.value)} />
          <button type="submit" disabled={ocupado} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition">{ocupado ? 'Abriendo…' : 'Abrir caja'}</button>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <h3 className="font-bold text-sm uppercase tracking-wide">Caja N° {abierta.numero} abierta</h3></div>
            <p className="text-xs text-slate-500">Desde {fechaHora(abierta.abierta_at)}{abierta.abierta_por ? ` • ${abierta.abierta_por}` : ''} • Efectivo inicial {dinero(abierta.monto_inicial)}</p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-[10px] uppercase font-bold text-slate-400">Efectivo que debería haber en caja</p>
              <p className="text-3xl font-black text-slate-900">{dinero(abierta.efectivo_esperado)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3"><p className="text-[10px] uppercase font-bold text-emerald-700">Ingresos</p><p className="font-black text-emerald-700">{dinero(abierta.ingresos)}</p></div>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3"><p className="text-[10px] uppercase font-bold text-rose-700">Egresos</p><p className="font-black text-rose-700">{dinero(abierta.egresos)}</p></div>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Por medio de pago</h4>
              {totales.length === 0 && <p className="text-xs text-slate-400">Todavía no hay movimientos en esta caja.</p>}
              {totales.map((t) => (
                <div key={t.medio_pago_id} className="flex justify-between text-xs border border-slate-200 rounded-lg px-3 py-2">
                  <span className="font-bold text-slate-700">{t.medio_pago}</span>
                  <span className="text-slate-500">+{dinero(t.ingresos)} / −{dinero(t.egresos)} = <strong className="text-slate-800">{dinero(Number(t.ingresos) - Number(t.egresos))}</strong></span>
                </div>
              ))}
              <p className="text-[11px] text-slate-400">El efectivo esperado suma el inicial y los movimientos de medios de tipo efectivo. Las transferencias y tarjetas no pasan por el cajón.</p>
            </div>
            <button onClick={() => setCierre({ contado: '', usuario: '', notas: '' })} className="w-full bg-white border border-[#0100FD] text-[#0100FD] hover:bg-blue-50 py-3 rounded-xl font-bold text-sm transition">Cerrar caja</button>
          </div>
        </div>
      )}

      <label className="flex items-start gap-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-2xl p-4">
        <input type="checkbox" className="mt-0.5" checked={obligatoria} onChange={alternarObligatoria} />
        <span><strong>Exigir caja abierta</strong> para registrar cobros de ventas y gastos. Si está desactivado, se pueden registrar igual y los movimientos quedan "sin caja".</span>
      </label>

      {cierre && abierta && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800">Cerrar caja N° {abierta.numero}</h3>
              <button onClick={() => setCierre(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={cerrar} className="space-y-3">
              <p className="text-xs text-slate-500">Contá el efectivo que hay en el cajón (incluido el cambio inicial) e ingresalo.</p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between text-sm"><span className="text-slate-500">Esperado</span><strong>{dinero(abierta.efectivo_esperado)}</strong></div>
              <div><label className={lbl}>Efectivo contado $</label><input autoFocus required type="number" min="0" step="any" className={inp} value={cierre.contado} onChange={(e) => setCierre({ ...cierre, contado: e.target.value })} /></div>
              {dif !== null && (
                <p className={`text-sm font-bold rounded-xl p-3 border ${Math.abs(dif) < 0.005 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : dif < 0 ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                  {Math.abs(dif) < 0.005 ? 'La caja cierra justa' : dif < 0 ? `Faltan ${dinero(Math.abs(dif))}` : `Sobran ${dinero(dif)}`}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Cierra (nombre)</label><input className={inp} value={cierre.usuario} onChange={(e) => setCierre({ ...cierre, usuario: e.target.value })} placeholder="Opcional" /></div>
                <div><label className={lbl}>Notas</label><input className={inp} value={cierre.notas} onChange={(e) => setCierre({ ...cierre, notas: e.target.value })} placeholder="Opcional" /></div>
              </div>
              <button type="submit" disabled={ocupado} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition">{ocupado ? 'Cerrando…' : 'Confirmar cierre'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
