import React, { useCallback, useEffect, useState } from 'react';
import { listarMediosPago, listarParametros, listarVentas, listarEntregas } from '../../services/ventasService';
import VenderPage from './VenderPage';
import HistorialVentasPage from './HistorialVentasPage';
import EntregasPage from './EntregasPage';
import AjustesVentasPage from './AjustesVentasPage';

const SECCIONES = [['vender', 'Nueva venta'], ['historial', 'Historial'], ['entregas', 'Entregas'], ['ajustes', 'Ajustes']];

export default function VenderModulo({ articulos, clientes, recargar, toast }) {
  const [seccion, setSeccion] = useState('vender');
  const [medios, setMedios] = useState([]);
  const [parametros, setParametros] = useState({});
  const [ventas, setVentas] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [error, setError] = useState(null);

  const recargarPropio = useCallback(async () => {
    try {
      const [m, p, v, e] = await Promise.all([listarMediosPago(), listarParametros(), listarVentas(), listarEntregas()]);
      setMedios(m); setParametros(p); setVentas(v); setEntregas(e);
      setError(null);
    } catch (err) {
      console.error('Error al cargar ventas:', err);
      setError(err.message);
    }
  }, []);
  useEffect(() => { recargarPropio(); }, [recargarPropio]);

  // Vender o anular mueve stock y datos de reportes: se recarga todo
  const recargarTodo = async () => { await Promise.all([recargarPropio(), recargar()]); };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {SECCIONES.map(([id, label]) => (
          <button key={id} onClick={() => setSeccion(id)} className={`flex-1 whitespace-nowrap px-3 py-2 rounded-lg text-xs font-bold transition ${seccion === id ? 'bg-white text-[#0100FD] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
        ))}
      </div>
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3">
          No se pudieron cargar las ventas: {error}. Verificá que la migración 20261102000800 esté aplicada.
        </div>
      )}
      {seccion === 'vender' && <VenderPage articulos={articulos} clientes={clientes} medios={medios} parametros={parametros} recargar={recargarTodo} toast={toast} />}
      {seccion === 'historial' && <HistorialVentasPage ventas={ventas} medios={medios} recargar={recargarTodo} toast={toast} />}
      {seccion === 'entregas' && <EntregasPage entregas={entregas} recargar={recargarTodo} toast={toast} />}
      {seccion === 'ajustes' && <AjustesVentasPage key={JSON.stringify(parametros)} parametros={parametros} medios={medios} recargar={recargarPropio} toast={toast} />}
    </div>
  );
}
