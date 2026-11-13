import React, { useRef, useState } from 'react';
import { Download, Upload, RefreshCw, ShieldAlert, KeyRound } from 'lucide-react';
import { exportarBackup, restaurarBackup } from '../../services/respaldoService';

const pad = (n) => String(n).padStart(2, '0');

function descargarJson(objeto, prefijo) {
  const d = new Date();
  const nombre = `${prefijo}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.json`;
  const url = URL.createObjectURL(new Blob([JSON.stringify(objeto)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  return nombre;
}

const resumen = (backup) => Object.entries(backup.tablas)
  .map(([tabla, filas]) => [tabla, Array.isArray(filas) ? filas.length : 0])
  .filter(([, n]) => n > 0);

export default function RespaldoPage({ recargar, toast }) {
  const [pin, setPin] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [ultimo, setUltimo] = useState(null);       // { nombre, resumen }
  const [archivo, setArchivo] = useState(null);     // { nombre, backup }
  const [confirmacion, setConfirmacion] = useState('');
  const inputArchivo = useRef(null);

  const generar = async () => {
    if (!pin) return alert('Ingresá el PIN de respaldo');
    setOcupado(true);
    try {
      const backup = await exportarBackup(pin);
      const nombre = descargarJson(backup, 'juma-backup');
      setUltimo({ nombre, resumen: resumen(backup) });
      toast('Backup generado y descargado');
    } catch (err) {
      alert(err.message);
    } finally {
      setOcupado(false);
    }
  };

  const elegirArchivo = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const backup = JSON.parse(await f.text());
      if (backup.app !== 'JUMA Cloud' || typeof backup.tablas !== 'object') throw new Error('formato');
      setArchivo({ nombre: f.name, backup });
      setConfirmacion('');
    } catch {
      setArchivo(null);
      alert('El archivo no es un backup válido de JUMA Cloud.');
    }
  };

  const restaurar = async () => {
    if (!archivo) return;
    if (!pin) return alert('Ingresá el PIN de respaldo');
    if (confirmacion !== 'RESTAURAR') return alert('Escribí RESTAURAR para confirmar');
    setOcupado(true);
    try {
      // Red de seguridad: se descarga una copia del estado actual antes de reemplazarlo
      descargarJson(await exportarBackup(pin), 'juma-antes-de-restaurar');
      await restaurarBackup(archivo.backup, pin, confirmacion);
      setArchivo(null);
      setConfirmacion('');
      await recargar();
      toast('Datos restaurados correctamente');
    } catch (err) {
      alert(err.message);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
        <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2"><KeyRound className="w-4 h-4 text-[#0100FD]" /> Respaldo de datos</h3>
        <p className="text-xs text-slate-500">Las operaciones de respaldo piden el PIN que configuraste en Supabase.</p>
        <input type="password" autoComplete="off" placeholder="PIN de respaldo" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full border p-3 rounded-xl text-sm" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
        <h3 className="font-bold text-sm uppercase tracking-wide">Generar backup completo</h3>
        <p className="text-xs text-slate-500">Descarga un archivo con todos los datos: clientes, artículos, existencias, movimientos, ventas, gastos y el resto.</p>
        <button onClick={generar} disabled={ocupado} className="w-full bg-[#0100FD] hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition">
          <Download className="w-5 h-5" /> {ocupado ? 'Procesando…' : 'Generar y descargar backup'}
        </button>
        {ultimo && (
          <div className="text-xs bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-emerald-800">
            <p className="font-bold">{ultimo.nombre}</p>
            <p className="mt-1">{ultimo.resumen.length ? ultimo.resumen.map(([t, n]) => `${t}: ${n}`).join(' • ') : 'La base está vacía.'}</p>
          </div>
        )}
      </div>

      <div className="bg-white border border-rose-200 rounded-2xl p-5 space-y-3 shadow-xs">
        <h3 className="font-bold text-sm uppercase tracking-wide text-rose-700 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Restaurar backup</h3>
        <p className="text-xs text-slate-500">
          <strong>Reemplaza todos los datos actuales</strong> por los del archivo. Antes de hacerlo, la app descarga automáticamente una copia del estado actual por si necesitás volver atrás.
        </p>
        <input ref={inputArchivo} type="file" accept="application/json,.json" onChange={elegirArchivo} className="hidden" />
        <button onClick={() => inputArchivo.current?.click()} disabled={ocupado} className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition">
          <Upload className="w-5 h-5" /> Elegir archivo de backup
        </button>

        {archivo && (
          <div className="space-y-3">
            <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="font-bold text-slate-800">{archivo.nombre}</p>
              {archivo.backup.generado && <p className="text-slate-500">Generado: {new Date(archivo.backup.generado).toLocaleString('es-AR')}</p>}
              <p className="mt-1 text-slate-600">{resumen(archivo.backup).map(([t, n]) => `${t}: ${n}`).join(' • ') || 'Backup vacío'}</p>
            </div>
            <input type="text" placeholder="Escribí RESTAURAR para confirmar" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} className="w-full border border-rose-200 p-3 rounded-xl text-sm" />
            <button onClick={restaurar} disabled={ocupado || confirmacion !== 'RESTAURAR'} className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white py-3.5 rounded-xl font-bold text-sm transition">
              {ocupado ? 'Restaurando…' : 'Restaurar y reemplazar datos'}
            </button>
          </div>
        )}
      </div>

      <button onClick={async () => { await recargar(); toast('Sincronizado con Supabase'); }} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition">
        <RefreshCw className="w-4 h-4" /> Sincronizar datos ahora
      </button>
    </div>
  );
}
