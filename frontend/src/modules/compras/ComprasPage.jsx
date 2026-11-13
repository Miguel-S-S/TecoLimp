import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { TIPOS_ARTICULO } from '../../services/ArticulosService';
import { obtenerDetallesCompra, confirmarCompra, anularCompra } from '../../services/comprasService';
import CompraEditor from './CompraEditor';

const dinero = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fecha = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('es-AR') : '—');
const ESTILOS = { borrador: 'bg-amber-50 text-amber-700 border-amber-200', recibida: 'bg-emerald-50 text-emerald-700 border-emerald-200', anulada: 'bg-slate-100 text-slate-500 border-slate-300' };
const ETIQUETAS = { borrador: 'Borrador', recibida: 'Recibida', anulada: 'Anulada' };

function Detalle({ compra, onClose, onEditar, onCambio }) {
  const [lineas, setLineas] = useState([]);
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => { obtenerDetallesCompra(compra.id).then(setLineas).catch((e) => alert(e.message)); }, [compra.id]);

  const porTipo = useMemo(() => {
    const t = {};
    lineas.forEach((l) => { t[l.articulo_tipo] = (t[l.articulo_tipo] || 0) + Number(l.subtotal); });
    return Object.entries(t);
  }, [lineas]);

  const ejecutar = async (accion, mensaje) => {
    setOcupado(true);
    try { await accion(); onCambio(mensaje); } catch (err) { alert(err.message); } finally { setOcupado(false); }
  };

  return (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 max-h-full overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-800">Compra N° {compra.numero}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-0.5">
          <p className="font-bold text-slate-800 text-sm">{compra.proveedor_nombre}</p>
          <p className="text-slate-500">Fecha: {fecha(compra.fecha_compra)}{compra.numero_comprobante ? ` • Comprobante ${compra.numero_comprobante}` : ''} • <span className="font-bold">{ETIQUETAS[compra.estado]}</span></p>
          {compra.notas && <p className="text-slate-500">Notas: {compra.notas}</p>}
          {compra.estado === 'anulada' && <p className="text-rose-600">Anulada: {compra.motivo_anulacion}</p>}
        </div>

        <div className="space-y-2">
          {lineas.map((l) => (
            <div key={l.id} className="border border-slate-200 rounded-xl p-3 text-xs flex justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-slate-800">{l.articulo_nombre}</p>
                <p className="text-slate-500">{TIPOS_ARTICULO[l.articulo_tipo]} • {Number(l.cantidad)} {l.unidad_codigo}
                  {l.es_regalo ? ' • Regalo' : ` × ${dinero(l.costo_unitario)}${Number(l.descuento_pct) ? ` (−${Number(l.descuento_pct)}%)` : ''}`}</p>
                {l.lote_generado && <p className="text-slate-400">Lote {l.lote_generado}{l.fecha_vencimiento ? ` • vence ${fecha(l.fecha_vencimiento)}` : ''}</p>}
                {l.es_regalo && l.costo_referencia != null && <p className="text-slate-400">Costo de referencia: {dinero(l.costo_referencia)}</p>}
              </div>
              <p className="font-black text-slate-800 shrink-0">{dinero(l.subtotal)}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm space-y-1">
          {porTipo.map(([t, v]) => <div key={t} className="flex justify-between text-slate-500 text-xs"><span>{TIPOS_ARTICULO[t]}</span><span>{dinero(v)}</span></div>)}
          <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{dinero(compra.subtotal)}</span></div>
          {Number(compra.descuento) > 0 && <div className="flex justify-between text-slate-600"><span>Descuento</span><span>−{dinero(compra.descuento)}</span></div>}
          <div className="flex justify-between font-black text-slate-900 pt-1 border-t"><span>Total</span><span>{dinero(compra.total)}</span></div>
        </div>

        {compra.estado === 'borrador' && !anulando && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button disabled={ocupado} onClick={onEditar} className="bg-white border border-[#0100FD] text-[#0100FD] py-3 rounded-xl font-bold text-sm">Editar</button>
            <button disabled={ocupado} onClick={() => { if (confirm('Se va a recibir la mercadería: el stock ingresa al inventario con sus lotes. ¿Continuar?')) ejecutar(() => confirmarCompra(compra.id), 'Compra recibida: stock actualizado'); }} className="bg-[#0100FD] disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm">Recibir mercadería</button>
            <button disabled={ocupado} onClick={() => setAnulando(true)} className="bg-white border border-rose-300 text-rose-600 py-3 rounded-xl font-bold text-sm">Anular</button>
          </div>
        )}
        {compra.estado === 'recibida' && !anulando && (
          <button onClick={() => setAnulando(true)} className="w-full bg-white border border-rose-300 text-rose-600 py-3 rounded-xl font-bold text-sm">Anular compra</button>
        )}
        {anulando && (
          <div className="space-y-2 border border-rose-200 rounded-2xl p-3">
            <p className="text-xs text-slate-500">{compra.estado === 'recibida' ? 'Se revierte el ingreso con movimientos inversos. Solo es posible si ninguno de los lotes se usó o ajustó.' : 'El borrador se descarta.'}</p>
            <input className="w-full border p-2.5 rounded-xl text-sm" placeholder="Motivo (obligatorio)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setAnulando(false)} className="bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-sm">Cancelar</button>
              <button disabled={ocupado || !motivo.trim()} onClick={() => ejecutar(() => anularCompra(compra.id, motivo), 'Compra anulada')} className="bg-rose-600 disabled:opacity-40 text-white py-2.5 rounded-xl font-bold text-sm">Confirmar anulación</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComprasPage({ compras, proveedores, articulos, unidades, recargar, toast }) {
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('Todos');
  const [proveedor, setProveedor] = useState('Todos');
  const [detalle, setDetalle] = useState(null);
  const [editor, setEditor] = useState(null); // { compra, detalles }

  const visibles = useMemo(() => compras.filter((c) =>
    (estado === 'Todos' || c.estado === estado) &&
    (proveedor === 'Todos' || String(c.proveedor_id) === proveedor) &&
    (c.proveedor_nombre + ' ' + c.numero + ' ' + (c.numero_comprobante || '')).toLowerCase().includes(busqueda.toLowerCase())),
  [compras, busqueda, estado, proveedor]);

  const recibidas = compras.filter((c) => c.estado === 'recibida');
  const mes = new Date().toISOString().slice(0, 7);
  const totalMes = recibidas.filter((c) => c.fecha_compra.startsWith(mes)).reduce((t, c) => t + Number(c.total), 0);
  const pendientes = compras.filter((c) => c.estado === 'borrador').length;

  const editarBorrador = async (c) => {
    try { setEditor({ compra: c, detalles: await obtenerDetallesCompra(c.id) }); setDetalle(null); } catch (e) { alert(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white border border-slate-200 rounded-2xl p-3"><p className="text-[10px] uppercase font-bold text-slate-400">Comprado este mes</p><p className="font-black text-sm text-slate-800">{dinero(totalMes)}</p></div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3"><p className="text-[10px] uppercase font-bold text-amber-700">Borradores por recibir</p><p className="font-black text-sm text-amber-700">{pendientes}</p></div>
      </div>

      <button onClick={() => setEditor({ compra: null, detalles: [] })} className="w-full bg-[#0100FD] hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition">
        <Plus className="w-5 h-5" /> Nueva compra
      </button>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input type="text" placeholder="Buscar por proveedor, número o comprobante..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm" />
        </div>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-semibold text-slate-700">
          <option value="Todos">Estado: Todos</option>
          {Object.entries(ETIQUETAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={proveedor} onChange={(e) => setProveedor(e.target.value)} className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-semibold text-slate-700">
          <option value="Todos">Proveedor: Todos</option>
          {proveedores.map((p) => <option key={p.id} value={String(p.id)}>{p.nombre}</option>)}
        </select>
      </div>

      {visibles.length === 0 && <p className="text-xs text-slate-400 text-center py-8 bg-white rounded-2xl border">No hay compras para mostrar. Registrá la primera con el botón de arriba.</p>}

      <div className="space-y-2">
        {visibles.map((c) => (
          <button key={c.id} onClick={() => setDetalle(c)} className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition">
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-800 truncate">N° {c.numero} • {c.proveedor_nombre}</p>
              <p className="text-xs text-slate-500">{fecha(c.fecha_compra)} • {c.items} artículos{c.numero_comprobante ? ` • ${c.numero_comprobante}` : ''}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-black text-sm text-slate-900">{dinero(c.total)}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${ESTILOS[c.estado]}`}>{ETIQUETAS[c.estado]}</span>
            </div>
          </button>
        ))}
      </div>

      {detalle && (
        <Detalle compra={detalle} onClose={() => setDetalle(null)} onEditar={() => editarBorrador(detalle)}
          onCambio={async (msg) => { setDetalle(null); toast(msg); await recargar(); }} />
      )}
      {editor && (
        <CompraEditor compra={editor.compra} detalles={editor.detalles} proveedores={proveedores} articulos={articulos} unidades={unidades}
          onClose={() => setEditor(null)} onSaved={async (msg) => { setEditor(null); toast(msg); await recargar(); }} />
      )}
    </div>
  );
}
