import React, { useCallback, useEffect, useState } from 'react';
import { listarProveedores, listarCompras } from '../../services/comprasService';
import ComprasPage from './ComprasPage';
import ProveedoresPage from './ProveedoresPage';

export default function ComprasModulo({ articulos, unidades, recargarCatalogo, toast }) {
  const [seccion, setSeccion] = useState('compras');
  const [proveedores, setProveedores] = useState([]);
  const [compras, setCompras] = useState([]);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([listarProveedores(), listarCompras()]);
      setProveedores(p);
      setCompras(c);
      setError(null);
    } catch (e) {
      console.error('Error al cargar compras:', e);
      setError(e.message);
    }
  }, []);
  useEffect(() => { recargar(); }, [recargar]);

  // Recibir o anular una compra mueve stock: se recarga también el catálogo
  const recargarTodo = async () => { await Promise.all([recargar(), recargarCatalogo()]); };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {[['compras', 'Compras'], ['proveedores', 'Proveedores']].map(([id, label]) => (
          <button key={id} onClick={() => setSeccion(id)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${seccion === id ? 'bg-white text-[#0100FD] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
        ))}
      </div>
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3">
          No se pudieron cargar las compras: {error}. Verificá que la migración 20261102000500 esté aplicada.
        </div>
      )}
      {seccion === 'compras'
        ? <ComprasPage compras={compras} proveedores={proveedores} articulos={articulos} unidades={unidades} recargar={recargarTodo} toast={toast} />
        : <ProveedoresPage proveedores={proveedores} compras={compras} articulos={articulos} unidades={unidades} recargar={recargar} toast={toast} />}
    </div>
  );
}
