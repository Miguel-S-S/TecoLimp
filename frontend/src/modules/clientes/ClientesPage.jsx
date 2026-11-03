import React, { useMemo, useState } from 'react';
import { Plus, Search, X, Phone, MapPin } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function ClientesPage({ clientes, recargar, toast }) {
  const [modal, setModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const guardar = async (e) => {
    e.preventDefault();
    if (!nombre || !telefono || !direccion) return alert('Por favor completá nombre, teléfono y dirección');
    const { error } = await supabase.from('clientes').insert([{ nombre: nombre.trim(), telefono: telefono.trim(), direccion: direccion.trim() }]);
    if (error) {
      console.error('Error al registrar cliente:', error);
      return alert('Error al registrar cliente en Supabase: ' + error.message);
    }
    toast('Cliente registrado con éxito');
    setNombre(''); setTelefono(''); setDireccion(''); setModal(false);
    recargar();
  };

  const filtrados = useMemo(() => clientes.filter((c) =>
    (c.nombre + ' ' + c.telefono + ' ' + c.direccion).toLowerCase().includes(busqueda.toLowerCase())), [clientes, busqueda]);

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Gestión de Clientes</h3>
        <button onClick={() => setModal(true)} className="bg-[#0100FD] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input type="text" placeholder="Buscar por nombre, teléfono o dirección..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm" />
      </div>
      <div className="space-y-2.5">
        {filtrados.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8 bg-white rounded-2xl border">No hay clientes registrados.</p>
        ) : filtrados.map((c) => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-xs">
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-800">{c.nombre}</h4>
              <p className="text-xs text-slate-500 flex items-center gap-1.5"><Phone className="w-3 h-3 text-[#0100FD]" /> {c.telefono}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5"><MapPin className="w-3 h-3 text-slate-400" /> {c.direccion}</p>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800">Registrar Nuevo Cliente</h3>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardar} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Nombre y Apellido</label>
                <input type="text" placeholder="Ej: Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full border p-3 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Teléfono Válido</label>
                <input type="text" placeholder="Ej: 3794123456" value={telefono} onChange={(e) => setTelefono(e.target.value)} required className="w-full border p-3 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Dirección</label>
                <input type="text" placeholder="Ej: Av. Maipú 1234" value={direccion} onChange={(e) => setDireccion(e.target.value)} required className="w-full border p-3 rounded-xl text-sm" />
              </div>
              <button type="submit" className="w-full bg-[#0100FD] hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition shadow-sm mt-2">Guardar Cliente</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}