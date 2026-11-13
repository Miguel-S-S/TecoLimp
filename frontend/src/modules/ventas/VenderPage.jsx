import React, { useMemo, useState } from 'react';
import { Search, X, Minus, Plus, CheckCircle, Trash2 } from 'lucide-react';
import { TIPOS_VENDIBLES } from '../../services/articulosService';
import { registrarVenta } from '../../services/ventasService';
import ProductoVariantes from './ProductoVariantes';

const dinero = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const redondear = (n) => Math.round(n * 100) / 100;
const subtotalLinea = (art, l) => redondear(Number(l.cantidad) * Number(art.precio_venta) * (1 - Number(l.descuento_pct || 0) / 100));
const inp = 'w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-white';
const lbl = 'text-[11px] font-semibold text-slate-500 block mb-1';

export default function VenderPage({ articulos, clientes, medios, parametros, recargar, toast }) {
  const [clienteId, setClienteId] = useState('');
  const [carrito, setCarrito] = useState({});          // { articuloId: { cantidad, descuento_pct } }
  const [busqueda, setBusqueda] = useState('');
  const [descuento, setDescuento] = useState('');
  const [conEnvio, setConEnvio] = useState(false);
  const [envioMonto, setEnvioMonto] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fechaPrevista, setFechaPrevista] = useState('');
  const [horario, setHorario] = useState('');
  const [notas, setNotas] = useState('');
  const [pagos, setPagos] = useState([]);              // [{ key, medio_pago_id, monto, referencia }]
  const [cobrando, setCobrando] = useState(false);

  const mediosActivos = medios.filter((m) => m.activo);
  const cliente = clientes.find((c) => String(c.id) === String(clienteId));

  // Máximo vendible: sin control de stock (a pedido) no tiene tope
  const maxDe = (id) => {
    const a = articulos.find((x) => x.id === id);
    return a && !a.controla_stock ? Infinity : Number(a?.stock_disponible ?? a?.stock ?? 0);
  };

  const agregar = (id, qty) => setCarrito((prev) => ({
    ...prev, [id]: { cantidad: Math.min((prev[id]?.cantidad || 0) + qty, maxDe(id)), descuento_pct: prev[id]?.descuento_pct || 0 },
  }));
  const cambiar = (id, delta) => setCarrito((prev) => {
    const q = Math.min(Math.max(0, (prev[id]?.cantidad || 0) + delta), maxDe(id));
    const copia = { ...prev };
    if (q <= 0) delete copia[id]; else copia[id] = { ...prev[id], cantidad: q, descuento_pct: prev[id]?.descuento_pct || 0 };
    return copia;
  });
  const fijarCantidad = (id, valor) => setCarrito((prev) => {
    const q = Math.min(parseFloat(valor) || 0, maxDe(id));
    const copia = { ...prev };
    if (q <= 0) delete copia[id]; else copia[id] = { cantidad: q, descuento_pct: prev[id]?.descuento_pct || 0 };
    return copia;
  });
  const fijarDescuento = (id, valor) => setCarrito((prev) => ({ ...prev, [id]: { ...prev[id], descuento_pct: Math.min(Math.max(parseFloat(valor) || 0, 0), 100) } }));
  const quitar = (id) => setCarrito((prev) => { const c = { ...prev }; delete c[id]; return c; });

  const items = useMemo(() => Object.entries(carrito)
    .map(([id, l]) => ({ art: articulos.find((a) => a.id === id), ...l }))
    .filter((i) => i.art), [carrito, articulos]);

  // Vista previa de importes (el servidor recalcula todo con los precios y parámetros reales)
  const subtotal = items.reduce((t, i) => t + subtotalLinea(i.art, i), 0);
  const desc = Math.min(Number(descuento || 0), subtotal);
  const base = Math.max(subtotal - desc, 0);
  const gratisDesde = Number(parametros.envio_gratis_desde || 0);
  const envioGratis = conEnvio && gratisDesde > 0 && base >= gratisDesde;
  const envio = !conEnvio ? 0 : envioGratis ? 0 : (envioMonto === '' ? Number(parametros.envio_costo_default || 0) : Number(envioMonto));
  const total = redondear(base + envio);
  const pagado = redondear(pagos.reduce((t, p) => t + Number(p.monto || 0), 0));
  const saldo = redondear(total - pagado);

  const nuevoPago = (monto = '') => ({ key: Math.random().toString(36).slice(2), medio_pago_id: mediosActivos[0]?.id || '', monto, referencia: '' });
  const setPago = (key, c, v) => setPagos((ps) => ps.map((p) => (p.key === key ? { ...p, [c]: v } : p)));

  const simples = useMemo(() => articulos.filter((a) =>
    a.estado === 'activo' && !a.articulo_padre_id && !(a.opciones?.length > 0) && TIPOS_VENDIBLES.includes(a.tipo)
    && Number(a.precio_venta) > 0 && a.nombre.toLowerCase().includes(busqueda.toLowerCase())), [articulos, busqueda]);
  const conVariantes = useMemo(() => articulos.filter((a) =>
    a.estado === 'activo' && a.opciones?.length > 0 && a.nombre.toLowerCase().includes(busqueda.toLowerCase())
    && articulos.some((h) => h.articulo_padre_id === a.id && h.estado === 'activo')), [articulos, busqueda]);

  const enCarrito = useMemo(() => Object.fromEntries(Object.entries(carrito).map(([id, l]) => [id, l.cantidad])), [carrito]);

  const sinCliente = !clienteId;
  const bloqueo = items.length === 0 ? 'Agregá productos'
    : pagado > total + 0.005 ? 'El pago supera el total'
    : sinCliente && saldo > 0.005 ? 'Consumidor final: cobrá el total o elegí un cliente' : null;

  const cobrar = async () => {
    if (bloqueo) return;
    setCobrando(true);
    try {
      await registrarVenta({
        cliente_id: clienteId ? Number(clienteId) : null,
        items: items.map((i) => ({ articulo_id: i.art.id, cantidad: Number(i.cantidad), descuento_pct: Number(i.descuento_pct || 0) })),
        descuento: desc, es_con_envio: conEnvio, envio_monto: envioMonto === '' ? null : Number(envioMonto),
        direccion_entrega: direccion || null, fecha_prevista: fechaPrevista || null, horario_preferido: horario || null, notas,
        pagos: pagos.filter((p) => Number(p.monto) > 0).map((p) => ({ medio_pago_id: p.medio_pago_id, monto: Number(p.monto), referencia: p.referencia || null })),
      });
      setCarrito({}); setClienteId(''); setDescuento(''); setConEnvio(false); setEnvioMonto(''); setDireccion('');
      setFechaPrevista(''); setHorario(''); setNotas(''); setPagos([]);
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
            <ProductoVariantes key={p.id} padre={p} hijos={articulos.filter((h) => h.articulo_padre_id === p.id)} enCarrito={enCarrito} onAgregar={agregar} />
          ))}
          {simples.map((p) => {
            const cant = carrito[p.id]?.cantidad || 0;
            const elegido = cant > 0;
            const agotado = p.controla_stock && Number(p.stock_disponible ?? p.stock) <= 0;
            return (
              <div key={p.id} className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${elegido ? 'border-[#0100FD] bg-blue-50/70 shadow-sm ring-1 ring-[#0100FD]' : 'border-slate-200 bg-white hover:border-slate-300'} ${agotado ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-100/60 text-[#0100FD] rounded-md">{p.categoria}</span>
                    <h4 className="font-bold text-sm text-slate-800 mt-1">{p.nombre}</h4>
                    <p className="text-xs font-extrabold text-emerald-600 mt-0.5">{dinero(p.precio_venta)}<span className="font-normal text-slate-400"> / {p.unidad_codigo} • {agotado ? 'Sin stock' : p.controla_stock ? `${Number(p.stock_disponible ?? p.stock)} ${p.unidad_codigo}` : 'A pedido'}</span></p>
                  </div>
                  {elegido && <span className="flex items-center gap-1 text-[11px] font-bold text-[#0100FD] bg-white px-2 py-0.5 rounded-full shadow-xs border border-blue-200"><CheckCircle className="w-3.5 h-3.5" /> {cant}</span>}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-500">Cantidad:</span>
                  <div className="flex items-center gap-1.5">
                    <button disabled={agotado} onClick={() => cambiar(p.id, -1)} className="w-7 h-7 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center justify-center text-slate-700 shadow-xs"><Minus className="w-3.5 h-3.5" /></button>
                    <input type="number" min="0" step="any" disabled={agotado} value={cant} onChange={(e) => fijarCantidad(p.id, e.target.value)} className="w-14 text-center border border-slate-200 rounded-lg py-1 text-xs font-bold bg-white focus:outline-none focus:border-[#0100FD]" />
                    <button disabled={agotado} onClick={() => cambiar(p.id, 1)} className="w-7 h-7 bg-[#0100FD] hover:bg-blue-700 text-white rounded-lg flex items-center justify-center shadow-xs"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="md:col-span-5 space-y-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide border-b pb-2">Carrito de Venta</h3>
          <div>
            <label className={lbl}>Cliente</label>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={inp}>
              <option value="">-- Consumidor final --</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.apellido ? ` ${c.apellido}` : ''} - Tel: {c.telefono}</option>)}
            </select>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {items.length === 0 ? <p className="text-xs text-slate-400 text-center py-6">Elegí productos de la lista para armar la venta.</p>
              : items.map((i) => (
                <div key={i.art.id} className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0"><span className="font-bold text-slate-800 block">{i.art.nombre}</span>
                      <span className="text-slate-500">{dinero(i.art.precio_venta)} / {i.art.unidad_codigo}</span></div>
                    <button onClick={() => quitar(i.art.id)} className="text-rose-500 hover:text-rose-700 p-1"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" step="any" value={i.cantidad} onChange={(e) => fijarCantidad(i.art.id, e.target.value)} className="w-16 border border-slate-200 rounded-lg py-1 text-center font-bold bg-white" title="Cantidad" />
                    <span className="text-slate-400">{i.art.unidad_codigo}</span>
                    <input type="number" min="0" max="100" step="any" value={i.descuento_pct || ''} onChange={(e) => fijarDescuento(i.art.id, e.target.value)} placeholder="% desc." className="w-16 border border-slate-200 rounded-lg py-1 text-center bg-white" title="Descuento del renglón (%)" />
                    <span className="ml-auto font-black text-[#0100FD]">{dinero(subtotalLinea(i.art, i))}</span>
                  </div>
                </div>
              ))}
          </div>

          {items.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2 items-end">
                <div><label className={lbl}>Descuento general $</label><input type="number" min="0" step="any" className={inp} value={descuento} onChange={(e) => setDescuento(e.target.value)} /></div>
                <label className="text-xs text-slate-600 flex items-center gap-2 pb-3"><input type="checkbox" checked={conEnvio} onChange={(e) => setConEnvio(e.target.checked)} /> Con envío</label>
              </div>

              {conEnvio && (
                <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div><label className={lbl}>Dirección de entrega</label><input className={inp} value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder={cliente?.direccion || 'Obligatoria'} /></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className={lbl}>Fecha prevista</label><input type="date" className={inp} value={fechaPrevista} onChange={(e) => setFechaPrevista(e.target.value)} /></div>
                    <div><label className={lbl}>Horario</label><input className={inp} value={horario} onChange={(e) => setHorario(e.target.value)} placeholder="Mañana" /></div>
                    <div><label className={lbl}>Costo envío $</label><input type="number" min="0" step="any" disabled={envioGratis} className={inp + ' disabled:bg-slate-100'} value={envioGratis ? 0 : envioMonto} onChange={(e) => setEnvioMonto(e.target.value)} placeholder={String(parametros.envio_costo_default || 0)} /></div>
                  </div>
                  {envioGratis && <p className="text-[11px] text-emerald-600 font-bold">Envío gratis: la compra supera {dinero(gratisDesde)}</p>}
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{dinero(subtotal)}</span></div>
                {desc > 0 && <div className="flex justify-between text-slate-600"><span>Descuento</span><span>−{dinero(desc)}</span></div>}
                {conEnvio && <div className="flex justify-between text-slate-600"><span>Envío</span><span>{dinero(envio)}</span></div>}
                <div className="flex justify-between font-black text-slate-900 pt-1 border-t"><span>Total a cobrar</span><span className="text-lg text-emerald-600">{dinero(total)}</span></div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pagos</h4>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setPagos([nuevoPago(String(total))])} className="text-xs font-bold text-emerald-600">Cobrar total</button>
                    <button type="button" onClick={() => setPagos((ps) => [...ps, nuevoPago(saldo > 0 ? String(saldo) : '')])} className="text-xs font-bold text-[#0100FD]">+ Agregar pago</button>
                  </div>
                </div>
                {pagos.map((p) => (
                  <div key={p.key} className="grid grid-cols-12 gap-1.5 items-center">
                    <select className="col-span-5 border border-slate-200 p-2 rounded-lg text-xs bg-white" value={p.medio_pago_id} onChange={(e) => setPago(p.key, 'medio_pago_id', e.target.value)}>
                      {mediosActivos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                    <input type="number" min="0" step="any" className="col-span-3 border border-slate-200 p-2 rounded-lg text-xs text-right" value={p.monto} onChange={(e) => setPago(p.key, 'monto', e.target.value)} placeholder="Monto" />
                    <input className="col-span-3 border border-slate-200 p-2 rounded-lg text-xs" value={p.referencia} onChange={(e) => setPago(p.key, 'referencia', e.target.value)} placeholder="Ref." />
                    <button type="button" onClick={() => setPagos((ps) => ps.filter((x) => x.key !== p.key))} className="col-span-1 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {pagos.length === 0 && <p className="text-[11px] text-slate-400">Sin pagos: la venta quedará pendiente de cobro (solo con un cliente elegido).</p>}
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Pagado: <strong>{dinero(pagado)}</strong></span>
                  <span className={saldo > 0.005 ? 'text-amber-600 font-bold' : 'text-slate-500'}>Saldo: {dinero(Math.max(saldo, 0))}</span>
                </div>
              </div>

              <input className={inp} placeholder="Notas de la venta (opcional)" value={notas} onChange={(e) => setNotas(e.target.value)} />
              {bloqueo && items.length > 0 && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{bloqueo}</p>}
              <button onClick={cobrar} disabled={cobrando || !!bloqueo} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-40 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition">
                {cobrando ? 'Registrando…' : saldo > 0.005 ? `Registrar venta (saldo ${dinero(saldo)})` : 'Cobrar venta'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
