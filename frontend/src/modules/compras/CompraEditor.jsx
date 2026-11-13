import React, { useEffect, useMemo, useState } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { TIPOS_ARTICULO } from '../../services/ArticulosService';
import { TIPOS_COMPRABLES, guardarCompra } from '../../services/comprasService';
import { listarUbicaciones } from '../../services/inventarioService';

const pad = (n) => String(n).padStart(2, '0');
const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const dinero = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const linea = (l) => (l.es_regalo ? 0
  : Math.round(Number(l.cantidad || 0) * Number(l.costo_unitario || 0) * (1 - Number(l.descuento_pct || 0) / 100) * 100) / 100);

const nuevaLinea = () => ({
  key: Math.random().toString(36).slice(2), articulo_id: '', cantidad: '', unidad_codigo: '', costo_unitario: '',
  descuento_pct: '', es_regalo: false, costo_referencia: '', fecha_vencimiento: '', fecha_elaboracion: '',
  codigo_lote: '', ubicacion_id: '', abierta: false,
});

const inp = 'w-full border p-2.5 rounded-xl text-sm';
const lbl = 'text-[11px] font-semibold text-slate-500 block mb-1';

export default function CompraEditor({ compra, detalles, proveedores, articulos, unidades, onClose, onSaved }) {
  const [h, setH] = useState({
    proveedor_id: compra?.proveedor_id ? String(compra.proveedor_id) : '',
    fecha_compra: compra?.fecha_compra || hoy(),
    numero_comprobante: compra?.numero_comprobante || '',
    descuento: compra?.descuento ? Number(compra.descuento) : '',
    notas: compra?.notas || '',
  });
  const [lineas, setLineas] = useState(() => (detalles?.length
    ? detalles.map((d) => ({
      key: d.id, articulo_id: d.articulo_id, cantidad: Number(d.cantidad), unidad_codigo: d.unidad_codigo,
      costo_unitario: d.es_regalo ? '' : Number(d.costo_unitario), descuento_pct: Number(d.descuento_pct) || '',
      es_regalo: d.es_regalo, costo_referencia: d.costo_referencia ?? '', fecha_vencimiento: d.fecha_vencimiento || '',
      fecha_elaboracion: d.fecha_elaboracion || '', codigo_lote: d.codigo_lote || '', ubicacion_id: d.ubicacion_id || '', abierta: false,
    }))
    : [nuevaLinea()]));
  const [ubicaciones, setUbicaciones] = useState([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { listarUbicaciones().then((u) => setUbicaciones(u.filter((x) => x.estado === 'activo'))).catch(() => {}); }, []);

  const opciones = useMemo(() => articulos.filter((a) =>
    a.estado === 'activo' && a.controla_stock && TIPOS_COMPRABLES.includes(a.tipo)), [articulos]);
  const porId = useMemo(() => Object.fromEntries(articulos.map((a) => [a.id, a])), [articulos]);

  const setLin = (key, campo, valor) => setLineas((ls) => ls.map((l) => (l.key === key ? { ...l, [campo]: valor } : l)));
  const elegirArticulo = (key, id) => setLineas((ls) => ls.map((l) => (l.key === key
    ? { ...l, articulo_id: id, unidad_codigo: porId[id]?.unidad_codigo || '' } : l)));

  const subtotal = lineas.reduce((t, l) => t + linea(l), 0);
  const descuento = Number(h.descuento || 0);
  const total = Math.max(subtotal - descuento, 0);

  const guardar = async (confirmar) => {
    if (!h.proveedor_id) return alert('Elegí un proveedor');
    const validas = lineas.filter((l) => l.articulo_id);
    if (validas.length === 0) return alert('Agregá al menos un artículo');
    if (confirmar && !confirm('Se va a recibir la mercadería: el stock ingresa al inventario con sus lotes. ¿Continuar?')) return;
    setGuardando(true);
    try {
      const id = await guardarCompra({
        id: compra?.id || null, proveedor_id: Number(h.proveedor_id), fecha_compra: h.fecha_compra,
        numero_comprobante: h.numero_comprobante, descuento, notas: h.notas, confirmar,
        detalles: validas.map((l) => ({
          articulo_id: l.articulo_id, cantidad: Number(l.cantidad), unidad_codigo: l.unidad_codigo,
          costo_unitario: l.es_regalo ? 0 : Number(l.costo_unitario || 0), descuento_pct: Number(l.descuento_pct || 0),
          es_regalo: l.es_regalo, costo_referencia: l.es_regalo && l.costo_referencia !== '' ? Number(l.costo_referencia) : null,
          fecha_vencimiento: l.fecha_vencimiento || null, fecha_elaboracion: l.fecha_elaboracion || null,
          codigo_lote: l.codigo_lote || null, ubicacion_id: l.ubicacion_id || null,
        })),
      });
      onSaved(confirmar ? 'Compra recibida: stock actualizado' : 'Borrador guardado', id);
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 max-h-full overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-800">{compra ? `Editar compra N° ${compra.numero}` : 'Nueva compra'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2"><label className={lbl}>Proveedor</label>
            <select className={inp + ' bg-white'} value={h.proveedor_id} onChange={(e) => setH({ ...h, proveedor_id: e.target.value })}>
              <option value="">-- Elegir proveedor --</option>
              {proveedores.filter((p) => p.estado === 'activo').map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select></div>
          <div><label className={lbl}>Fecha de compra</label><input type="date" className={inp} value={h.fecha_compra} onChange={(e) => setH({ ...h, fecha_compra: e.target.value })} /></div>
          <div><label className={lbl}>N° de comprobante</label><input className={inp} value={h.numero_comprobante} onChange={(e) => setH({ ...h, numero_comprobante: e.target.value })} placeholder="Opcional" /></div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Artículos</h4>
            <button type="button" onClick={() => setLineas((ls) => [...ls, nuevaLinea()])} className="text-xs font-bold text-[#0100FD] flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Agregar artículo</button>
          </div>

          {lineas.map((l) => {
            const art = porId[l.articulo_id];
            return (
              <div key={l.key} className="border border-slate-200 rounded-2xl p-3 space-y-2 bg-slate-50/50">
                <div className="flex gap-2">
                  <select className={inp + ' bg-white'} value={l.articulo_id} onChange={(e) => elegirArticulo(l.key, e.target.value)}>
                    <option value="">-- Elegir artículo --</option>
                    {opciones.map((a) => <option key={a.id} value={a.id}>{a.nombre} · {TIPOS_ARTICULO[a.tipo]} · {a.unidad_codigo}</option>)}
                  </select>
                  <button type="button" onClick={() => setLineas((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : [nuevaLinea()]))} className="text-slate-400 hover:text-rose-500 px-1"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div><label className={lbl}>Cantidad</label><input type="number" min="0" step="any" className={inp} value={l.cantidad} onChange={(e) => setLin(l.key, 'cantidad', e.target.value)} /></div>
                  <div><label className={lbl}>Unidad</label>
                    <select className={inp + ' bg-white'} value={l.unidad_codigo} onChange={(e) => setLin(l.key, 'unidad_codigo', e.target.value)}>
                      <option value="">--</option>
                      {unidades.map((u) => <option key={u.codigo} value={u.codigo}>{u.codigo}</option>)}
                    </select></div>
                  <div><label className={lbl}>{l.es_regalo ? 'Costo ref. $' : 'Costo unit. $'}</label>
                    {l.es_regalo
                      ? <input type="number" min="0" step="any" className={inp} value={l.costo_referencia} onChange={(e) => setLin(l.key, 'costo_referencia', e.target.value)} placeholder="Opcional" />
                      : <input type="number" min="0" step="any" className={inp} value={l.costo_unitario} onChange={(e) => setLin(l.key, 'costo_unitario', e.target.value)} />}
                  </div>
                  <div><label className={lbl}>Desc. %</label><input type="number" min="0" max="100" step="any" disabled={l.es_regalo} className={inp + ' disabled:bg-slate-100'} value={l.descuento_pct} onChange={(e) => setLin(l.key, 'descuento_pct', e.target.value)} /></div>
                  <div><label className={lbl}>Subtotal</label><p className="p-2.5 text-sm font-bold text-slate-800">{dinero(linea(l))}</p></div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-600 flex items-center gap-2">
                    <input type="checkbox" checked={l.es_regalo} onChange={(e) => setLin(l.key, 'es_regalo', e.target.checked)} /> Regalo / muestra del proveedor (costo $0)
                  </label>
                  <button type="button" onClick={() => setLin(l.key, 'abierta', !l.abierta)} className="text-xs text-slate-500 flex items-center gap-1">
                    Datos del lote {l.abierta ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {art && l.unidad_codigo && l.unidad_codigo !== art.unidad_codigo && (
                  <p className="text-[11px] text-slate-400">Se ingresa convertido a {art.unidad_codigo} (el artículo se controla en esa unidad).</p>
                )}
                {l.abierta && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div><label className={lbl}>Vencimiento</label><input type="date" className={inp} value={l.fecha_vencimiento} onChange={(e) => setLin(l.key, 'fecha_vencimiento', e.target.value)} /></div>
                    <div><label className={lbl}>Elaboración</label><input type="date" className={inp} value={l.fecha_elaboracion} onChange={(e) => setLin(l.key, 'fecha_elaboracion', e.target.value)} /></div>
                    <div><label className={lbl}>Código de lote</label><input className={inp} value={l.codigo_lote} onChange={(e) => setLin(l.key, 'codigo_lote', e.target.value)} placeholder="Automático" /></div>
                    <div><label className={lbl}>Ubicación</label>
                      <select className={inp + ' bg-white'} value={l.ubicacion_id} onChange={(e) => setLin(l.key, 'ubicacion_id', e.target.value)}>
                        <option value="">Depósito principal</option>
                        {ubicaciones.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                      </select></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <div><label className={lbl}>Notas (opcional)</label><input className={inp} value={h.notas} onChange={(e) => setH({ ...h, notas: e.target.value })} /></div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{dinero(subtotal)}</span></div>
            <div className="flex justify-between items-center text-slate-600"><span>Descuento general $</span>
              <input type="number" min="0" step="any" className="w-28 border p-1.5 rounded-lg text-sm text-right" value={h.descuento} onChange={(e) => setH({ ...h, descuento: e.target.value })} /></div>
            <div className="flex justify-between font-black text-slate-900 pt-1 border-t"><span>Total</span><span>{dinero(total)}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button type="button" disabled={guardando} onClick={() => guardar(false)} className="bg-white border border-[#0100FD] text-[#0100FD] hover:bg-blue-50 disabled:opacity-50 py-3.5 rounded-xl font-bold text-sm transition">Guardar borrador</button>
          <button type="button" disabled={guardando} onClick={() => guardar(true)} className="bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm transition">{guardando ? 'Guardando…' : 'Guardar y recibir mercadería'}</button>
        </div>
      </div>
    </div>
  );
}
