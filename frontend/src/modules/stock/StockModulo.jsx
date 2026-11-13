import React, { useState } from 'react';
import useInventario from '../../hooks/useInventario';
import StockPage from './StockPage';
import LotesPage from '../inventario/LotesPage';
import MovimientosPage from '../inventario/MovimientosPage';
import UbicacionesPage from '../inventario/UbicacionesPage';

const SECCIONES = [
  { id: 'catalogo', label: 'Catálogo' },
  { id: 'lotes', label: 'Lotes' },
  { id: 'movimientos', label: 'Movimientos' },
  { id: 'ubicaciones', label: 'Ubicaciones' },
];

export default function StockModulo({ articulos, categorias, unidades, recargar, toast }) {
  const [seccion, setSeccion] = useState('catalogo');
  const inv = useInventario();

  const recargarTodo = async () => { await Promise.all([recargar(), inv.recargar()]); };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {SECCIONES.map((s) => (
          <button key={s.id} onClick={() => setSeccion(s.id)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${seccion === s.id ? 'bg-white text-[#0100FD] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}>{s.label}</button>
        ))}
      </div>
      {inv.error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3">
          No se pudo cargar el inventario: {inv.error}. Verificá que la migración 20261102000400 esté aplicada.
        </div>
      )}
      {seccion === 'catalogo' && <StockPage articulos={articulos} categorias={categorias} unidades={unidades} recargar={recargarTodo} toast={toast} />}
      {seccion === 'lotes' && <LotesPage lotes={inv.lotes} ubicaciones={inv.ubicaciones} articulos={articulos} recargar={recargarTodo} toast={toast} />}
      {seccion === 'movimientos' && <MovimientosPage />}
      {seccion === 'ubicaciones' && <UbicacionesPage ubicaciones={inv.ubicaciones} lotes={inv.lotes} recargar={inv.recargar} toast={toast} />}
    </div>
  );
}
