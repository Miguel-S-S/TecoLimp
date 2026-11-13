import React, { useState } from 'react';
import { guardarParametro, guardarMedioPago } from '../../services/ventasService';

const inp = 'w-full border p-2.5 rounded-xl text-sm';
const lbl = 'text-[11px] font-semibold text-slate-500 block mb-1';

export default function AjustesVentasPage({ parametros, medios, recargar, toast }) {
  const [costo, setCosto] = useState(parametros.envio_costo_default ?? '0');
  const [gratis, setGratis] = useState(parametros.envio_gratis_desde ?? '0');
  const [nuevo, setNuevo] = useState({ nombre: '', tipo: 'otro' });
  const [guardando, setGuardando] = useState(false);

  const guardarEnvio = async () => {
    setGuardando(true);
    try {
      await guardarParametro('envio_costo_default', Number(costo || 0));
      await guardarParametro('envio_gratis_desde', Number(gratis || 0));
      toast('Parámetros de envío guardados');
      await recargar();
    } catch (err) { alert(err.message); } finally { setGuardando(false); }
  };

  const alternar = async (m) => {
    try { await guardarMedioPago({ id: m.id, nombre: m.nombre, tipo: m.tipo, activo: !m.activo }); await recargar(); } catch (err) { alert(err.message); }
  };

  const agregar = async (e) => {
    e.preventDefault();
    try { await guardarMedioPago(nuevo); setNuevo({ nombre: '', tipo: 'otro' }); toast('Medio de pago agregado'); await recargar(); } catch (err) { alert(err.message); }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
        <h3 className="font-bold text-sm uppercase tracking-wide">Envíos</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lbl}>Costo de envío por defecto $</label><input type="number" min="0" step="any" className={inp} value={costo} onChange={(e) => setCosto(e.target.value)} /></div>
          <div><label className={lbl}>Envío gratis desde $</label><input type="number" min="0" step="any" className={inp} value={gratis} onChange={(e) => setGratis(e.target.value)} /></div>
        </div>
        <p className="text-[11px] text-slate-400">Con "envío gratis desde" en 0 la función está desactivada. Cada venta guarda el costo de envío que se aplicó en ese momento.</p>
        <button onClick={guardarEnvio} disabled={guardando} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm transition">{guardando ? 'Guardando…' : 'Guardar parámetros'}</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
        <h3 className="font-bold text-sm uppercase tracking-wide">Medios de pago</h3>
        {medios.map((m) => (
          <div key={m.id} className={`flex items-center justify-between border border-slate-200 rounded-xl p-2.5 text-xs ${m.activo ? '' : 'opacity-50'}`}>
            <span className="font-bold text-slate-800">{m.nombre} <span className="font-normal text-slate-400">({m.tipo})</span></span>
            <button onClick={() => alternar(m)} className="text-[11px] font-bold text-[#0100FD]">{m.activo ? 'Desactivar' : 'Activar'}</button>
          </div>
        ))}
        <form onSubmit={agregar} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-6"><label className={lbl}>Nuevo medio</label><input required className={inp} value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} placeholder="Ej: QR Banco" /></div>
          <div className="col-span-4"><label className={lbl}>Tipo</label>
            <select className={inp + ' bg-white'} value={nuevo.tipo} onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })}>
              <option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option><option value="otro">Otro</option></select></div>
          <button type="submit" className="col-span-2 bg-[#0100FD] text-white text-xs font-bold py-3 rounded-xl">Agregar</button>
        </form>
      </div>
    </div>
  );
}
