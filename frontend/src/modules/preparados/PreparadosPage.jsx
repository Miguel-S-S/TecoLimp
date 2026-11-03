import React, { useState } from 'react';
import { crearPreparado, sumarStockPreparado } from '../../services/ArticulosService';

export default function PreparadosPage({ articulos, recargar, toast }) {
  const [modo, setModo] = useState('nuevo');
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [cantidad, setCantidad] = useState(10);
  const [articuloId, setArticuloId] = useState('');
  const [guardando, setGuardando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (modo === 'nuevo') {
        await crearPreparado(nombre, Number(precio || 0), Number(cantidad));
        toast(`Preparado "${nombre}" creado`);
        setNombre('');
      } else {
        if (!articuloId) return alert('Seleccioná un producto');
        await sumarStockPreparado(articuloId, Number(cantidad));
        toast('Stock sumado');
      }
      await recargar();
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const activos = articulos.filter((a) => a.estado === 'activo' && a.controla_stock);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs max-w-xl mx-auto">
      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Elaboración de Preparados</h3>
      <div className="flex gap-2">
        <button onClick={() => setModo('nuevo')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${modo === 'nuevo' ? 'bg-[#0100FD] text-white' : 'bg-white text-slate-600'}`}>Nuevo</button>
        <button onClick={() => setModo('existente')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${modo === 'existente' ? 'bg-[#0100FD] text-white' : 'bg-white text-slate-600'}`}>Sumar Stock</button>
      </div>
      <form onSubmit={enviar} className="space-y-3">
        {modo === 'nuevo' ? (
          <>
            <input type="text" placeholder="Nombre del preparado" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full border p-3 rounded-xl text-sm" />
            <input type="number" step="any" min="0" placeholder="Precio de venta ($)" value={precio} onChange={(e) => setPrecio(e.target.value)} required className="w-full border p-3 rounded-xl text-sm" />
          </>
        ) : (
          <select value={articuloId} onChange={(e) => setArticuloId(e.target.value)} required className="w-full border p-3 rounded-xl text-sm">
            <option value="">-- Elegir producto existente --</option>
            {activos.map((a) => <option key={a.id} value={a.id}>{a.nombre} (Stock: {Number(a.stock)} {a.unidad_codigo})</option>)}
          </select>
        )}
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Cantidad a elaborar / sumar</label>
          <input type="number" step="any" min="0.001" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required className="w-full border p-3 rounded-xl text-sm" />
        </div>
        <button type="submit" disabled={guardando} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition">
          {guardando ? 'Guardando…' : 'Guardar Preparado'}
        </button>
      </form>
    </div>
  );
}