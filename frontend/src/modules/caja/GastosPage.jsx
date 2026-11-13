import React, { useMemo, useState } from 'react';
import { registrarGasto, anularGasto, guardarCategoriaGasto } from '../../services/cajaService';

const dinero = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fecha = (d) => new Date(d + 'T00:00:00').toLocaleDateString('es-AR');
const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const inp = 'w-full border p-2.5 rounded-xl text-sm';
const lbl = 'text-[11px] font-semibold text-slate-500 block mb-1';

export default function GastosPage({ gastos, categorias, medios, proveedores, recargar, toast }) {
  const activos = medios.filter((m) => m.activo);
  const [f, setF] = useState({ fecha: hoy(), categoria_id: '', descripcion: '', importe: '', medio_pago_id: '', proveedor_id: '', comprobante: '', usuario: '' });
  const [nuevaCat, setNuevaCat] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [verAnulados, setVerAnulados] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const set = (c) => (e) => setF((x) => ({ ...x, [c]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await registrarGasto({ ...f, importe: Number(f.importe), medio_pago_id: f.medio_pago_id || activos[0]?.id, proveedor_id: f.proveedor_id ? Number(f.proveedor_id) : null });
      toast('Gasto registrado');
      setF((x) => ({ ...x, descripcion: '', importe: '', comprobante: '', proveedor_id: '' }));
      await recargar();
    } catch (err) { alert(err.message); } finally { setGuardando(false); }
  };

  const anular = async (g) => {
    const motivo = prompt(`Motivo de la anulación del gasto N° ${g.numero}:`);
    if (!motivo || !motivo.trim()) return;
    try { await anularGasto(g.id, motivo); toast('Gasto anulado'); await recargar(); } catch (err) { alert(err.message); }
  };

  const agregarCategoria = async () => {
    if (!nuevaCat.trim()) return;
    try { await guardarCategoriaGasto({ nombre: nuevaCat }); setNuevaCat(''); toast('Categoría agregada'); await recargar(); } catch (err) { alert(err.message); }
  };

  const vigentes = gastos.filter((g) => g.estado === 'registrado');
  const mes = hoy().slice(0, 7);
  const totalMes = vigentes.filter((g) => g.fecha.startsWith(mes)).reduce((t, g) => t + Number(g.importe), 0);
  const visibles = useMemo(() => gastos.filter((g) => (verAnulados || g.estado === 'registrado')
    && (g.descripcion + ' ' + g.categoria + ' ' + (g.proveedor_nombre || '')).toLowerCase().includes(busqueda.toLowerCase())), [gastos, busqueda, verAnulados]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3"><p className="text-[10px] uppercase font-bold text-rose-700">Gastos del mes</p><p className="font-black text-rose-700">{dinero(totalMes)}</p></div>
        <form onSubmit={guardar} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
          <h3 className="font-bold text-sm uppercase tracking-wide">Registrar gasto operativo</h3>
          <p className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 rounded-lg p-2">Acá van los gastos del negocio (alquiler, servicios, sueldos…). La compra de materias primas, insumos y productos de reventa se registra en <strong>Compras</strong>, para que ingrese al inventario.</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Fecha</label><input type="date" className={inp} value={f.fecha} onChange={set('fecha')} /></div>
            <div><label className={lbl}>Importe $</label><input required type="number" min="0" step="any" className={inp} value={f.importe} onChange={set('importe')} /></div>
          </div>
          <div><label className={lbl}>Categoría</label>
            <select required className={inp + ' bg-white'} value={f.categoria_id} onChange={set('categoria_id')}><option value="">-- Elegir --</option>{categorias.filter((c) => c.activa).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
          <div><label className={lbl}>Descripción</label><input required className={inp} value={f.descripcion} onChange={set('descripcion')} placeholder="Ej: Alquiler de noviembre" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Medio de pago</label><select className={inp + ' bg-white'} value={f.medio_pago_id || activos[0]?.id || ''} onChange={set('medio_pago_id')}>{activos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}</select></div>
            <div><label className={lbl}>Proveedor (opcional)</label><select className={inp + ' bg-white'} value={f.proveedor_id} onChange={set('proveedor_id')}><option value="">Ninguno</option>{proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
            <div><label className={lbl}>Comprobante (opc.)</label><input className={inp} value={f.comprobante} onChange={set('comprobante')} /></div>
            <div><label className={lbl}>Registrado por (opc.)</label><input className={inp} value={f.usuario} onChange={set('usuario')} /></div>
          </div>
          <button type="submit" disabled={guardando} className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition shadow-sm">{guardando ? 'Guardando…' : 'Guardar gasto'}</button>
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <input className={inp} placeholder="Nueva categoría de gasto" value={nuevaCat} onChange={(e) => setNuevaCat(e.target.value)} />
            <button type="button" onClick={agregarCategoria} className="bg-slate-800 text-white text-xs font-bold px-4 rounded-xl">Agregar</button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
        <h3 className="font-bold text-sm uppercase tracking-wide">Historial de gastos</h3>
        <input className={inp} placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <label className="text-xs text-slate-500 flex items-center gap-1.5"><input type="checkbox" checked={verAnulados} onChange={(e) => setVerAnulados(e.target.checked)} /> Mostrar anulados</label>
        <div className="space-y-2 max-h-[34rem] overflow-y-auto pr-1">
          {visibles.length === 0 && <p className="text-xs text-slate-400 text-center py-6">No hay gastos para mostrar.</p>}
          {visibles.map((g) => (
            <div key={g.id} className={`text-xs bg-slate-50 p-3 rounded-xl border flex justify-between gap-2 ${g.estado === 'anulado' ? 'opacity-50' : ''}`}>
              <div className="min-w-0">
                <span className="font-bold block text-slate-800">{g.descripcion}</span>
                <span className="text-[10px] text-slate-400">N° {g.numero} • {fecha(g.fecha)} • {g.categoria} • {g.medio_pago}{g.proveedor_nombre ? ` • ${g.proveedor_nombre}` : ''}{g.usuario ? ` • ${g.usuario}` : ''}</span>
                {g.estado === 'anulado' && <span className="block text-[10px] text-rose-500">Anulado: {g.motivo_anulacion}</span>}
              </div>
              <div className="text-right shrink-0">
                <span className={`font-black block ${g.estado === 'anulado' ? 'line-through text-slate-400' : 'text-rose-600'}`}>−{dinero(g.importe)}</span>
                {g.estado === 'registrado' && <button onClick={() => anular(g)} className="text-[10px] font-bold text-slate-400 hover:text-rose-500">Anular</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
