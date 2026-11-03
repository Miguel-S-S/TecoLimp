import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function GastosPage({ gastos, recargar, toast }) {
  const [categoria, setCategoria] = useState('Materia Prima y Químicos');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');

  const guardar = async (e) => {
    e.preventDefault();
    if (!monto) return;
    const { error } = await supabase.from('expenses').insert([{
      category: categoria, description: descripcion || categoria, amount: Number(monto), method: 'Efectivo',
    }]);
    if (error) return alert('Error al guardar el gasto');
    setMonto(''); setDescripcion('');
    toast('Gasto guardado');
    recargar();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
      <form onSubmit={guardar} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
        <h3 className="font-bold text-sm uppercase tracking-wide">Cargar Gasto o Insumo</h3>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Categoría</label>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full border p-3 rounded-xl text-sm bg-white">
            <option value="Materia Prima y Químicos">Materia Prima y Químicos</option>
            <option value="Envases y Etiquetas">Envases y Etiquetas</option>
            <option value="Logística y Envíos">Logística y Envíos</option>
            <option value="Servicios y Varios">Servicios y Varios</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Descripción</label>
          <input type="text" placeholder="Ej: Compra de alcohol graso" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full border p-3 rounded-xl text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Monto ($)</label>
          <input type="number" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} required className="w-full border p-3 rounded-xl text-sm" />
        </div>
        <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-xl font-bold transition shadow-sm">Guardar Gasto</button>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
        <h3 className="font-bold text-sm uppercase tracking-wide">Historial de Gastos</h3>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {gastos.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No hay gastos registrados.</p>
          ) : gastos.map((g) => (
            <div key={g.id} className="text-xs bg-slate-50 p-3 rounded-xl border flex justify-between items-center">
              <div>
                <span className="font-bold block text-slate-800">{g.description}</span>
                <span className="text-[10px] text-slate-400">{g.category} • {g.method}</span>
              </div>
              <span className="font-black text-rose-600">-${g.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}