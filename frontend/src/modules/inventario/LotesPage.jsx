import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, X, Lock, Unlock, Edit3, SlidersHorizontal, History } from 'lucide-react';
import { ingresarLote, ajustarLote, cambiarEstadoLote, editarLote, listarMovimientos } from '../../services/inventarioService';
import { ListaMovimientos } from './MovimientosPage';

const ESTILOS = {
  disponible: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  por_vencer: 'bg-amber-50 text-amber-700 border-amber-200',
  vencido: 'bg-rose-50 text-rose-700 border-rose-200',
  bloqueado: 'bg-slate-100 text-slate-600 border-slate-300',
};
const ETIQUETAS = { disponible: 'Disponible', por_vencer: 'Por vencer', vencido: 'Vencido', bloqueado: 'Bloqueado' };
const fecha = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('es-AR') : '—');
const dinero = (n) => '$' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 2 });
const inp = 'w-full border p-3 rounded-xl text-sm';
const lbl = 'text-xs font-semibold text-slate-500 block mb-1';

function Modal({ titulo, onClose, children, ancho = 'max-w-md' }) {
  return (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className={`bg-white w-full ${ancho} rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 max-h-full overflow-y-auto`}>
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-800">{titulo}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function LotesPage({ lotes, ubicaciones, articulos, recargar, toast }) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroUbicacion, setFiltroUbicacion] = useState('Todas');
  const [verVacios, setVerVacios] = useState(false);
  const [modal, setModal] = useState(null); // { tipo, lote? }
  const [f, setF] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [movs, setMovs] = useState([]);

  const set = (c) => (e) => setF((x) => ({ ...x, [c]: e.target.value }));
  const abrir = (tipo, lote = null, inicial = {}) => { setF(inicial); setModal({ tipo, lote }); };
  const cerrar = () => setModal(null);

  useEffect(() => {
    if (modal?.tipo !== 'traza') return;
    setMovs([]);
    listarMovimientos({ loteId: modal.lote.id, limite: 100 }).then(setMovs).catch((e) => alert(e.message));
  }, [modal]);

  const ejecutar = async (accion, mensaje) => {
    setGuardando(true);
    try {
      await accion();
      toast(mensaje);
      cerrar();
      await recargar();
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const visibles = useMemo(() => lotes.filter((l) =>
    (verVacios || Number(l.cantidad_actual) > 0) &&
    (l.articulo_nombre + ' ' + l.codigo_lote).toLowerCase().includes(busqueda.toLowerCase()) &&
    (filtroEstado === 'Todos' || l.estado_efectivo === filtroEstado) &&
    (filtroUbicacion === 'Todas' || l.ubicacion_id === filtroUbicacion)),
  [lotes, busqueda, filtroEstado, filtroUbicacion, verVacios]);

  const conStock = lotes.filter((l) => Number(l.cantidad_actual) > 0);
  const valorTotal = conStock.reduce((t, l) => t + Number(l.valor), 0);
  const porVencer = conStock.filter((l) => l.estado_efectivo === 'por_vencer').length;
  const vencidos = conStock.filter((l) => l.estado_efectivo === 'vencido').length;
  const articulosIngreso = articulos.filter((a) => a.estado === 'activo' && a.controla_stock && !(a.opciones?.length > 0));
  const ubicActivas = ubicaciones.filter((u) => u.estado === 'activo');

  const bloquearODesbloquear = (l) => {
    if (l.estado === 'bloqueado') {
      if (confirm(`¿Desbloquear el lote ${l.codigo_lote}?`)) ejecutar(() => cambiarEstadoLote(l.id, 'disponible'), 'Lote desbloqueado');
    } else {
      abrir('bloqueo', l, { motivo: '' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-slate-200 rounded-2xl p-3"><p className="text-[10px] uppercase font-bold text-slate-400">Valor del stock</p><p className="font-black text-sm text-slate-800">{dinero(valorTotal)}</p></div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3"><p className="text-[10px] uppercase font-bold text-amber-700">Por vencer (30 d)</p><p className="font-black text-sm text-amber-700">{porVencer} lotes</p></div>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3"><p className="text-[10px] uppercase font-bold text-rose-700">Vencidos</p><p className="font-black text-sm text-rose-700">{vencidos} lotes</p></div>
      </div>

      <button onClick={() => abrir('ingreso', null, { articulo_id: '', cantidad: '', costo_unitario: '', fecha_elaboracion: '', fecha_vencimiento: '', ubicacion_id: '', codigo_lote: '', nota: '' })} className="w-full bg-[#0100FD] hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition">
        <Plus className="w-5 h-5" /> Ingresar lote
      </button>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input type="text" placeholder="Buscar por artículo o lote..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm" />
        </div>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-semibold text-slate-700">
          <option value="Todos">Estado: Todos</option>
          {Object.entries(ETIQUETAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filtroUbicacion} onChange={(e) => setFiltroUbicacion(e.target.value)} className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-semibold text-slate-700">
          <option value="Todas">Ubicación: Todas</option>
          {ubicaciones.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
      </div>
      <label className="text-xs text-slate-500 flex items-center gap-1.5"><input type="checkbox" checked={verVacios} onChange={(e) => setVerVacios(e.target.checked)} /> Mostrar lotes agotados</label>

      {visibles.length === 0 && <p className="text-xs text-slate-400 text-center py-8 bg-white rounded-2xl border">No hay lotes que coincidan. Ingresá uno con el botón de arriba.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibles.map((l) => (
          <div key={l.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-slate-800 truncate">{l.articulo_nombre}</h4>
                <p className="text-xs text-slate-500">Lote {l.codigo_lote} • {l.ubicacion || 'Sin ubicación'}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${ESTILOS[l.estado_efectivo]}`}>{ETIQUETAS[l.estado_efectivo]}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-slate-600">
              <span>Cantidad: <strong>{Number(l.cantidad_actual)}</strong> / {Number(l.cantidad_inicial)} {l.unidad_codigo}</span>
              <span>Costo: {dinero(l.costo_unitario)}</span>
              <span>Vence: {fecha(l.fecha_vencimiento)}{l.dias_para_vencer != null && l.dias_para_vencer >= 0 ? ` (${l.dias_para_vencer} d)` : ''}</span>
              <span>Ingreso: {fecha(l.fecha_ingreso)}</span>
            </div>
            {l.estado === 'bloqueado' && l.motivo_bloqueo && <p className="text-[11px] text-slate-500 bg-slate-50 rounded-lg p-2">Motivo: {l.motivo_bloqueo}</p>}
            <div className="flex gap-1 pt-1 border-t border-slate-100">
              <button onClick={() => abrir('ajuste', l, { cantidad: l.cantidad_actual, motivo: '' })} title="Ajustar cantidad" className="p-2 text-slate-400 hover:text-[#0100FD]"><SlidersHorizontal className="w-4 h-4" /></button>
              <button onClick={() => abrir('editar', l, { ubicacion_id: l.ubicacion_id || '', fecha_elaboracion: l.fecha_elaboracion || '', fecha_vencimiento: l.fecha_vencimiento || '' })} title="Editar ubicación y fechas" className="p-2 text-slate-400 hover:text-[#0100FD]"><Edit3 className="w-4 h-4" /></button>
              <button onClick={() => bloquearODesbloquear(l)} title={l.estado === 'bloqueado' ? 'Desbloquear' : 'Bloquear'} className="p-2 text-slate-400 hover:text-amber-600">{l.estado === 'bloqueado' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}</button>
              <button onClick={() => abrir('traza', l)} title="Trazabilidad" className="p-2 text-slate-400 hover:text-[#0100FD] ml-auto"><History className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {modal?.tipo === 'ingreso' && (
        <Modal titulo="Ingresar lote" onClose={cerrar}>
          <form className="space-y-3" onSubmit={(e) => {
            e.preventDefault();
            ejecutar(() => ingresarLote({
              articulo_id: f.articulo_id, cantidad: Number(f.cantidad),
              costo_unitario: f.costo_unitario === '' ? null : Number(f.costo_unitario),
              fecha_elaboracion: f.fecha_elaboracion || null, fecha_vencimiento: f.fecha_vencimiento || null,
              ubicacion_id: f.ubicacion_id || null, codigo_lote: f.codigo_lote || null, nota: f.nota,
            }), 'Lote ingresado');
          }}>
            <div><label className={lbl}>Artículo</label>
              <select required className={inp + ' bg-white'} value={f.articulo_id} onChange={set('articulo_id')}>
                <option value="">-- Elegir artículo --</option>
                {articulosIngreso.map((a) => <option key={a.id} value={a.id}>{a.nombre} ({a.unidad_codigo})</option>)}
              </select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Cantidad</label><input required type="number" min="0.001" step="any" className={inp} value={f.cantidad} onChange={set('cantidad')} /></div>
              <div><label className={lbl}>Costo unitario $ (opc.)</label><input type="number" min="0" step="any" className={inp} value={f.costo_unitario} onChange={set('costo_unitario')} placeholder="Costo de referencia" /></div>
              <div><label className={lbl}>Elaboración (opc.)</label><input type="date" className={inp} value={f.fecha_elaboracion} onChange={set('fecha_elaboracion')} /></div>
              <div><label className={lbl}>Vencimiento (opc.)</label><input type="date" className={inp} value={f.fecha_vencimiento} onChange={set('fecha_vencimiento')} /></div>
              <div><label className={lbl}>Ubicación</label>
                <select className={inp + ' bg-white'} value={f.ubicacion_id} onChange={set('ubicacion_id')}>
                  <option value="">Depósito principal</option>
                  {ubicActivas.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select></div>
              <div><label className={lbl}>Código de lote (opc.)</label><input className={inp} value={f.codigo_lote} onChange={set('codigo_lote')} placeholder="Se genera solo" /></div>
            </div>
            <div><label className={lbl}>Nota (opcional)</label><input className={inp} value={f.nota} onChange={set('nota')} /></div>
            <button type="submit" disabled={guardando} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition">{guardando ? 'Guardando…' : 'Ingresar lote'}</button>
          </form>
        </Modal>
      )}

      {modal?.tipo === 'ajuste' && (
        <Modal titulo={`Ajustar lote ${modal.lote.codigo_lote}`} onClose={cerrar}>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); ejecutar(() => ajustarLote(modal.lote.id, Number(f.cantidad), f.motivo), 'Lote ajustado'); }}>
            <p className="text-xs text-slate-500">{modal.lote.articulo_nombre} • Actual: {Number(modal.lote.cantidad_actual)} {modal.lote.unidad_codigo}</p>
            <div><label className={lbl}>Cantidad correcta</label><input required type="number" min="0" step="any" className={inp} value={f.cantidad} onChange={set('cantidad')} /></div>
            <div><label className={lbl}>Motivo (obligatorio)</label><input required className={inp} value={f.motivo} onChange={set('motivo')} placeholder="Ej: merma, conteo físico, rotura" /></div>
            <p className="text-[11px] text-slate-400">Se registra un movimiento de ajuste en el historial; no se modifican los anteriores.</p>
            <button type="submit" disabled={guardando} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition">{guardando ? 'Guardando…' : 'Confirmar ajuste'}</button>
          </form>
        </Modal>
      )}

      {modal?.tipo === 'bloqueo' && (
        <Modal titulo={`Bloquear lote ${modal.lote.codigo_lote}`} onClose={cerrar}>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); ejecutar(() => cambiarEstadoLote(modal.lote.id, 'bloqueado', f.motivo), 'Lote bloqueado'); }}>
            <p className="text-xs text-slate-500">Un lote bloqueado no se usa en ventas ni en producción hasta que lo desbloquees.</p>
            <div><label className={lbl}>Motivo (obligatorio)</label><input required className={inp} value={f.motivo} onChange={set('motivo')} placeholder="Ej: revisión de calidad" /></div>
            <button type="submit" disabled={guardando} className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition">{guardando ? 'Guardando…' : 'Bloquear lote'}</button>
          </form>
        </Modal>
      )}

      {modal?.tipo === 'editar' && (
        <Modal titulo={`Editar lote ${modal.lote.codigo_lote}`} onClose={cerrar}>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); ejecutar(() => editarLote({ id: modal.lote.id, ubicacion_id: f.ubicacion_id || null, fecha_elaboracion: f.fecha_elaboracion || null, fecha_vencimiento: f.fecha_vencimiento || null }), 'Lote actualizado'); }}>
            <div><label className={lbl}>Ubicación</label>
              <select className={inp + ' bg-white'} value={f.ubicacion_id} onChange={set('ubicacion_id')}>
                <option value="">Sin ubicación</option>
                {ubicaciones.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Elaboración</label><input type="date" className={inp} value={f.fecha_elaboracion} onChange={set('fecha_elaboracion')} /></div>
              <div><label className={lbl}>Vencimiento</label><input type="date" className={inp} value={f.fecha_vencimiento} onChange={set('fecha_vencimiento')} /></div>
            </div>
            <p className="text-[11px] text-slate-400">La cantidad y el costo no se editan acá: la cantidad se corrige con un ajuste.</p>
            <button type="submit" disabled={guardando} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition">{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
          </form>
        </Modal>
      )}

      {modal?.tipo === 'traza' && (
        <Modal titulo={`Trazabilidad · Lote ${modal.lote.codigo_lote}`} onClose={cerrar} ancho="max-w-xl">
          <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-0.5">
            <p className="font-bold text-slate-800">{modal.lote.articulo_nombre}</p>
            <p className="text-slate-500">Ingresó el {fecha(modal.lote.fecha_ingreso)} • Elaboración: {fecha(modal.lote.fecha_elaboracion)} • Vence: {fecha(modal.lote.fecha_vencimiento)}</p>
            <p className="text-slate-500">Origen: {modal.lote.origen_tipo || 'ingreso'} • Costo {dinero(modal.lote.costo_unitario)} • Hoy quedan {Number(modal.lote.cantidad_actual)} {modal.lote.unidad_codigo}</p>
          </div>
          <ListaMovimientos movimientos={movs} />
        </Modal>
      )}
    </div>
  );
}
