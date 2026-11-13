import React, { useState } from 'react';
import { Plus, Edit3, X } from 'lucide-react';
import { guardarUbicacion } from '../../services/inventarioService';

export default function UbicacionesPage({ ubicaciones, lotes, recargar, toast }) {
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cantLotes = (id) => lotes.filter((l) => l.ubicacion_id === id && Number(l.cantidad_actual) > 0).length;

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await guardarUbicacion(form);
      toast(form.id ? 'Ubicación actualizada' : 'Ubicación creada');
      setForm(null);
      await recargar();
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-3 max-w-xl mx-auto">
      <button onClick={() => setForm({ id: null, nombre: '', descripcion: '', estado: 'activo' })} className="w-full bg-[#0100FD] hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition">
        <Plus className="w-5 h-5" /> Nueva ubicación
      </button>
      {ubicaciones.map((u) => (
        <div key={u.id} className={`bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-xs ${u.estado === 'inactivo' ? 'opacity-60' : ''}`}>
          <div>
            <h4 className="font-bold text-sm text-slate-800">{u.nombre} {u.estado === 'inactivo' && <span className="text-[10px] font-normal text-slate-400">(inactiva)</span>}</h4>
            <p className="text-xs text-slate-500">{u.descripcion || 'Sin descripción'} • {cantLotes(u.id)} lotes con stock</p>
          </div>
          <button onClick={() => setForm({ id: u.id, nombre: u.nombre, descripcion: u.descripcion || '', estado: u.estado })} className="p-2 text-slate-400 hover:text-[#0100FD]"><Edit3 className="w-4 h-4" /></button>
        </div>
      ))}

      {form && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800">{form.id ? 'Editar ubicación' : 'Nueva ubicación'}</h3>
              <button onClick={() => setForm(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardar} className="space-y-3">
              <div><label className="text-xs font-semibold text-slate-500 block mb-1">Nombre</label>
                <input required className="w-full border p-3 rounded-xl text-sm" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Estante A, Freezer, Depósito 2" /></div>
              <div><label className="text-xs font-semibold text-slate-500 block mb-1">Descripción (opcional)</label>
                <input className="w-full border p-3 rounded-xl text-sm" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
              {form.id && (
                <label className="text-xs text-slate-600 flex items-center gap-2">
                  <input type="checkbox" checked={form.estado === 'activo'} onChange={(e) => setForm({ ...form, estado: e.target.checked ? 'activo' : 'inactivo' })} /> Ubicación activa
                </label>
              )}
              <button type="submit" disabled={guardando} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition">{guardando ? 'Guardando…' : 'Guardar'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
