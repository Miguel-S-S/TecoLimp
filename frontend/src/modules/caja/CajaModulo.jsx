import React, { useCallback, useEffect, useState } from 'react';
import { listarSesionesCaja, listarMovimientosCaja, listarTotalesCaja, listarGastos, listarCategoriasGasto } from '../../services/cajaService';
import { listarMediosPago, listarParametros } from '../../services/ventasService';
import { listarProveedores } from '../../services/comprasService';
import CajaPage from './CajaPage';
import MovimientosCajaPage from './MovimientosCajaPage';
import GastosPage from './GastosPage';
import HistorialCajaPage from './HistorialCajaPage';

const SECCIONES = [['caja', 'Caja'], ['movimientos', 'Movimientos'], ['gastos', 'Gastos'], ['historial', 'Historial']];

export default function CajaModulo({ recargar, toast }) {
  const [seccion, setSeccion] = useState('caja');
  const [sesiones, setSesiones] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [totales, setTotales] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [medios, setMedios] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [parametros, setParametros] = useState({});
  const [error, setError] = useState(null);

  const recargarPropio = useCallback(async () => {
    try {
      const [s, m, g, c, md, pr, pa] = await Promise.all([listarSesionesCaja(), listarMovimientosCaja(), listarGastos(),
        listarCategoriasGasto(), listarMediosPago(), listarProveedores(), listarParametros()]);
      setSesiones(s); setMovimientos(m); setGastos(g); setCategorias(c); setMedios(md); setProveedores(pr); setParametros(pa);
      const abierta = s.find((x) => x.estado === 'abierta');
      setTotales(abierta ? await listarTotalesCaja(abierta.id) : []);
      setError(null);
    } catch (err) {
      console.error('Error al cargar caja:', err);
      setError(err.message);
    }
  }, []);
  useEffect(() => { recargarPropio(); }, [recargarPropio]);

  // Los gastos alimentan Reportes: se recarga también lo operativo
  const recargarTodo = async () => { await Promise.all([recargarPropio(), recargar()]); };
  const sinCaja = movimientos.filter((m) => !m.sesion_id).length;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {SECCIONES.map(([id, label]) => (
          <button key={id} onClick={() => setSeccion(id)} className={`flex-1 whitespace-nowrap px-3 py-2 rounded-lg text-xs font-bold transition ${seccion === id ? 'bg-white text-[#0100FD] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
        ))}
      </div>
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3">
          No se pudo cargar la caja: {error}. Verificá que la migración 20261102000900 esté aplicada.
        </div>
      )}
      {seccion === 'caja' && <CajaPage sesiones={sesiones} totales={totales} parametros={parametros} sinCaja={sinCaja} recargar={recargarTodo} toast={toast} />}
      {seccion === 'movimientos' && <MovimientosCajaPage movimientos={movimientos} sesiones={sesiones} medios={medios} recargar={recargarTodo} toast={toast} />}
      {seccion === 'gastos' && <GastosPage gastos={gastos} categorias={categorias} medios={medios} proveedores={proveedores} recargar={recargarTodo} toast={toast} />}
      {seccion === 'historial' && <HistorialCajaPage sesiones={sesiones} />}
    </div>
  );
}
