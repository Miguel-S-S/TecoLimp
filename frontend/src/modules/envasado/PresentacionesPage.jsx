import React, { useMemo, useState } from 'react';
import { Plus, Edit3, X } from 'lucide-react';
import { guardarPresentacion } from '../../services/envasadoService';

const dinero = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (n) => Number(n).toLocaleString('es-AR', { maximumFractionDigits: 4 });
const inp = 'w-full border p-2.5 rounded-xl text-sm';
const lbl = 'text-[11px] font-semibold text-slate-500 block mb-1';
const VACIO = {
  id: null, producto_granel_id: '', contenido: '', unidad_codigo: 'lt', envase_id: '', envase_cantidad: 1,
  tapa_id: '', tapa_cantidad: 1, etiqueta_id: '', etiqueta_cantidad: 1, precio_venta: '', nombre: '', estado: 'activo',
};

export default function PresentacionesPage({ presentaciones, articulos, unidades, recargar, toast }) {
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const granel = useMemo(() => articulos.filter((a) => a.estado === 'activo' && a.controla_stock
    && ['ProductoElaborado', 'ProductoReventa'].includes(a.tipo) && !a.articulo_padre_id && !(a.opciones?.length > 0)
    && !presentaciones.some((p) => p.articulo_id === a.id)), [articulos, presentaciones]);
  const insumos = useMemo(() => articulos.filter((a) => a.estado === 'activo' && a.controla_stock && a.tipo === 'Insumo'), [articulos]);

  const set = (c) => (e) => setForm((f) => ({ ...f, [c]: e.target.value }));
  const elegirGranel = (id) => setForm((f) => ({ ...f, producto_granel_id: id, unidad_codigo: articulos.find((a) => a.id === id)?.unidad_codigo || f.unidad_codigo }));

  const editar = (p) => {
    setForm({
      id: p.id, producto_granel_id: p.producto_granel_id, contenido: Number(p.contenido), unidad_codigo: p.unidad_codigo,
      envase_id: p.envase_id, envase_cantidad: Number(p.envase_cantidad), tapa_id: p.tapa_id || '', tapa_cantidad: Number(p.tapa_cantidad),
      etiqueta_id: p.etiqueta_id || '', etiqueta_cantidad: Number(p.etiqueta_cantidad), precio_venta: Number(p.precio_venta),
      nombre: p.nombre, estado: p.estado,
    });
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await guardarPresentacion({
        ...form, contenido: Number(form.contenido), precio_venta: Number(form.precio_venta || 0),
        envase_cantidad: Number(form.envase_cantidad), tapa_cantidad: Number(form.tapa_cantidad), etiqueta_cantidad: Number(form.etiqueta_cantidad),
        tapa_id: form.tapa_id || null, etiqueta_id: form.etiqueta_id || null,
      });
      toast(form.id ? 'Presentación actualizada' : 'Presentación creada');
      setForm(null);
      await recargar();
    } catch (err) { alert(err.message); } finally { setGuardando(false); }
  };

  return (
    <div className="space-y-3">
        <button onClick={() => setForm({ ...VACIO, unidad_codigo: unidades[0]?.codigo || 'lt' })} className="w-full bg-[#0100FD] hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition">
        <Plus className="w-5 h-5" /> Nueva presentación
      </button>
      <p className="text-[11px] text-slate-400">Una presentación define cómo se vende un producto a granel en envases: contenido, envase, tapa, etiqueta y precio. Genera un artículo vendible con su propio stock.</p>
      {presentaciones.length === 0 && <p className="text-xs text-slate-400 text-center py-8 bg-white rounded-2xl border">Todavía no hay presentaciones.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {presentaciones.map((p) => {
          const margen = Number(p.precio_venta) > 0 ? Math.round((1 - Number(p.costo_estimado_unitario) / Number(p.precio_venta)) * 100) : null;
          return (
            <div key={p.id} className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1 ${p.estado === 'inactivo' ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-slate-800">{p.nombre}</h4>
                  <p className="text-xs text-slate-500">{p.articulo_codigo} • {num(p.contenido)} {p.unidad_codigo} de {p.granel_nombre}</p>
                </div>
                <button onClick={() => editar(p)} className="p-1.5 text-slate-400 hover:text-[#0100FD]"><Edit3 className="w-4 h-4" /></button>
              </div>
              <p className="text-[11px] text-slate-500">{p.envase_nombre}{p.tapa_nombre ? ` + ${p.tapa_nombre}` : ''}{p.etiqueta_nombre ? ` + ${p.etiqueta_nombre}${Number(p.etiqueta_cantidad) > 1 ? ` ×${num(p.etiqueta_cantidad)}` : ''}` : ''}</p>
              <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                <span>Stock: <strong>{num(p.stock)}</strong> u.</span>
                <span>Costo est. {dinero(p.costo_estimado_unitario)}</span>
                <span className="font-bold text-emerald-600">{dinero(p.precio_venta)}{margen != null ? ` (${margen}%)` : ''}</span>
              </div>
            </div>
          );
        })}
      </div>

      {form && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 max-h-full overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800">{form.id ? 'Editar presentación' : 'Nueva presentación'}</h3>
              <button onClick={() => setForm(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardar} className="space-y-3">
              <div><label className={lbl}>Producto a granel</label>
                <select required className={inp + ' bg-white'} value={form.producto_granel_id} onChange={(e) => elegirGranel(e.target.value)}>
                  <option value="">-- Elegir --</option>
                  {[...granel, ...articulos.filter((a) => a.id === form.producto_granel_id && !granel.some((g) => g.id === a.id))]
                    .map((a) => <option key={a.id} value={a.id}>{a.nombre} ({a.unidad_codigo})</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Contenido</label><input required type="number" min="0" step="any" className={inp} value={form.contenido} onChange={set('contenido')} placeholder="Ej: 5" /></div>
                <div><label className={lbl}>Unidad</label>
                  <select className={inp + ' bg-white'} value={form.unidad_codigo} onChange={set('unidad_codigo')}>{unidades.map((u) => <option key={u.codigo} value={u.codigo}>{u.nombre} ({u.codigo})</option>)}</select></div>
              </div>
              <div className="grid grid-cols-4 gap-2 items-end">
                <div className="col-span-3"><label className={lbl}>Envase</label>
                  <select required className={inp + ' bg-white'} value={form.envase_id} onChange={set('envase_id')}><option value="">-- Elegir --</option>{insumos.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
                <div><label className={lbl}>Cant.</label><input type="number" min="0" step="any" className={inp} value={form.envase_cantidad} onChange={set('envase_cantidad')} /></div>
                <div className="col-span-3"><label className={lbl}>Tapa (opcional)</label>
                  <select className={inp + ' bg-white'} value={form.tapa_id} onChange={set('tapa_id')}><option value="">Sin tapa</option>{insumos.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
                <div><label className={lbl}>Cant.</label><input type="number" min="0" step="any" className={inp} value={form.tapa_cantidad} onChange={set('tapa_cantidad')} /></div>
                <div className="col-span-3"><label className={lbl}>Etiqueta (opcional)</label>
                  <select className={inp + ' bg-white'} value={form.etiqueta_id} onChange={set('etiqueta_id')}><option value="">Sin etiqueta</option>{insumos.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
                <div><label className={lbl}>Cant.</label><input type="number" min="0" step="any" className={inp} value={form.etiqueta_cantidad} onChange={set('etiqueta_cantidad')} /></div>
              </div>
              <p className="text-[11px] text-slate-400">Los envases, tapas y etiquetas son artículos de tipo <strong>Insumo</strong> (se cargan en Stock). "Cant." es cuántos lleva cada unidad (por ejemplo 2 etiquetas).</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Precio de venta $</label><input type="number" min="0" step="any" className={inp} value={form.precio_venta} onChange={set('precio_venta')} /></div>
                <div><label className={lbl}>Nombre (opcional)</label><input className={inp} value={form.nombre} onChange={set('nombre')} placeholder="Automático" /></div>
              </div>
              {form.id && <label className="text-xs text-slate-600 flex items-center gap-2"><input type="checkbox" checked={form.estado === 'activo'} onChange={(e) => setForm({ ...form, estado: e.target.checked ? 'activo' : 'inactivo' })} /> Presentación activa</label>}
              <button type="submit" disabled={guardando} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition">{guardando ? 'Guardando…' : 'Guardar presentación'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
