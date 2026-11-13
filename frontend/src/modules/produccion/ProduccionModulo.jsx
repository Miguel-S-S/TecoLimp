import React, { useCallback, useEffect, useState } from 'react';
import { listarRecetas, listarOrdenes } from '../../services/produccionService';
import { listarPresentaciones, listarOrdenesEnvasado } from '../../services/envasadoService';
import OrdenesPage from './OrdenesPage';
import RecetasPage from './RecetasPage';
import EnvasadoPage from '../envasado/EnvasadoPage';
import PresentacionesPage from '../envasado/PresentacionesPage';

const SECCIONES = [['ordenes', 'Órdenes'], ['recetas', 'Recetas'], ['envasado', 'Envasado'], ['presentaciones', 'Presentaciones']];

export default function ProduccionModulo({ articulos, unidades, recargarCatalogo, toast }) {
  const [seccion, setSeccion] = useState('ordenes');
  const [recetas, setRecetas] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [presentaciones, setPresentaciones] = useState([]);
  const [ordenesEnvasado, setOrdenesEnvasado] = useState([]);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    try {
      const [r, o, p, e] = await Promise.all([listarRecetas(), listarOrdenes(), listarPresentaciones(), listarOrdenesEnvasado()]);
      setRecetas(r); setOrdenes(o); setPresentaciones(p); setOrdenesEnvasado(e);
      setError(null);
    } catch (e) {
      console.error('Error al cargar producción:', e);
      setError(e.message);
    }
  }, []);
  useEffect(() => { recargar(); }, [recargar]);

  // Producir, envasar o anular mueve stock: se recarga también el catálogo
  const recargarTodo = async () => { await Promise.all([recargar(), recargarCatalogo()]); };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {SECCIONES.map(([id, label]) => (
          <button key={id} onClick={() => setSeccion(id)} className={`flex-1 whitespace-nowrap px-3 py-2 rounded-lg text-xs font-bold transition ${seccion === id ? 'bg-white text-[#0100FD] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
        ))}
      </div>
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3">
          No se pudo cargar la producción: {error}. Verificá que las migraciones 20261102000600 y 20261102000700 estén aplicadas.
        </div>
      )}
      {seccion === 'ordenes' && <OrdenesPage ordenes={ordenes} recetas={recetas} articulos={articulos} recargar={recargarTodo} toast={toast} />}
      {seccion === 'recetas' && <RecetasPage recetas={recetas} articulos={articulos} unidades={unidades} recargar={recargar} toast={toast} />}
      {seccion === 'envasado' && <EnvasadoPage ordenes={ordenesEnvasado} presentaciones={presentaciones} recargar={recargarTodo} toast={toast} />}
      {seccion === 'presentaciones' && <PresentacionesPage presentaciones={presentaciones} articulos={articulos} unidades={unidades} recargar={recargarTodo} toast={toast} />}
    </div>
  );
}
