import React, { useMemo, useState } from 'react';
import { Search, X, Minus, Plus, CheckCircle } from 'lucide-react';
import { TIPOS_VENDIBLES } from '../../services/ArticulosService';
import { registrarVenta } from '../../services/ventasService';
import ProductoVariantes from './ProductoVariantes';

export default function VenderPage({ articulos, clientes, recargar, toast }) {
  const [clienteId, setClienteId] = useState('');
  const [carrito, setCarrito] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [medio, setMedio] = useState('Efectivo');
  const [cobrando, setCobrando] = useState(false);

  // Máximo vendible: sin control de stock (a pedido) no tiene tope
  const maxDe = (id) => {
    const a = articulos.find((x) => x.id === id);
    return a && !a.controla_stock ? Infinity : Number(a?.stock || 0);
  };

  const cambiar = (id, delta) => setCarrito((prev) => {
    const nueva = Math.min(Math.max(0, (prev[id] || 0) + delta), maxDe(id));
    const copia = { ...prev };
    if (nueva <= 0) delete copia[id]; else copia[id] = nueva;
    return copia;
  });

  const fijar = (id, valor) => setCarrito((prev) => {
    const q = Math.min(parseFloat(valor) || 0, maxDe(id));
    const copia = { ...prev };
    if (q <= 0) delete copia[id]; else copia[id] = q;
    return copia;
  });

  const agregarVariante = (id, qty) => setCarrito((prev) => ({
    ...prev, [id]: Math.min((prev[id] || 0) + qty, maxDe(id)),
  }));

  const items = useMemo(() => Object.entries(carrito)
    .map(([id, qty]) => ({ ...articulos.find((a) => a.id === id), qty }))
    .filter((i) => i.nombre), [carrito, articulos]);

  const total = items.reduce((acc, i) => acc + Number(i.precio_venta) * i.qty, 0);

  const coincide = (a) => a.nombre.toLowerCase().includes(busqueda.toLowerCase());

  const simples = useMemo(() => articulos.filter((a) =>
    a.estado === 'activo' && !a.articulo_padre_id && !(a.opciones?.length > 0) &&
    TIPOS_VENDIBLES.includes(a.tipo) && Number(a.precio_venta) > 0 && coincide(a)), [articulos, busqueda]);

  const conVariantes = useMemo(() => articulos.filter((a) =>
    a.estado === 'activo' && a.opciones?.length > 0 && coincide(a) &&
    articulos.some((h) => h.articulo_padre_id === a.id && h.estado === 'activo')), [articulos, busqueda]);

  const cobrar = async () => {
    if (items.length === 0) return;
    const c = clientes.find((x) => String(x.id) === String(clienteId));
    setCobrando(true);
    try {
      await registrarVenta({ cliente: c ? `${c.nombre} (${c.telefono})` : 'Cliente Anónimo', metodo: medio, items });
      setCarrito({});
      setClienteId('');
      toast('¡Venta registrada!');
      await recargar();
    } catch (err) {
      alert(err.message);
      await recargar();
    } finally {
      setCobrando(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-7 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wide">Seleccionar Productos</h3>
          <span className="text-xs text-slate-400">Hacé clic o ajustá unidades</span>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input type="text" placeholder="Buscar producto para vender..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-white" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {conVariantes.map((p) => (
            <ProductoVariantes key={p.id} padre={p}
              hijos={articulos.filter((h) => h.articulo_padre_id === p.id)}
              enCarrito={carrito} onAgregar={agregarVariante} />
          ))}

          {simples.map((p) => {
            const cant = carrito[p.id] || 0;
            const elegido = cant > 0;
            const agotado = p.controla_stock && Number(p.stock) <= 0;
            return (
              <div key={p.id} className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${elegido ? 'border-[#0100FD] bg-blue-50/70 shadow-sm ring-1 ring-[#0100FD]' : 'border-slate-200 bg-white hover:border-slate-300'} ${agotado ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-100/60 text-[#0100FD] rounded-md">{p.categoria}</span>
                    <h4 className="font-bold text-sm text-slate-800 mt-1">{p.nombre}</h4>
                    <p className="text-xs font-extrabold text-emerald-600 mt-0.5">${Number(p.precio_venta)} <span className="font-normal text-slate-400">• {agotado ? 'Sin stock' : p.controla_stock ? `${Number(p.stock)} ${p.unidad_codigo}` : 'A pedido'}</span></p>
                  </div>
                  {elegido && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-[#0100FD] bg-white px-2 py-0.5 rounded-full shadow-xs border border-blue-200">
                      <CheckCircle className="w-3.5 h-3.5" /> {cant}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-500">Cantidad:</span>
                  <div className="flex items-center gap-1.5">
                    <button disabled={agotado} onClick={() => cambiar(p.id, -1)} className="w-7 h-7 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center justify-center text-slate-700 shadow-xs"><Minus className="w-3.5 h-3.5" /></button>
                    <input type="number" min="0" step="any" disabled={agotado} value={cant} onChange={(e) => fijar(p.id, e.target.value)} className="w-12 text-center border border-slate-200 rounded-lg py-1 text-xs font-bold bg-white focus:outline-none focus:border-[#0100FD]" />
                    <button disabled={agotado} onClick={() => cambiar(p.id, 1)} className="w-7 h-7 bg-[#0100FD] hover:bg-blue-700 text-white rounded-lg flex items-center justify-center shadow-xs"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="md:col-span-5 space-y-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4 sticky top-4">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide border-b pb-2">Carrito de Venta</h3>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Seleccionar Cliente</label>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full border border-slate-200 p-3 rounded-xl text-sm bg-white">
              <option value="">-- Consumidor final --</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre} - Tel: {c.telefono}</option>)}
            </select>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Elegí productos de la lista para armar la venta.</p>
            ) : items.map((i) => (
              <div key={i.id} className="text-xs flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="min-w-0">
                  <span className="font-bold text-slate-800 block">{i.nombre}</span>
                  <span className="text-slate-500">${Number(i.precio_venta)} x {i.qty} {i.unidad_codigo}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-black text-[#0100FD]">${Number(i.precio_venta) * i.qty}</span>
                  <button onClick={() => cambiar(i.id, -i.qty)} className="text-rose-500 hover:text-rose-700 p-1"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm font-black">
                <span>Total a Cobrar:</span>
                <span className="text-lg text-emerald-600">${total}</span>
              </div>
              <div className="flex gap-2">
                {['Efectivo', 'Transferencia'].map((m) => (
                  <button key={m} onClick={() => setMedio(m)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${medio === m ? 'bg-[#0100FD] text-white shadow-xs' : 'bg-slate-100 text-slate-600'}`}>{m}</button>
                ))}
              </div>
              <button onClick={cobrar} disabled={cobrando} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition">
                {cobrando ? 'Registrando…' : 'Cobrar Venta'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}