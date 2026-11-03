import React, { useMemo, useState } from 'react';
import { Plus, Search, X, Edit3, EyeOff, Eye, Layers } from 'lucide-react';
import VariantesEditor from './Varianteseditor';
import {
  TIPOS_ARTICULO, TIPOS_VENDIBLES, guardarArticulo, ajustarStock, cambiarEstadoArticulo,
} from '../../services/ArticulosService';

const VACIO = {
  id: null, tipo: 'ProductoReventa', nombre: '', descripcion: '', categoria_id: '',
  unidad_codigo: 'u', stock: 0, precio_venta: '', costo_referencia: '',
};

export default function StockPage({ articulos, categorias, unidades, recargar, toast }) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [verInactivos, setVerInactivos] = useState(false);
  const [form, setForm] = useState(null);
  const [original, setOriginal] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [editorVar, setEditorVar] = useState(null); // null = cerrado; { padre } (padre puede ser null = nuevo)

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const vendible = form && TIPOS_VENDIBLES.includes(form.tipo);

  const abrirNuevo = () => { setOriginal(null); setForm({ ...VACIO, categoria_id: categorias[0]?.id || '' }); };
  const abrirEditar = (a) => {
    setOriginal(a);
    setForm({
      id: a.id, tipo: a.tipo, nombre: a.nombre, descripcion: a.descripcion || '',
      categoria_id: a.categoria_id || '', unidad_codigo: a.unidad_codigo, stock: a.stock,
      precio_venta: a.precio_venta, costo_referencia: a.costo_referencia,
    });
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const id = await guardarArticulo({
        id: form.id, tipo: form.tipo, nombre: form.nombre, descripcion: form.descripcion,
        categoria_id: form.categoria_id || null, unidad_codigo: form.unidad_codigo,
        precio_venta: vendible ? Number(form.precio_venta || 0) : 0,
        costo_referencia: vendible ? Number(form.costo_referencia || 0) : 0,
        stock_inicial: form.id ? 0 : Number(form.stock || 0),
      });
      if (form.id && original && Number(form.stock) !== Number(original.stock)) {
        await ajustarStock(id, Number(form.stock), 'Ajuste desde edición de artículo');
      }
      toast(form.id ? 'Artículo actualizado' : 'Artículo creado');
      setForm(null);
      await recargar();
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const alternarEstado = async (a) => {
    const nuevo = a.estado === 'activo' ? 'inactivo' : 'activo';
    if (nuevo === 'inactivo' && !confirm(`¿Desactivar "${a.nombre}"? No se borra: podés reactivarlo cuando quieras.`)) return;
    try {
      await cambiarEstadoArticulo(a.id, nuevo);
      toast(nuevo === 'activo' ? 'Artículo reactivado' : 'Artículo desactivado');
      await recargar();
    } catch (err) { alert(err.message); }
  };

  const visibles = useMemo(() => articulos.filter((a) =>
    !a.articulo_padre_id &&
    (verInactivos || a.estado === 'activo') &&
    (a.nombre + ' ' + a.codigo).toLowerCase().includes(busqueda.toLowerCase()) &&
    (filtroCategoria === 'Todas' || a.categoria === filtroCategoria) &&
    (filtroTipo === 'Todos' || a.tipo === filtroTipo)
  ), [articulos, busqueda, filtroCategoria, filtroTipo, verInactivos]);

  const activos = articulos.filter((a) => a.estado === 'activo' && !a.articulo_padre_id);
  const sinStock = articulos.filter((a) => a.estado === 'activo' && a.controla_stock && Number(a.stock) <= 0).length;
  const hijosDe = (id) => articulos.filter((h) => h.articulo_padre_id === id && h.estado === 'activo');

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span className="text-xs font-bold text-slate-700">{activos.length} artículos activos • {sinStock} sin stock</span>
        </div>
        <label className="text-xs text-slate-500 flex items-center gap-1.5">
          <input type="checkbox" checked={verInactivos} onChange={(e) => setVerInactivos(e.target.checked)} /> Ver inactivos
        </label>
      </div>

      <button onClick={abrirNuevo} className="w-full bg-[#0100FD] hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition">
        <Plus className="w-5 h-5" /> Nuevo artículo
      </button>
      <button onClick={() => setEditorVar({ padre: null })} className="w-full bg-white border border-[#0100FD] text-[#0100FD] hover:bg-blue-50 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition">
        <Layers className="w-5 h-5" /> Nuevo producto con variantes (aroma, cantidad, envase…)
      </button>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input type="text" placeholder="Buscar por nombre o código..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm" />
        </div>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-semibold text-slate-700">
          <option value="Todos">Tipo: Todos</option>
          {Object.entries(TIPOS_ARTICULO).map(([k, v]) => <option key={k} value={k}>Tipo: {v}</option>)}
        </select>
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-semibold text-slate-700">
          <option value="Todas">Categoría: Todas</option>
          {categorias.map((c) => <option key={c.id} value={c.nombre}>Categoría: {c.nombre}</option>)}
        </select>
      </div>

      {visibles.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-8 bg-white rounded-2xl border">No hay artículos que coincidan. Probá otro filtro o creá uno nuevo.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibles.map((a) => (
          <div key={a.id} className={`bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-xs ${a.estado === 'inactivo' ? 'opacity-60' : ''}`}>
            <div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-50 text-[#0100FD] rounded-md">{a.categoria || 'Sin categoría'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">{TIPOS_ARTICULO[a.tipo]}</span>
              </div>
              <h4 className="font-bold text-sm text-slate-800 mt-1">{a.nombre}</h4>
              {a.opciones?.length > 0 ? (() => {
                const hs = hijosDe(a.id);
                const precios = hs.map((h) => Number(h.precio_venta));
                return (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {a.codigo} • {hs.length} variantes • Stock total: {hs.reduce((t, h) => t + Number(h.stock), 0)}
                    {precios.length > 0 && <> | Desde <span className="font-semibold text-emerald-600">${Math.min(...precios)}</span></>}
                  </p>
                );
              })() : (
                <p className="text-xs text-slate-500 mt-0.5">
                  {a.codigo} • Stock: {Number(a.stock)} {a.unidad_codigo}
                  {TIPOS_VENDIBLES.includes(a.tipo) && <> | Venta: <span className="font-semibold text-emerald-600">${Number(a.precio_venta)}</span></>}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <button onClick={() => (a.opciones?.length > 0 ? setEditorVar({ padre: a }) : abrirEditar(a))} title="Editar" className="p-2 text-slate-400 hover:text-[#0100FD]"><Edit3 className="w-4 h-4" /></button>
              <button onClick={() => alternarEstado(a)} title={a.estado === 'activo' ? 'Desactivar' : 'Reactivar'} className="p-2 text-slate-400 hover:text-rose-500">
                {a.estado === 'activo' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {form && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 max-h-full overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800">{form.id ? 'Editar artículo' : 'Nuevo artículo'}</h3>
              <button onClick={() => setForm(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardar} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Nombre</label>
                <input type="text" value={form.nombre} onChange={set('nombre')} required placeholder="Ej: Lavandina Concentrada" className="w-full border p-3 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Tipo</label>
                  <select value={form.tipo} onChange={set('tipo')} className="w-full border p-3 rounded-xl text-sm bg-white">
                    {Object.entries(TIPOS_ARTICULO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Unidad</label>
                  <select value={form.unidad_codigo} onChange={set('unidad_codigo')} className="w-full border p-3 rounded-xl text-sm bg-white">
                    {unidades.map((u) => <option key={u.codigo} value={u.codigo}>{u.nombre} ({u.codigo})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Categoría</label>
                <select value={form.categoria_id} onChange={set('categoria_id')} className="w-full border p-3 rounded-xl text-sm bg-white">
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Descripción (opcional)</label>
                <input type="text" value={form.descripcion} onChange={set('descripcion')} className="w-full border p-3 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">{form.id ? 'Stock actual' : 'Stock inicial'}</label>
                  <input type="number" step="any" min="0" value={form.stock} onChange={set('stock')} className="w-full border p-3 rounded-xl text-sm" />
                </div>
                {vendible && (
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Precio venta ($)</label>
                    <input type="number" step="any" min="0" value={form.precio_venta} onChange={set('precio_venta')} placeholder="0.00" className="w-full border p-3 rounded-xl text-sm" />
                  </div>
                )}
              </div>
              {vendible && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Costo de referencia ($)</label>
                  <input type="number" step="any" min="0" value={form.costo_referencia} onChange={set('costo_referencia')} placeholder="0.00" className="w-full border p-3 rounded-xl text-sm" />
                </div>
              )}
              {form.id && <p className="text-[11px] text-slate-400">Si cambiás el stock se registra un ajuste en el historial de movimientos.</p>}
              <button type="submit" disabled={guardando} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition shadow-sm mt-2">
                {guardando ? 'Guardando…' : 'Guardar artículo'}
              </button>
            </form>
          </div>
        </div>
      )}
      {editorVar && (
        <VariantesEditor
          articulos={articulos} padre={editorVar.padre} categorias={categorias} unidades={unidades}
          onClose={() => setEditorVar(null)}
          onSaved={async (msg) => { setEditorVar(null); toast(msg); await recargar(); }}
        />
      )}
    </div>
  );
}