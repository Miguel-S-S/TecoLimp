import React, { useEffect, useState } from 'react';
import { Plus, Edit3, X, Phone, MapPin } from 'lucide-react';
import { TIPOS_ARTICULO } from '../../services/ArticulosService';
import { TIPOS_COMPRABLES, guardarProveedor, listarProductosProveedor, guardarProductoProveedor } from '../../services/comprasService';

const dinero = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fecha = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('es-AR') : '—');
const inp = 'w-full border p-3 rounded-xl text-sm';
const lbl = 'text-xs font-semibold text-slate-500 block mb-1';
const VACIO = { id: null, nombre: '', contacto: '', telefono: '', email: '', direccion: '', cuit: '', notas: '', estado: 'activo' };

function DetalleProveedor({ proveedor, compras, articulos, unidades, onClose, onEditar, toast }) {
  const [productos, setProductos] = useState([]);
  const [nuevo, setNuevo] = useState({ articulo_id: '', codigo_proveedor: '', precio_referencia: '', unidad_codigo: '' });
  const cargar = () => listarProductosProveedor(proveedor.id).then(setProductos).catch((e) => alert(e.message));
  useEffect(() => { cargar(); }, [proveedor.id]);

  const agregar = async (e) => {
    e.preventDefault();
    try {
      await guardarProductoProveedor({ proveedor_id: proveedor.id, ...nuevo, precio_referencia: nuevo.precio_referencia === '' ? null : Number(nuevo.precio_referencia) });
      setNuevo({ articulo_id: '', codigo_proveedor: '', precio_referencia: '', unidad_codigo: '' });
      toast('Producto agregado al proveedor');
      cargar();
    } catch (err) { alert(err.message); }
  };

  const opciones = articulos.filter((a) => a.estado === 'activo' && a.controla_stock && TIPOS_COMPRABLES.includes(a.tipo));
  const historial = compras.filter((c) => c.proveedor_id === proveedor.id).slice(0, 15);

  return (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 max-h-full overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-800">{proveedor.nombre}</h3>
          <div className="flex items-center gap-2">
            <button onClick={onEditar} className="text-slate-400 hover:text-[#0100FD]"><Edit3 className="w-4 h-4" /></button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="text-xs text-slate-600 space-y-0.5">
          {proveedor.contacto && <p>Contacto: {proveedor.contacto}</p>}
          {proveedor.telefono && <p>Tel: {proveedor.telefono}{proveedor.email ? ` • ${proveedor.email}` : ''}</p>}
          {proveedor.direccion && <p>{proveedor.direccion}</p>}
          {proveedor.cuit && <p>CUIT: {proveedor.cuit}</p>}
          {proveedor.notas && <p className="text-slate-400">{proveedor.notas}</p>}
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Productos que suministra</h4>
          {productos.length === 0 && <p className="text-xs text-slate-400">Todavía no hay productos. Se agregan solos al recibir una compra, o podés cargarlos acá.</p>}
          {productos.map((p) => (
            <div key={p.id} className="border border-slate-200 rounded-xl p-2.5 text-xs flex justify-between gap-2">
              <div><p className="font-bold text-slate-800">{p.articulo_nombre}</p>
                <p className="text-slate-500">{TIPOS_ARTICULO[p.articulo_tipo]}{p.codigo_proveedor ? ` • Cód. ${p.codigo_proveedor}` : ''}{p.ultima_compra ? ` • Última compra ${fecha(p.ultima_compra)}` : ''}</p></div>
              <p className="font-black text-slate-800 shrink-0">{p.precio_referencia != null ? `${dinero(p.precio_referencia)} / ${p.unidad_codigo || p.unidad_stock}` : 'Sin precio'}</p>
            </div>
          ))}
          <form onSubmit={agregar} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="col-span-2"><label className={lbl}>Agregar producto</label>
              <select required className={inp + ' bg-white'} value={nuevo.articulo_id} onChange={(e) => setNuevo({ ...nuevo, articulo_id: e.target.value, unidad_codigo: articulos.find((a) => a.id === e.target.value)?.unidad_codigo || '' })}>
                <option value="">-- Elegir --</option>{opciones.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select></div>
            <div><label className={lbl}>Precio ref. $</label><input type="number" min="0" step="any" className={inp} value={nuevo.precio_referencia} onChange={(e) => setNuevo({ ...nuevo, precio_referencia: e.target.value })} /></div>
            <div><label className={lbl}>Unidad</label>
              <select className={inp + ' bg-white'} value={nuevo.unidad_codigo} onChange={(e) => setNuevo({ ...nuevo, unidad_codigo: e.target.value })}>
                {unidades.map((u) => <option key={u.codigo} value={u.codigo}>{u.codigo}</option>)}</select></div>
            <button type="submit" className="bg-[#0100FD] text-white text-xs font-bold py-3 rounded-xl">Agregar</button>
          </form>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Historial de compras</h4>
          {historial.length === 0 && <p className="text-xs text-slate-400">Sin compras registradas.</p>}
          {historial.map((c) => (
            <div key={c.id} className="border border-slate-200 rounded-xl p-2.5 text-xs flex justify-between">
              <span>N° {c.numero} • {fecha(c.fecha_compra)} • {c.estado}</span><span className="font-black">{dinero(c.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProveedoresPage({ proveedores, compras, articulos, unidades, recargar, toast }) {
  const [form, setForm] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const set = (c) => (e) => setForm((f) => ({ ...f, [c]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await guardarProveedor(form);
      toast(form.id ? 'Proveedor actualizado' : 'Proveedor creado');
      setForm(null);
      await recargar();
    } catch (err) { alert(err.message); } finally { setGuardando(false); }
  };

  return (
    <div className="space-y-3">
      <button onClick={() => setForm({ ...VACIO })} className="w-full bg-[#0100FD] hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition">
        <Plus className="w-5 h-5" /> Nuevo proveedor
      </button>
      {proveedores.length === 0 && <p className="text-xs text-slate-400 text-center py-8 bg-white rounded-2xl border">No hay proveedores. Creá el primero para poder registrar compras.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {proveedores.map((p) => (
          <button key={p.id} onClick={() => setDetalle(p)} className={`text-left bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition ${p.estado === 'inactivo' ? 'opacity-60' : ''}`}>
            <h4 className="font-bold text-sm text-slate-800">{p.nombre} {p.estado === 'inactivo' && <span className="text-[10px] font-normal text-slate-400">(inactivo)</span>}</h4>
            {p.telefono && <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1"><Phone className="w-3 h-3 text-[#0100FD]" /> {p.telefono}</p>}
            {p.direccion && <p className="text-xs text-slate-500 flex items-center gap-1.5"><MapPin className="w-3 h-3 text-slate-400" /> {p.direccion}</p>}
            <p className="text-[11px] text-slate-400 mt-2">{p.compras_recibidas} compras • {dinero(p.total_comprado)}{p.ultima_compra ? ` • última ${fecha(p.ultima_compra)}` : ''}</p>
          </button>
        ))}
      </div>

      {detalle && (
        <DetalleProveedor proveedor={detalle} compras={compras} articulos={articulos} unidades={unidades} toast={toast}
          onClose={() => setDetalle(null)}
          onEditar={() => { setForm({ ...VACIO, ...Object.fromEntries(Object.entries(detalle).filter(([k]) => k in VACIO).map(([k, v]) => [k, v ?? ''])) }); setDetalle(null); }} />
      )}

      {form && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 max-h-full overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800">{form.id ? 'Editar proveedor' : 'Nuevo proveedor'}</h3>
              <button onClick={() => setForm(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardar} className="space-y-3">
              <div><label className={lbl}>Nombre / razón social</label><input required className={inp} value={form.nombre} onChange={set('nombre')} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Contacto</label><input className={inp} value={form.contacto} onChange={set('contacto')} /></div>
                <div><label className={lbl}>Teléfono</label><input className={inp} value={form.telefono} onChange={set('telefono')} /></div>
                <div><label className={lbl}>Email</label><input type="email" className={inp} value={form.email} onChange={set('email')} /></div>
                <div><label className={lbl}>CUIT</label><input className={inp} value={form.cuit} onChange={set('cuit')} /></div>
              </div>
              <div><label className={lbl}>Dirección</label><input className={inp} value={form.direccion} onChange={set('direccion')} /></div>
              <div><label className={lbl}>Notas</label><input className={inp} value={form.notas} onChange={set('notas')} /></div>
              {form.id && <label className="text-xs text-slate-600 flex items-center gap-2"><input type="checkbox" checked={form.estado === 'activo'} onChange={(e) => setForm({ ...form, estado: e.target.checked ? 'activo' : 'inactivo' })} /> Proveedor activo</label>}
              <button type="submit" disabled={guardando} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition">{guardando ? 'Guardando…' : 'Guardar proveedor'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
