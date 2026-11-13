import React, { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { listarDetallesVenta, listarLotesVenta, listarPagosVenta, registrarPagoVenta, anularPagoVenta, anularVenta } from '../../services/ventasService';

const dinero = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (n) => Number(n).toLocaleString('es-AR', { maximumFractionDigits: 4 });
const fechaHora = (iso) => new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
const ESTILO_VENTA = { confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-200', anulada: 'bg-slate-100 text-slate-500 border-slate-300' };
const ESTILO_PAGO = { pagada: 'bg-emerald-50 text-emerald-700 border-emerald-200', parcial: 'bg-amber-50 text-amber-700 border-amber-200', pendiente: 'bg-rose-50 text-rose-700 border-rose-200' };
const ETQ_ENTREGA = { no_aplica: 'Sin envío', pendiente: 'Entrega pendiente', en_camino: 'En camino', entregada: 'Entregada', cancelada: 'Entrega cancelada' };
const inp = 'w-full border p-2.5 rounded-xl text-sm';

function Detalle({ venta, medios, onClose, onCambio }) {
  const [detalles, setDetalles] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [nuevoPago, setNuevoPago] = useState(null);
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const cargar = () => Promise.all([listarDetallesVenta(venta.id), listarLotesVenta(venta.id), listarPagosVenta(venta.id)])
    .then(([d, l, p]) => { setDetalles(d); setLotes(l); setPagos(p); }).catch((e) => alert(e.message));
  useEffect(() => { cargar(); }, [venta.id]);

  const ejecutar = async (accion, mensaje, cerrar) => {
    setOcupado(true);
    try { await accion(); onCambio(mensaje, cerrar); if (!cerrar) await cargar(); } catch (err) { alert(err.message); } finally { setOcupado(false); }
  };

  const activos = medios.filter((m) => m.activo);

  return (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 max-h-full overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-800">Venta N° {venta.numero}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-0.5">
          <p className="font-bold text-slate-800 text-sm">{venta.cliente_nombre}</p>
          <p className="text-slate-500">{fechaHora(venta.fecha)} • {venta.estado_venta} • Pago: {venta.estado_pago} • {ETQ_ENTREGA[venta.estado_entrega]}</p>
          {venta.notas && <p className="text-slate-500">Notas: {venta.notas}</p>}
          {venta.estado_venta === 'anulada' && <p className="text-rose-600">Anulada: {venta.motivo_anulacion}</p>}
        </div>

        <div className="space-y-2">
          {detalles.map((d) => (
            <div key={d.id} className="border border-slate-200 rounded-xl p-3 text-xs">
              <div className="flex justify-between gap-3">
                <div className="min-w-0"><p className="font-bold text-slate-800">{d.descripcion}</p>
                  <p className="text-slate-500">{num(d.cantidad)} {d.unidad_codigo} × {dinero(d.precio_unitario)}{Number(d.descuento_pct) ? ` (−${num(d.descuento_pct)}%)` : ''} • costo {dinero(d.costo_unitario)}</p></div>
                <p className="font-black text-slate-800 shrink-0">{dinero(d.subtotal)}</p>
              </div>
              {lotes.filter((l) => l.detalle_id === d.id).map((l) => (
                <p key={l.id} className="text-[11px] text-slate-400">Lote {l.codigo_lote}: {num(l.cantidad)} {d.unidad_codigo}</p>
              ))}
            </div>
          ))}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm space-y-1">
          <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{dinero(venta.subtotal)}</span></div>
          {Number(venta.descuento) > 0 && <div className="flex justify-between text-slate-600"><span>Descuento</span><span>−{dinero(venta.descuento)}</span></div>}
          {venta.es_con_envio && <div className="flex justify-between text-slate-600"><span>Envío</span><span>{dinero(venta.envio)}</span></div>}
          <div className="flex justify-between font-black text-slate-900 pt-1 border-t"><span>Total</span><span>{dinero(venta.total)}</span></div>
          <div className="flex justify-between text-slate-600"><span>Pagado</span><span>{dinero(venta.pagado)}</span></div>
          {venta.estado_venta === 'confirmada' && <div className="flex justify-between font-bold text-amber-700"><span>Saldo</span><span>{dinero(venta.saldo)}</span></div>}
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pagos</h4>
          {pagos.length === 0 && <p className="text-xs text-slate-400">Sin pagos registrados.</p>}
          {pagos.map((p) => (
            <div key={p.id} className={`border border-slate-200 rounded-xl p-2.5 text-xs flex justify-between items-center gap-2 ${p.estado === 'anulado' ? 'opacity-50 line-through' : ''}`}>
              <span>{fechaHora(p.fecha)} • {p.medio_pago}{p.referencia ? ` (${p.referencia})` : ''}</span>
              <span className="flex items-center gap-2"><strong>{dinero(p.monto)}</strong>
                {p.estado === 'registrado' && venta.estado_venta === 'confirmada' && (
                  <button disabled={ocupado} onClick={() => { const m = prompt('Motivo de la anulación del pago:'); if (m && m.trim()) ejecutar(() => anularPagoVenta(p.id, m), 'Pago anulado', false); }} className="text-rose-500 no-underline text-[11px] font-bold">Anular</button>)}
              </span>
            </div>
          ))}
          {venta.estado_venta === 'confirmada' && Number(venta.saldo) > 0 && !nuevoPago && (
            <button onClick={() => setNuevoPago({ medio: activos[0]?.id || '', monto: venta.saldo, ref: '' })} className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 py-2.5 rounded-xl font-bold text-sm">Registrar pago del saldo</button>
          )}
          {nuevoPago && (
            <div className="grid grid-cols-12 gap-2 items-center">
              <select className="col-span-4 border p-2 rounded-lg text-xs bg-white" value={nuevoPago.medio} onChange={(e) => setNuevoPago({ ...nuevoPago, medio: e.target.value })}>{activos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}</select>
              <input type="number" min="0" step="any" className="col-span-3 border p-2 rounded-lg text-xs text-right" value={nuevoPago.monto} onChange={(e) => setNuevoPago({ ...nuevoPago, monto: e.target.value })} />
              <input className="col-span-2 border p-2 rounded-lg text-xs" placeholder="Ref." value={nuevoPago.ref} onChange={(e) => setNuevoPago({ ...nuevoPago, ref: e.target.value })} />
              <button disabled={ocupado} onClick={() => ejecutar(() => registrarPagoVenta(venta.id, nuevoPago.medio, Number(nuevoPago.monto), nuevoPago.ref || null).then(() => setNuevoPago(null)), 'Pago registrado', false)} className="col-span-2 bg-[#0100FD] text-white text-xs font-bold py-2.5 rounded-lg">OK</button>
              <button onClick={() => setNuevoPago(null)} className="col-span-1 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
          )}
        </div>

        {venta.estado_venta === 'confirmada' && !anulando && (
          <button onClick={() => setAnulando(true)} className="w-full bg-white border border-rose-300 text-rose-600 py-3 rounded-xl font-bold text-sm">Anular venta</button>
        )}
        {anulando && (
          <div className="space-y-2 border border-rose-200 rounded-2xl p-3">
            <p className="text-xs text-slate-500">Se devuelve el stock a los mismos lotes, se anulan los pagos y se cancela la entrega pendiente.</p>
            <input className={inp} placeholder="Motivo (obligatorio)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setAnulando(false)} className="bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-sm">Cancelar</button>
              <button disabled={ocupado || !motivo.trim()} onClick={() => ejecutar(() => anularVenta(venta.id, motivo), 'Venta anulada', true)} className="bg-rose-600 disabled:opacity-40 text-white py-2.5 rounded-xl font-bold text-sm">Confirmar anulación</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistorialVentasPage({ ventas, medios, recargar, toast }) {
  const [busqueda, setBusqueda] = useState('');
  const [estadoVenta, setEstadoVenta] = useState('Todos');
  const [estadoPago, setEstadoPago] = useState('Todos');
  const [estadoEntrega, setEstadoEntrega] = useState('Todos');
  const [abierta, setAbierta] = useState(null);

  const visibles = useMemo(() => ventas.filter((v) =>
    (estadoVenta === 'Todos' || v.estado_venta === estadoVenta) && (estadoPago === 'Todos' || v.estado_pago === estadoPago)
    && (estadoEntrega === 'Todos' || v.estado_entrega === estadoEntrega)
    && (v.cliente_nombre + ' ' + v.numero).toLowerCase().includes(busqueda.toLowerCase())), [ventas, busqueda, estadoVenta, estadoPago, estadoEntrega]);

  const confirmadas = ventas.filter((v) => v.estado_venta === 'confirmada');
  const hoy = new Date().toDateString();
  const totalHoy = confirmadas.filter((v) => new Date(v.fecha).toDateString() === hoy).reduce((t, v) => t + Number(v.total), 0);
  const porCobrar = confirmadas.reduce((t, v) => t + Number(v.saldo), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white border border-slate-200 rounded-2xl p-3"><p className="text-[10px] uppercase font-bold text-slate-400">Vendido hoy</p><p className="font-black text-sm text-slate-800">{dinero(totalHoy)}</p></div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3"><p className="text-[10px] uppercase font-bold text-amber-700">Por cobrar</p><p className="font-black text-sm text-amber-700">{dinero(porCobrar)}</p></div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input type="text" placeholder="Buscar por cliente o número..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm" />
        </div>
        <select value={estadoVenta} onChange={(e) => setEstadoVenta(e.target.value)} className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-semibold text-slate-700">
          <option value="Todos">Venta: Todas</option><option value="confirmada">Confirmadas</option><option value="anulada">Anuladas</option></select>
        <select value={estadoPago} onChange={(e) => setEstadoPago(e.target.value)} className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-semibold text-slate-700">
          <option value="Todos">Pago: Todos</option><option value="pagada">Pagadas</option><option value="parcial">Parciales</option><option value="pendiente">Pendientes</option></select>
        <select value={estadoEntrega} onChange={(e) => setEstadoEntrega(e.target.value)} className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-semibold text-slate-700">
          <option value="Todos">Entrega: Todas</option>{Object.entries(ETQ_ENTREGA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </div>
      {visibles.length === 0 && <p className="text-xs text-slate-400 text-center py-8 bg-white rounded-2xl border">No hay ventas para mostrar.</p>}
      <div className="space-y-2">
        {visibles.map((v) => (
          <button key={v.id} onClick={() => setAbierta(v)} className={`w-full text-left bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition ${v.estado_venta === 'anulada' ? 'opacity-60' : ''}`}>
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-800 truncate">N° {v.numero} • {v.cliente_nombre}</p>
              <p className="text-xs text-slate-500">{fechaHora(v.fecha)} • {v.items} renglones{v.es_con_envio ? ` • ${ETQ_ENTREGA[v.estado_entrega]}` : ''}</p>
            </div>
            <div className="text-right shrink-0 space-y-0.5">
              <p className="font-black text-sm text-slate-900">{dinero(v.total)}</p>
              <div className="flex gap-1 justify-end">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${ESTILO_VENTA[v.estado_venta]}`}>{v.estado_venta}</span>
                {v.estado_venta === 'confirmada' && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${ESTILO_PAGO[v.estado_pago]}`}>{v.estado_pago}</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
      {abierta && ventas.find((v) => v.id === abierta.id) && <Detalle venta={ventas.find((v) => v.id === abierta.id)} medios={medios} onClose={() => setAbierta(null)}
        onCambio={async (msg, cerrar) => { toast(msg); await recargar(); if (cerrar) setAbierta(null); }} />}
    </div>
  );
}
