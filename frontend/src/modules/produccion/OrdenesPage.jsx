import React, { useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { crearOrden, confirmarOrden, anularOrden, listarOrdenes, listarPrevistos, listarConsumos } from '../../services/produccionService';
import { listarUbicaciones } from '../../services/inventarioService';

const dinero = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (n) => Number(n).toLocaleString('es-AR', { maximumFractionDigits: 4 });
const fecha = (d) => (d ? new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('es-AR') : '—');
const ESTILOS = { planificada: 'bg-amber-50 text-amber-700 border-amber-200', confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-200', anulada: 'bg-slate-100 text-slate-500 border-slate-300' };
const inp = 'w-full border p-2.5 rounded-xl text-sm';
const lbl = 'text-[11px] font-semibold text-slate-500 block mb-1';

function Detalle({ orden, onClose, onCambio }) {
  const [previstos, setPrevistos] = useState([]);
  const [consumos, setConsumos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [obtenida, setObtenida] = useState(Number(orden.cantidad_planificada));
  const [reales, setReales] = useState({});
  const [adicionales, setAdicionales] = useState('');
  const [venc, setVenc] = useState('');
  const [ubic, setUbic] = useState('');
  const [codigo, setCodigo] = useState('');
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    listarPrevistos(orden.id).then(setPrevistos).catch((e) => alert(e.message));
    if (orden.estado === 'confirmada') listarConsumos(orden.id).then(setConsumos).catch(() => {});
    listarUbicaciones().then((u) => setUbicaciones(u.filter((x) => x.estado === 'activo'))).catch(() => {});
  }, [orden.id, orden.estado]);

  const faltantes = previstos.filter((p) => Number(p.faltante) > 0);
  const consumoPorDetalle = useMemo(() => {
    const m = {};
    consumos.forEach((c) => { m[c.detalle_id] = (m[c.detalle_id] || 0) + Number(c.cantidad); });
    return m;
  }, [consumos]);

  const ejecutar = async (accion, mensaje) => {
    setOcupado(true);
    try { await accion(); onCambio(mensaje); } catch (err) { alert(err.message); } finally { setOcupado(false); }
  };

  const confirmar = () => {
    if (!Number(obtenida) || Number(obtenida) <= 0) return alert('Indicá la cantidad realmente obtenida');
    if (!confirm('Se van a descontar las materias primas del inventario y se generará el lote del producto. ¿Confirmar la producción?')) return;
    ejecutar(() => confirmarOrden({
      orden_id: orden.id, cantidad_obtenida: Number(obtenida),
      costos_adicionales: adicionales === '' ? null : Number(adicionales),
      fecha_vencimiento: venc || null, ubicacion_id: ubic || null, codigo_lote: codigo || null,
      consumos: previstos.filter((p) => reales[p.detalle_id] !== undefined && reales[p.detalle_id] !== '')
        .map((p) => ({ detalle_id: p.detalle_id, cantidad: Number(reales[p.detalle_id]) })),
    }), 'Producción confirmada: lote generado');
  };

  return (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 max-h-full overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-800">Orden de producción N° {orden.numero}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-0.5">
          <p className="font-bold text-slate-800 text-sm">{orden.articulo_nombre}</p>
          <p className="text-slate-500">Planificado: {num(orden.cantidad_planificada)} {orden.unidad_codigo} • Receta v{orden.receta_version} • {fecha(orden.fecha_planificada)} • <span className="font-bold">{orden.estado}</span></p>
          {orden.notas && <p className="text-slate-500">Notas: {orden.notas}</p>}
          {orden.estado === 'anulada' && <p className="text-rose-600">Anulada: {orden.motivo_anulacion}</p>}
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Materias primas {orden.estado === 'confirmada' ? '(previsto vs. real)' : 'previstas'}</h4>
          {previstos.map((p) => {
            const falta = Number(p.faltante) > 0 && orden.estado === 'planificada';
            return (
              <div key={p.detalle_id} className={`border rounded-xl p-3 text-xs flex justify-between gap-3 items-center ${falta ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`}>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800">{p.articulo_nombre}</p>
                  <p className="text-slate-500">Previsto: {num(p.cantidad_prevista)} {p.unidad_codigo}
                    {orden.estado === 'planificada' && <> • Disponible: {num(p.stock_disponible)}</>}
                    {orden.estado === 'confirmada' && <> • Real: <strong>{num(consumoPorDetalle[p.detalle_id] || 0)}</strong></>}</p>
                  {falta && <p className="text-rose-600 font-bold">Faltan {num(p.faltante)} {p.unidad_codigo}</p>}
                </div>
                {orden.estado === 'planificada' && (
                  <input type="number" min="0" step="any" className="w-24 border p-1.5 rounded-lg text-xs text-right" placeholder={String(num(p.cantidad_prevista))}
                    value={reales[p.detalle_id] ?? ''} onChange={(e) => setReales({ ...reales, [p.detalle_id]: e.target.value })} title="Consumo real (si es distinto al previsto)" />
                )}
              </div>
            );
          })}
          {orden.estado === 'planificada' && <p className="text-[11px] text-slate-400">Si el consumo real fue distinto al previsto, escribilo a la derecha; si no, se usa el previsto.</p>}
        </div>

        {orden.estado === 'confirmada' && (
          <>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Lotes de origen</h4>
              {consumos.map((c) => <p key={c.id} className="text-xs text-slate-500">{c.articulo_nombre} • Lote {c.codigo_lote} • {num(c.cantidad)} {c.unidad_codigo} × {dinero(c.costo_unitario)}</p>)}
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm space-y-1">
              <div className="flex justify-between text-slate-600"><span>Obtenido</span><span>{num(orden.cantidad_obtenida)} {orden.unidad_codigo} ({num(orden.rendimiento_pct)}% de lo planificado)</span></div>
              <div className="flex justify-between text-slate-600"><span>Lote producido</span><span>{orden.lote_codigo}</span></div>
              <div className="flex justify-between text-slate-600"><span>Materiales</span><span>{dinero(orden.costo_materiales)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Costos adicionales</span><span>{dinero(orden.costos_adicionales)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Costo total</span><span>{dinero(orden.costo_total)}</span></div>
              <div className="flex justify-between font-black text-slate-900 pt-1 border-t"><span>Costo real por {orden.unidad_codigo}</span><span>{dinero(orden.costo_unitario)}</span></div>
            </div>
          </>
        )}

        {orden.estado === 'planificada' && !anulando && (
          <div className="space-y-3 border-t pt-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Confirmar producción</h4>
            {faltantes.length > 0 && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">Falta stock de {faltantes.map((f) => f.articulo_nombre).join(', ')}. Registrá una compra o un ingreso de lote antes de confirmar.</p>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div><label className={lbl}>Cantidad obtenida ({orden.unidad_codigo})</label><input type="number" min="0" step="any" className={inp} value={obtenida} onChange={(e) => setObtenida(e.target.value)} /></div>
              <div><label className={lbl}>Costos adicionales $</label><input type="number" min="0" step="any" className={inp} value={adicionales} onChange={(e) => setAdicionales(e.target.value)} placeholder="Según receta" /></div>
              <div><label className={lbl}>Vencimiento</label><input type="date" className={inp} value={venc} onChange={(e) => setVenc(e.target.value)} /></div>
              <div><label className={lbl}>Ubicación</label>
                <select className={inp + ' bg-white'} value={ubic} onChange={(e) => setUbic(e.target.value)}><option value="">Depósito principal</option>{ubicaciones.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}</select></div>
              <div className="col-span-2"><label className={lbl}>Código de lote (opcional)</label><input className={inp} value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Automático" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button disabled={ocupado} onClick={confirmar} className="bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm">{ocupado ? 'Procesando…' : 'Confirmar producción'}</button>
              <button disabled={ocupado} onClick={() => setAnulando(true)} className="bg-white border border-rose-300 text-rose-600 py-3 rounded-xl font-bold text-sm">Anular orden</button>
            </div>
          </div>
        )}
        {orden.estado === 'confirmada' && !anulando && (
          <button onClick={() => setAnulando(true)} className="w-full bg-white border border-rose-300 text-rose-600 py-3 rounded-xl font-bold text-sm">Anular producción</button>
        )}
        {anulando && (
          <div className="space-y-2 border border-rose-200 rounded-2xl p-3">
            <p className="text-xs text-slate-500">{orden.estado === 'confirmada' ? 'Se devuelven las materias primas a sus lotes con movimientos inversos. Solo es posible si el lote producido no se usó ni se ajustó.' : 'La orden se descarta sin tocar el inventario.'}</p>
            <input className={inp} placeholder="Motivo (obligatorio)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setAnulando(false)} className="bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-sm">Cancelar</button>
              <button disabled={ocupado || !motivo.trim()} onClick={() => ejecutar(() => anularOrden(orden.id, motivo), 'Orden anulada')} className="bg-rose-600 disabled:opacity-40 text-white py-2.5 rounded-xl font-bold text-sm">Confirmar anulación</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdenesPage({ ordenes, recetas, articulos, recargar, toast }) {
  const [estado, setEstado] = useState('Todos');
  const [detalle, setDetalle] = useState(null);
  const [nueva, setNueva] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const vigentes = recetas.filter((r) => r.estado === 'vigente');
  const visibles = ordenes.filter((o) => estado === 'Todos' || o.estado === estado);
  const planificadas = ordenes.filter((o) => o.estado === 'planificada').length;
  const mes = new Date().toISOString().slice(0, 7);
  const producidoMes = ordenes.filter((o) => o.estado === 'confirmada' && (o.confirmada_at || '').startsWith(mes)).length;

  const crear = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const id = await crearOrden({ articulo_id: nueva.articulo_id, cantidad_planificada: Number(nueva.cantidad), fecha_planificada: nueva.fecha || null, notas: nueva.notas });
      toast('Orden creada');
      setNueva(null);
      await recargar();
      const lista = await listarOrdenes();
      const o = lista.find((x) => x.id === id);
      if (o) setDetalle(o);
    } catch (err) { alert(err.message); } finally { setGuardando(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3"><p className="text-[10px] uppercase font-bold text-amber-700">Órdenes planificadas</p><p className="font-black text-sm text-amber-700">{planificadas}</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3"><p className="text-[10px] uppercase font-bold text-slate-400">Producciones del mes</p><p className="font-black text-sm text-slate-800">{producidoMes}</p></div>
      </div>

      <button onClick={() => setNueva({ articulo_id: '', cantidad: '', fecha: '', notas: '' })} className="w-full bg-[#0100FD] hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition">
        <Plus className="w-5 h-5" /> Nueva orden de producción
      </button>

      <select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full sm:w-auto bg-white border border-slate-200 p-3 rounded-xl text-xs font-semibold text-slate-700">
        <option value="Todos">Estado: Todos</option><option value="planificada">Planificadas</option><option value="confirmada">Confirmadas</option><option value="anulada">Anuladas</option>
      </select>

      {visibles.length === 0 && <p className="text-xs text-slate-400 text-center py-8 bg-white rounded-2xl border">No hay órdenes para mostrar.</p>}
      <div className="space-y-2">
        {visibles.map((o) => (
          <button key={o.id} onClick={() => setDetalle(o)} className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition">
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-800 truncate">N° {o.numero} • {o.articulo_nombre}</p>
              <p className="text-xs text-slate-500">{num(o.cantidad_planificada)} {o.unidad_codigo} • v{o.receta_version} • {fecha(o.fecha_planificada)}{o.lote_codigo ? ` • Lote ${o.lote_codigo}` : ''}</p>
            </div>
            <div className="text-right shrink-0">
              {o.costo_unitario != null && <p className="font-black text-sm text-slate-900">{dinero(o.costo_unitario)}/{o.unidad_codigo}</p>}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${ESTILOS[o.estado]}`}>{o.estado}</span>
            </div>
          </button>
        ))}
      </div>

      {nueva && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800">Nueva orden de producción</h3>
              <button onClick={() => setNueva(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={crear} className="space-y-3">
              <div><label className={lbl}>Producto a fabricar</label>
                <select required className={inp + ' bg-white'} value={nueva.articulo_id} onChange={(e) => setNueva({ ...nueva, articulo_id: e.target.value })}>
                  <option value="">-- Elegir (solo con receta vigente) --</option>
                  {vigentes.map((r) => <option key={r.id} value={r.articulo_id}>{r.articulo_nombre} (receta v{r.version})</option>)}
                </select></div>
              {vigentes.length === 0 && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">No hay recetas vigentes. Publicá una en la pestaña Recetas.</p>}
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Cantidad a producir {nueva.articulo_id ? `(${articulos.find((a) => a.id === nueva.articulo_id)?.unidad_codigo || ''})` : ''}</label>
                  <input required type="number" min="0" step="any" className={inp} value={nueva.cantidad} onChange={(e) => setNueva({ ...nueva, cantidad: e.target.value })} /></div>
                <div><label className={lbl}>Fecha prevista</label><input type="date" className={inp} value={nueva.fecha} onChange={(e) => setNueva({ ...nueva, fecha: e.target.value })} /></div>
              </div>
              <div><label className={lbl}>Notas (opcional)</label><input className={inp} value={nueva.notas} onChange={(e) => setNueva({ ...nueva, notas: e.target.value })} /></div>
              <button type="submit" disabled={guardando} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition">{guardando ? 'Creando…' : 'Crear orden'}</button>
            </form>
          </div>
        </div>
      )}

      {detalle && <Detalle orden={detalle} onClose={() => setDetalle(null)} onCambio={async (msg) => { setDetalle(null); toast(msg); await recargar(); }} />}
    </div>
  );
}
