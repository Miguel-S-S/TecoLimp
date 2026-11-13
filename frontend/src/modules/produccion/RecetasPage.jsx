import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { TIPOS_ARTICULO } from '../../services/ArticulosService';
import { listarRecetas, listarDetallesReceta, publicarReceta, nuevaVersionReceta } from '../../services/produccionService';
import RecetaEditor from './RecetaEditor';

const dinero = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (n) => Number(n).toLocaleString('es-AR', { maximumFractionDigits: 4 });
const ESTILOS = { vigente: 'bg-emerald-50 text-emerald-700 border-emerald-200', borrador: 'bg-amber-50 text-amber-700 border-amber-200', obsoleta: 'bg-slate-100 text-slate-500 border-slate-300' };

function Detalle({ receta, detalles, onClose }) {
  return (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 max-h-full overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-800">{receta.articulo_nombre} · v{receta.version}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-slate-500">Rinde {num(receta.rendimiento)} {receta.unidad_codigo} por tanda
          {receta.vida_util_dias ? ` • Vida útil ${receta.vida_util_dias} días` : ''}
          {receta.tiempo_preparacion_min != null ? ` • Preparación ${receta.tiempo_preparacion_min} min` : ''}
          {receta.tiempo_reposo_min != null ? ` • Reposo ${receta.tiempo_reposo_min} min` : ''}</p>
        <div className="space-y-2">
          {detalles.map((d) => (
            <div key={d.id} className="border border-slate-200 rounded-xl p-3 text-xs flex justify-between gap-3">
              <div><p className="font-bold text-slate-800">{d.articulo_nombre}</p><p className="text-slate-500">{TIPOS_ARTICULO[d.articulo_tipo]} • {num(d.cantidad)} {d.unidad_codigo}</p></div>
              <p className="text-slate-500 shrink-0">Costo actual {dinero(d.costo_actual)}/{d.unidad_stock}</p>
            </div>
          ))}
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm space-y-1">
          <div className="flex justify-between text-slate-600"><span>Costos adicionales por tanda</span><span>{dinero(receta.costos_adicionales)}</span></div>
          <div className="flex justify-between text-slate-600"><span>Costo estimado por tanda</span><span>{dinero(receta.costo_estimado_tanda)}</span></div>
          <div className="flex justify-between font-black text-slate-900 pt-1 border-t"><span>Costo estimado por {receta.unidad_articulo}</span><span>{dinero(receta.costo_estimado_unitario)}</span></div>
        </div>
        <p className="text-[11px] text-slate-400">El costo estimado usa el costo del último lote ingresado de cada ingrediente. El costo real se calcula al confirmar cada producción.</p>
        {receta.notas && <p className="text-xs text-slate-500">Notas: {receta.notas}</p>}
      </div>
    </div>
  );
}

export default function RecetasPage({ recetas, articulos, unidades, recargar, toast }) {
  const [editor, setEditor] = useState(null);   // { receta, detalles }
  const [detalle, setDetalle] = useState(null); // { receta, detalles }

  const abrir = async (receta, modo) => {
    try {
      const detalles = await listarDetallesReceta(receta.id);
      if (modo === 'ver') setDetalle({ receta, detalles }); else setEditor({ receta, detalles });
    } catch (e) { alert(e.message); }
  };

  const publicar = async (r) => {
    if (!confirm(`¿Publicar la v${r.version} de ${r.articulo_nombre}? Pasará a ser la receta vigente.`)) return;
    try { await publicarReceta(r.id); toast('Receta publicada'); await recargar(); } catch (e) { alert(e.message); }
  };

  const nuevaVersion = async (r) => {
    try {
      const id = await nuevaVersionReceta(r.id);
      const lista = await listarRecetas();
      const nueva = lista.find((x) => x.id === id);
      await recargar();
      if (nueva) setEditor({ receta: nueva, detalles: await listarDetallesReceta(id) });
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="space-y-3">
      <button onClick={() => setEditor({ receta: null, detalles: [] })} className="w-full bg-[#0100FD] hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition">
        <Plus className="w-5 h-5" /> Nueva receta
      </button>
      {recetas.length === 0 && <p className="text-xs text-slate-400 text-center py-8 bg-white rounded-2xl border">Todavía no hay recetas. Creá un producto elaborado en Stock y definí su receta acá.</p>}
      {recetas.map((r) => (
        <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-slate-800 truncate">{r.articulo_nombre} <span className="text-slate-400 font-normal">· v{r.version}</span></h4>
              <p className="text-xs text-slate-500">Rinde {num(r.rendimiento)} {r.unidad_codigo} • {r.ingredientes} ingredientes • Costo est. {dinero(r.costo_estimado_unitario)}/{r.unidad_articulo}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${ESTILOS[r.estado]}`}>{r.estado}</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
            <button onClick={() => abrir(r, 'ver')} className="text-xs font-bold text-slate-600 px-3 py-1.5 rounded-lg bg-slate-100">Ver</button>
            {r.estado === 'borrador' && <button onClick={() => abrir(r, 'editar')} className="text-xs font-bold text-[#0100FD] px-3 py-1.5 rounded-lg bg-blue-50">Editar</button>}
            {r.estado === 'borrador' && <button onClick={() => publicar(r)} className="text-xs font-bold text-emerald-700 px-3 py-1.5 rounded-lg bg-emerald-50">Publicar</button>}
            {r.estado !== 'borrador' && <button onClick={() => nuevaVersion(r)} className="text-xs font-bold text-[#0100FD] px-3 py-1.5 rounded-lg bg-blue-50">Nueva versión</button>}
          </div>
        </div>
      ))}

      {detalle && <Detalle receta={detalle.receta} detalles={detalle.detalles} onClose={() => setDetalle(null)} />}
      {editor && (
        <RecetaEditor receta={editor.receta} detalles={editor.detalles} articulos={articulos} unidades={unidades}
          onClose={() => setEditor(null)} onSaved={async (msg) => { setEditor(null); toast(msg); await recargar(); }} />
      )}
    </div>
  );
}
