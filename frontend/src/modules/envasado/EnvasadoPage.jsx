import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { previstoEnvasado, crearEnvasado, anularEnvasado, listarConsumosEnvasado } from '../../services/envasadoService';
import { listarUbicaciones } from '../../services/inventarioService';

const dinero = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (n) => Number(n).toLocaleString('es-AR', { maximumFractionDigits: 4 });
const fecha = (d) => (d ? new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('es-AR') : '—');
const ESTILOS = { confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-200', anulada: 'bg-slate-100 text-slate-500 border-slate-300' };
const COMPONENTES = { granel: 'Producto a granel', envase: 'Envase', tapa: 'Tapa', etiqueta: 'Etiqueta' };
const inp = 'w-full border p-2.5 rounded-xl text-sm';
const lbl = 'text-[11px] font-semibold text-slate-500 block mb-1';

function NuevoEnvasado({ presentaciones, onClose, onCreado }) {
  const [f, setF] = useState({ presentacion_id: '', unidades: '', granel_real: '', adicionales: '', ubicacion_id: '', codigo_lote: '', notas: '' });
  const [previsto, setPrevisto] = useState([]);
  const [error, setError] = useState(null);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const set = (c) => (e) => setF((x) => ({ ...x, [c]: e.target.value }));

  useEffect(() => { listarUbicaciones().then((u) => setUbicaciones(u.filter((x) => x.estado === 'activo'))).catch(() => {}); }, []);

  // vista previa de consumos: se recalcula al cambiar presentación, unidades o granel real
  useEffect(() => {
    const unidades = Number(f.unidades);
    if (!f.presentacion_id || !Number.isInteger(unidades) || unidades <= 0) { setPrevisto([]); setError(null); return undefined; }
    const t = setTimeout(() => {
      previstoEnvasado(f.presentacion_id, unidades, f.granel_real === '' ? null : Number(f.granel_real))
        .then((r) => { setPrevisto(r); setError(null); }).catch((e) => { setPrevisto([]); setError(e.message); });
    }, 300);
    return () => clearTimeout(t);
  }, [f.presentacion_id, f.unidades, f.granel_real]);

  const faltantes = previsto.filter((p) => Number(p.faltante) > 0);
  const costoEst = previsto.reduce((t, p) => t + Number(p.costo_estimado), 0) + Number(f.adicionales || 0);
  const unidades = Number(f.unidades);

  const confirmar = async (e) => {
    e.preventDefault();
    if (!confirm('Se van a descontar el granel, los envases, tapas y etiquetas, y se generará el lote de la presentación. ¿Confirmar el envasado?')) return;
    setGuardando(true);
    try {
      await crearEnvasado({
        presentacion_id: f.presentacion_id, cantidad_unidades: unidades,
        granel_real: f.granel_real === '' ? null : Number(f.granel_real), costos_adicionales: Number(f.adicionales || 0),
        ubicacion_id: f.ubicacion_id || null, codigo_lote: f.codigo_lote || null, notas: f.notas,
      });
      onCreado('Envasado confirmado: lote generado');
    } catch (err) { alert(err.message); } finally { setGuardando(false); }
  };

  return (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 max-h-full overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-800">Nuevo envasado</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={confirmar} className="space-y-3">
          <div><label className={lbl}>Presentación</label>
            <select required className={inp + ' bg-white'} value={f.presentacion_id} onChange={set('presentacion_id')}>
              <option value="">-- Elegir --</option>
              {presentaciones.filter((p) => p.estado === 'activo').map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Unidades a envasar</label><input required type="number" min="1" step="1" className={inp} value={f.unidades} onChange={set('unidades')} placeholder="Ej: 20" /></div>
            <div><label className={lbl}>Granel realmente usado (opc.)</label><input type="number" min="0" step="any" className={inp} value={f.granel_real} onChange={set('granel_real')} placeholder="Si hubo merma" /></div>
          </div>

          {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</p>}
          {previsto.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Se va a consumir</h4>
              {previsto.map((p) => {
                const falta = Number(p.faltante) > 0;
                return (
                  <div key={p.componente} className={`border rounded-xl p-3 text-xs flex justify-between gap-3 ${falta ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`}>
                    <div><p className="font-bold text-slate-800">{COMPONENTES[p.componente]}: {p.articulo_nombre}</p>
                      <p className="text-slate-500">{num(p.cantidad)} {p.unidad_codigo} • Disponible: {num(p.stock_disponible)}</p>
                      {falta && <p className="text-rose-600 font-bold">Faltan {num(p.faltante)} {p.unidad_codigo}</p>}</div>
                    <p className="text-slate-500 shrink-0">{dinero(p.costo_estimado)}</p>
                  </div>
                );
              })}
              <p className="text-xs text-slate-500">Costo estimado: <strong>{dinero(costoEst)}</strong> ({dinero(costoEst / unidades)} por unidad). Se genera 1 lote de {unidades} unidades; el costo real se calcula al confirmar.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Costos adicionales $</label><input type="number" min="0" step="any" className={inp} value={f.adicionales} onChange={set('adicionales')} placeholder="Mano de obra, etc." /></div>
            <div><label className={lbl}>Ubicación</label>
              <select className={inp + ' bg-white'} value={f.ubicacion_id} onChange={set('ubicacion_id')}><option value="">Depósito principal</option>{ubicaciones.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}</select></div>
            <div><label className={lbl}>Código de lote (opc.)</label><input className={inp} value={f.codigo_lote} onChange={set('codigo_lote')} placeholder="Automático" /></div>
            <div><label className={lbl}>Notas (opc.)</label><input className={inp} value={f.notas} onChange={set('notas')} /></div>
          </div>
          <button type="submit" disabled={guardando || faltantes.length > 0 || previsto.length === 0} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-40 text-white py-3.5 rounded-xl font-bold transition">
            {guardando ? 'Procesando…' : faltantes.length > 0 ? 'Falta stock para envasar' : 'Confirmar envasado'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Detalle({ orden, onClose, onCambio }) {
  const [consumos, setConsumos] = useState([]);
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => { listarConsumosEnvasado(orden.id).then(setConsumos).catch((e) => alert(e.message)); }, [orden.id]);

  const anular = async () => {
    setOcupado(true);
    try { await anularEnvasado(orden.id, motivo); onCambio('Envasado anulado'); } catch (err) { alert(err.message); } finally { setOcupado(false); }
  };

  return (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 max-h-full overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-800">Envasado N° {orden.numero}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-0.5">
          <p className="font-bold text-slate-800 text-sm">{num(orden.cantidad_unidades)} × {orden.presentacion_nombre}</p>
          <p className="text-slate-500">{fecha(orden.created_at)} • <span className="font-bold">{orden.estado}</span> • Lote generado {orden.lote_codigo}{orden.fecha_vencimiento ? ` (vence ${fecha(orden.fecha_vencimiento)})` : ''}</p>
          <p className="text-slate-500">Granel: teórico {num(orden.granel_teorico)} • usado {num(orden.granel_consumido)} {orden.granel_unidad}</p>
          {orden.notas && <p className="text-slate-500">Notas: {orden.notas}</p>}
          {orden.estado === 'anulada' && <p className="text-rose-600">Anulado: {orden.motivo_anulacion}</p>}
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Trazabilidad: lotes de origen</h4>
          {consumos.map((c) => <p key={c.id} className="text-xs text-slate-500">{COMPONENTES[c.componente]} • {c.articulo_nombre} • Lote {c.codigo_lote} • {num(c.cantidad)} {c.unidad_codigo} × {dinero(c.costo_unitario)}</p>)}
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm space-y-1">
          {[['Granel', orden.costo_granel], ['Envases', orden.costo_envase], ['Tapas', orden.costo_tapa], ['Etiquetas', orden.costo_etiqueta], ['Adicionales', orden.costos_adicionales]]
            .map(([t, v]) => <div key={t} className="flex justify-between text-slate-600"><span>{t}</span><span>{dinero(v)}</span></div>)}
          <div className="flex justify-between text-slate-600"><span>Costo total</span><span>{dinero(orden.costo_total)}</span></div>
          <div className="flex justify-between font-black text-slate-900 pt-1 border-t"><span>Costo real por unidad</span><span>{dinero(orden.costo_unitario)}</span></div>
        </div>
        {orden.estado === 'confirmada' && !anulando && <button onClick={() => setAnulando(true)} className="w-full bg-white border border-rose-300 text-rose-600 py-3 rounded-xl font-bold text-sm">Anular envasado</button>}
        {anulando && (
          <div className="space-y-2 border border-rose-200 rounded-2xl p-3">
            <p className="text-xs text-slate-500">Se devuelven el granel y los insumos a sus lotes con movimientos inversos. Solo es posible si el lote envasado no se vendió ni se ajustó.</p>
            <input className={inp} placeholder="Motivo (obligatorio)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setAnulando(false)} className="bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-sm">Cancelar</button>
              <button disabled={ocupado || !motivo.trim()} onClick={anular} className="bg-rose-600 disabled:opacity-40 text-white py-2.5 rounded-xl font-bold text-sm">Confirmar anulación</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EnvasadoPage({ ordenes, presentaciones, recargar, toast }) {
  const [nuevo, setNuevo] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const mes = new Date().toISOString().slice(0, 7);
  const delMes = ordenes.filter((o) => o.estado === 'confirmada' && o.created_at.startsWith(mes));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white border border-slate-200 rounded-2xl p-3"><p className="text-[10px] uppercase font-bold text-slate-400">Envasados del mes</p><p className="font-black text-sm text-slate-800">{delMes.length}</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3"><p className="text-[10px] uppercase font-bold text-slate-400">Unidades envasadas</p><p className="font-black text-sm text-slate-800">{num(delMes.reduce((t, o) => t + Number(o.cantidad_unidades), 0))}</p></div>
      </div>
      <button onClick={() => setNuevo(true)} className="w-full bg-[#0100FD] hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition">
        <Plus className="w-5 h-5" /> Nuevo envasado
      </button>
      {presentaciones.length === 0 && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">Primero creá una presentación en la pestaña Presentaciones.</p>}
      {ordenes.length === 0 && <p className="text-xs text-slate-400 text-center py-8 bg-white rounded-2xl border">Todavía no hay envasados.</p>}
      <div className="space-y-2">
        {ordenes.map((o) => (
          <button key={o.id} onClick={() => setDetalle(o)} className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition">
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-800 truncate">N° {o.numero} • {num(o.cantidad_unidades)} × {o.presentacion_nombre}</p>
              <p className="text-xs text-slate-500">{fecha(o.created_at)} • Lote {o.lote_codigo} • {num(o.granel_consumido)} {o.granel_unidad} de granel</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-black text-sm text-slate-900">{dinero(o.costo_unitario)}/u</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${ESTILOS[o.estado]}`}>{o.estado}</span>
            </div>
          </button>
        ))}
      </div>
      {nuevo && <NuevoEnvasado presentaciones={presentaciones} onClose={() => setNuevo(false)} onCreado={async (m) => { setNuevo(false); toast(m); await recargar(); }} />}
      {detalle && <Detalle orden={detalle} onClose={() => setDetalle(null)} onCambio={async (m) => { setDetalle(null); toast(m); await recargar(); }} />}
    </div>
  );
}
