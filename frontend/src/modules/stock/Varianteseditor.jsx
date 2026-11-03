import React, { useMemo, useState } from 'react';
import { X, Plus, Trash2, Wand2 } from 'lucide-react';
import { guardarProductoConVariantes, ajustarStock } from '../../services/ArticulosService';

const parsear = (grupos) => grupos
  .map((g) => ({
    nombre: g.nombre.trim(),
    valores: [...new Set(g.valoresTxt.split(',').map((v) => v.trim()).filter(Boolean))],
  }))
  .filter((g) => g.nombre && g.valores.length);

const clave = (atributos, grupos) => grupos.map((g) => atributos[g.nombre]).join('|');

const combinar = (grupos) => grupos.reduce(
  (acc, g) => acc.flatMap((c) => g.valores.map((v) => ({ ...c, [g.nombre]: v }))), [{}]);

export default function VariantesEditor({ articulos, padre, categorias, unidades, onClose, onSaved }) {
  const hijosActuales = useMemo(
    () => (padre ? articulos.filter((h) => h.articulo_padre_id === padre.id && h.estado === 'activo') : []),
    [articulos, padre]);

  const [f, setF] = useState({
    nombre: padre?.nombre || '', descripcion: padre?.descripcion || '', imagen_url: padre?.imagen_url || '',
    tipo: padre?.tipo || 'ProductoElaborado', categoria_id: padre?.categoria_id || categorias[0]?.id || '',
    unidad_codigo: padre?.unidad_codigo || 'L', controla_stock: true,
  });
  const [grupos, setGrupos] = useState(
    padre?.opciones?.length
      ? padre.opciones.map((o) => ({ nombre: o.nombre, valoresTxt: o.valores.join(', ') }))
      : [{ nombre: 'Aroma', valoresTxt: '' }]);
  const [filas, setFilas] = useState(() => {
    const gs = (padre?.opciones || []).map((o) => ({ nombre: o.nombre, valores: o.valores }));
    return hijosActuales.map((h) => ({
      key: clave(h.atributos, gs), id: h.id, atributos: h.atributos,
      precio_venta: h.precio_venta, precio_anterior: h.precio_anterior ?? '',
      stock: h.stock, stockOriginal: Number(h.stock),
    }));
  });
  const [bulk, setBulk] = useState({ grupo: '', valor: '', precio: '', anterior: '' });
  const [guardando, setGuardando] = useState(false);

  const gs = parsear(grupos);
  const setCampo = (c) => (e) => setF((x) => ({ ...x, [c]: e.target.value }));
  const setFila = (key, c, v) => setFilas((fs) => fs.map((r) => (r.key === key ? { ...r, [c]: v } : r)));

  const generar = () => {
    if (!gs.length) return alert('Definí al menos una opción con valores (separados por coma)');
    const previas = new Map(filas.map((r) => [r.key, r]));
    setFilas(combinar(gs).map((atributos) => {
      const key = clave(atributos, gs);
      return previas.get(key) || { key, id: null, atributos, precio_venta: '', precio_anterior: '', stock: 0, stockOriginal: 0 };
    }));
  };

  const aplicarPrecio = () => {
    if (!bulk.grupo || !bulk.valor || !bulk.precio) return alert('Elegí opción, valor y precio');
    setFilas((fs) => fs.map((r) => (r.atributos[bulk.grupo] === bulk.valor
      ? { ...r, precio_venta: bulk.precio, precio_anterior: bulk.anterior } : r)));
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!filas.length) return alert('Generá las combinaciones antes de guardar');
    setGuardando(true);
    try {
      const id = await guardarProductoConVariantes({
        id: padre?.id || null, ...f, opciones: gs,
        variantes: filas.map((r) => ({
          atributos: r.atributos, precio_venta: Number(r.precio_venta || 0),
          precio_anterior: r.precio_anterior === '' ? null : Number(r.precio_anterior),
          stock_inicial: r.id ? 0 : Number(r.stock || 0),
        })),
      });
      for (const r of filas) {
        if (r.id && Number(r.stock) !== r.stockOriginal) {
          await ajustarStock(r.id, Number(r.stock), 'Ajuste desde edición de producto');
        }
      }
      onSaved(padre ? 'Producto actualizado' : 'Producto con variantes creado', id);
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const inp = 'w-full border p-2.5 rounded-xl text-sm';
  const lbl = 'text-xs font-semibold text-slate-500 block mb-1';

  return (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 max-h-full overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-800">{padre ? 'Editar producto con variantes' : 'Nuevo producto con variantes'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={guardar} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><label className={lbl}>Nombre del producto</label>
              <input className={inp} required value={f.nombre} onChange={setCampo('nombre')} placeholder="Ej: Suavizante de telas Triple Perfume" /></div>
            <div><label className={lbl}>Tipo</label>
              <select className={inp + ' bg-white'} value={f.tipo} onChange={setCampo('tipo')}>
                <option value="ProductoElaborado">Elaborado</option><option value="ProductoReventa">Reventa</option></select></div>
            <div><label className={lbl}>Unidad base</label>
              <select className={inp + ' bg-white'} value={f.unidad_codigo} onChange={setCampo('unidad_codigo')}>
                {unidades.map((u) => <option key={u.codigo} value={u.codigo}>{u.nombre} ({u.codigo})</option>)}</select></div>
            <div><label className={lbl}>Categoría</label>
              <select className={inp + ' bg-white'} value={f.categoria_id} onChange={setCampo('categoria_id')}>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
            <div><label className={lbl}>URL de la imagen (opcional)</label>
              <input className={inp} value={f.imagen_url} onChange={setCampo('imagen_url')} placeholder="https://..." /></div>
            <div className="sm:col-span-2"><label className={lbl}>Descripción (opcional)</label>
              <textarea className={inp} rows={3} value={f.descripcion} onChange={setCampo('descripcion')} /></div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Opciones a elegir</h4>
              <button type="button" onClick={() => setGrupos((g) => [...g, { nombre: '', valoresTxt: '' }])} className="text-xs font-bold text-[#0100FD] flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Agregar opción</button>
            </div>
            {grupos.map((g, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input className={inp + ' col-span-4'} placeholder="Ej: Aroma" value={g.nombre} onChange={(e) => setGrupos((x) => x.map((y, j) => (j === i ? { ...y, nombre: e.target.value } : y)))} />
                <input className={inp + ' col-span-7'} placeholder="Valores separados por coma: Viverin, Downies, Coniglio" value={g.valoresTxt} onChange={(e) => setGrupos((x) => x.map((y, j) => (j === i ? { ...y, valoresTxt: e.target.value } : y)))} />
                <button type="button" onClick={() => setGrupos((x) => x.filter((_, j) => j !== i))} className="col-span-1 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <p className="text-[11px] text-slate-400">Ejemplos: Aroma, Tipo de pasta, Cantidad (5 L, 10 L, 20 L), Envase. Si cambiás nombres o valores, las combinaciones que ya no existan se desactivan (no se borran).</p>
            <button type="button" onClick={generar} className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2"><Wand2 className="w-4 h-4" /> Generar combinaciones ({gs.length ? combinar(gs).length : 0})</button>
          </div>

          {filas.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Combinaciones ({filas.length})</h4>
              <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="sm:col-span-3"><label className={lbl}>Aplicar precio a…</label>
                  <select className={inp + ' bg-white'} value={bulk.grupo} onChange={(e) => setBulk({ ...bulk, grupo: e.target.value, valor: '' })}>
                    <option value="">Opción</option>{gs.map((g) => <option key={g.nombre} value={g.nombre}>{g.nombre}</option>)}</select></div>
                <div className="sm:col-span-3"><label className={lbl}>Valor</label>
                  <select className={inp + ' bg-white'} value={bulk.valor} onChange={(e) => setBulk({ ...bulk, valor: e.target.value })}>
                    <option value="">Valor</option>{(gs.find((g) => g.nombre === bulk.grupo)?.valores || []).map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
                <div className="sm:col-span-2"><label className={lbl}>Precio $</label>
                  <input type="number" min="0" step="any" className={inp} value={bulk.precio} onChange={(e) => setBulk({ ...bulk, precio: e.target.value })} /></div>
                <div className="sm:col-span-2"><label className={lbl}>Antes $ (opc.)</label>
                  <input type="number" min="0" step="any" className={inp} value={bulk.anterior} onChange={(e) => setBulk({ ...bulk, anterior: e.target.value })} /></div>
                <button type="button" onClick={aplicarPrecio} className="sm:col-span-2 bg-[#0100FD] text-white text-xs font-bold py-3 rounded-xl">Aplicar</button>
              </div>
              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold uppercase text-slate-400 sticky top-0 bg-white">
                  <span className="col-span-5">Combinación</span><span className="col-span-2">Precio $</span><span className="col-span-2">Antes $</span><span className="col-span-2">Stock</span><span className="col-span-1"></span>
                </div>
                {filas.map((r) => (
                  <div key={r.key} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                    <span className="col-span-5 text-xs text-slate-700">{gs.map((g) => r.atributos[g.nombre]).join(' · ')}</span>
                    <input type="number" min="0" step="any" className="col-span-2 border p-1.5 rounded-lg text-xs" value={r.precio_venta} onChange={(e) => setFila(r.key, 'precio_venta', e.target.value)} />
                    <input type="number" min="0" step="any" className="col-span-2 border p-1.5 rounded-lg text-xs" value={r.precio_anterior} onChange={(e) => setFila(r.key, 'precio_anterior', e.target.value)} />
                    <input type="number" min="0" step="any" disabled={!f.controla_stock && !r.id} className="col-span-2 border p-1.5 rounded-lg text-xs disabled:bg-slate-100" value={r.stock} onChange={(e) => setFila(r.key, 'stock', e.target.value)} />
                    <button type="button" onClick={() => setFilas((fs) => fs.filter((x) => x.key !== r.key))} className="col-span-1 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              {!padre && (
                <label className="text-xs text-slate-600 flex items-center gap-2">
                  <input type="checkbox" checked={f.controla_stock} onChange={(e) => setF((x) => ({ ...x, controla_stock: e.target.checked }))} />
                  Controlar stock de cada combinación (desmarcalo si se prepara a pedido)
                </label>
              )}
            </div>
          )}

          <button type="submit" disabled={guardando} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition shadow-sm">
            {guardando ? 'Guardando…' : 'Guardar producto'}
          </button>
        </form>
      </div>
    </div>
  );
}