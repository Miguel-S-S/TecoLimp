import React, { useMemo, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { TIPOS_ARTICULO } from '../../services/ArticulosService';
import { TIPOS_INGREDIENTE, guardarReceta } from '../../services/produccionService';

const inp = 'w-full border p-2.5 rounded-xl text-sm';
const lbl = 'text-[11px] font-semibold text-slate-500 block mb-1';
const nuevaLinea = () => ({ key: Math.random().toString(36).slice(2), articulo_id: '', cantidad: '', unidad_codigo: '' });

export default function RecetaEditor({ receta, detalles, articulos, unidades, onClose, onSaved }) {
  const [f, setF] = useState({
    articulo_id: receta?.articulo_id || '', rendimiento: receta ? Number(receta.rendimiento) : '',
    unidad_codigo: receta?.unidad_codigo || '', costos_adicionales: receta ? Number(receta.costos_adicionales) || '' : '',
    vida_util_dias: receta?.vida_util_dias ?? '', tiempo_preparacion_min: receta?.tiempo_preparacion_min ?? '',
    tiempo_reposo_min: receta?.tiempo_reposo_min ?? '', notas: receta?.notas || '',
  });
  const [lineas, setLineas] = useState(() => (detalles?.length
    ? detalles.map((d) => ({ key: d.id, articulo_id: d.articulo_id, cantidad: Number(d.cantidad), unidad_codigo: d.unidad_codigo }))
    : [nuevaLinea()]));
  const [guardando, setGuardando] = useState(false);

  const productos = useMemo(() => articulos.filter((a) =>
    a.estado === 'activo' && a.tipo === 'ProductoElaborado' && a.controla_stock && !(a.opciones?.length > 0)), [articulos]);
  const ingredientes = useMemo(() => articulos.filter((a) =>
    a.estado === 'activo' && a.controla_stock && TIPOS_INGREDIENTE.includes(a.tipo) && a.id !== f.articulo_id
    && !(a.opciones?.length > 0)), [articulos, f.articulo_id]);
  const porId = useMemo(() => Object.fromEntries(articulos.map((a) => [a.id, a])), [articulos]);

  const set = (c) => (e) => setF((x) => ({ ...x, [c]: e.target.value }));
  const setLin = (key, c, v) => setLineas((ls) => ls.map((l) => (l.key === key ? { ...l, [c]: v } : l)));
  const elegirProducto = (id) => setF((x) => ({ ...x, articulo_id: id, unidad_codigo: porId[id]?.unidad_codigo || x.unidad_codigo }));
  const elegirIngrediente = (key, id) => setLineas((ls) => ls.map((l) => (l.key === key
    ? { ...l, articulo_id: id, unidad_codigo: porId[id]?.unidad_codigo || '' } : l)));

  const guardar = async (publicar) => {
    if (!f.articulo_id) return alert('Elegí el producto a fabricar');
    const validas = lineas.filter((l) => l.articulo_id);
    if (validas.length === 0) return alert('Agregá al menos un ingrediente');
    if (publicar && !confirm('Al publicar, esta versión pasa a ser la vigente y ya no se podrá editar (la anterior queda obsoleta). ¿Continuar?')) return;
    setGuardando(true);
    try {
      await guardarReceta({
        id: receta?.id || null, articulo_id: f.articulo_id, rendimiento: Number(f.rendimiento),
        unidad_codigo: f.unidad_codigo || null, costos_adicionales: Number(f.costos_adicionales || 0),
        vida_util_dias: f.vida_util_dias === '' ? null : Number(f.vida_util_dias),
        tiempo_preparacion_min: f.tiempo_preparacion_min === '' ? null : Number(f.tiempo_preparacion_min),
        tiempo_reposo_min: f.tiempo_reposo_min === '' ? null : Number(f.tiempo_reposo_min),
        notas: f.notas, publicar,
        detalles: validas.map((l) => ({ articulo_id: l.articulo_id, cantidad: Number(l.cantidad), unidad_codigo: l.unidad_codigo || null })),
      });
      onSaved(publicar ? 'Receta publicada' : 'Borrador guardado');
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 max-h-full overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-800">{receta ? `Receta de ${receta.articulo_nombre} · v${receta.version}` : 'Nueva receta'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-4"><label className={lbl}>Producto a fabricar</label>
            <select className={inp + ' bg-white'} disabled={!!receta} value={f.articulo_id} onChange={(e) => elegirProducto(e.target.value)}>
              <option value="">-- Elegir producto elaborado --</option>
              {productos.map((a) => <option key={a.id} value={a.id}>{a.nombre} ({a.unidad_codigo})</option>)}
            </select></div>
          <div className="col-span-1 sm:col-span-2"><label className={lbl}>Rendimiento de la receta</label>
            <input type="number" min="0" step="any" className={inp} value={f.rendimiento} onChange={set('rendimiento')} placeholder="Ej: 100" /></div>
          <div className="col-span-1 sm:col-span-2"><label className={lbl}>Unidad del rendimiento</label>
            <select className={inp + ' bg-white'} value={f.unidad_codigo} onChange={set('unidad_codigo')}>
              {unidades.map((u) => <option key={u.codigo} value={u.codigo}>{u.nombre} ({u.codigo})</option>)}</select></div>
          <div><label className={lbl}>Costos adicionales $</label><input type="number" min="0" step="any" className={inp} value={f.costos_adicionales} onChange={set('costos_adicionales')} placeholder="Por tanda" /></div>
          <div><label className={lbl}>Vida útil (días)</label><input type="number" min="1" className={inp} value={f.vida_util_dias} onChange={set('vida_util_dias')} /></div>
          <div><label className={lbl}>Preparación (min)</label><input type="number" min="0" className={inp} value={f.tiempo_preparacion_min} onChange={set('tiempo_preparacion_min')} /></div>
          <div><label className={lbl}>Reposo (min)</label><input type="number" min="0" className={inp} value={f.tiempo_reposo_min} onChange={set('tiempo_reposo_min')} /></div>
        </div>
        <p className="text-[11px] text-slate-400">Cargá las cantidades de cada ingrediente para <strong>una tanda completa</strong> (el rendimiento de arriba). Al producir otra cantidad, se escalan solas.</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Ingredientes</h4>
            <button type="button" onClick={() => setLineas((ls) => [...ls, nuevaLinea()])} className="text-xs font-bold text-[#0100FD] flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Agregar</button>
          </div>
          {lineas.map((l) => (
            <div key={l.key} className="grid grid-cols-12 gap-2 items-center">
              <select className={inp + ' bg-white col-span-6'} value={l.articulo_id} onChange={(e) => elegirIngrediente(l.key, e.target.value)}>
                <option value="">-- Ingrediente --</option>
                {ingredientes.map((a) => <option key={a.id} value={a.id}>{a.nombre} · {TIPOS_ARTICULO[a.tipo]}</option>)}
              </select>
              <input type="number" min="0" step="any" className={inp + ' col-span-3'} placeholder="Cantidad" value={l.cantidad} onChange={(e) => setLin(l.key, 'cantidad', e.target.value)} />
              <select className={inp + ' bg-white col-span-2'} value={l.unidad_codigo} onChange={(e) => setLin(l.key, 'unidad_codigo', e.target.value)}>
                <option value="">--</option>{unidades.map((u) => <option key={u.codigo} value={u.codigo}>{u.codigo}</option>)}</select>
              <button type="button" onClick={() => setLineas((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : [nuevaLinea()]))} className="col-span-1 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        <div><label className={lbl}>Notas (opcional)</label><input className={inp} value={f.notas} onChange={set('notas')} /></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button type="button" disabled={guardando} onClick={() => guardar(false)} className="bg-white border border-[#0100FD] text-[#0100FD] hover:bg-blue-50 disabled:opacity-50 py-3.5 rounded-xl font-bold text-sm transition">Guardar borrador</button>
          <button type="button" disabled={guardando} onClick={() => guardar(true)} className="bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm transition">{guardando ? 'Guardando…' : 'Guardar y publicar'}</button>
        </div>
      </div>
    </div>
  );
}
