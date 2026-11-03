import React, { useMemo } from 'react';
import { Share2 } from 'lucide-react';

export default function ReportesPage({ ventas, gastos, toast }) {
  const totalVentas = useMemo(() => ventas.reduce((a, s) => a + Number(s.total), 0), [ventas]);
  const totalGastos = useMemo(() => gastos.reduce((a, g) => a + Number(g.amount), 0), [gastos]);
  const ganancia = totalVentas - totalGastos;

  const compartir = () => {
    const texto = `Hola! Resumen JUMA:\n- Ventas: $${totalVentas}\n- Gastos: $${totalGastos}\n- Ganancia Limpia: $${ganancia}`;
    navigator.clipboard.writeText(texto);
    toast('¡Resumen copiado para WhatsApp!');
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Balance General & Ganancia Limpia</span>
        <h2 className="text-4xl font-black text-slate-900">${ganancia}</h2>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
            <span className="text-[10px] text-emerald-700 block font-bold uppercase">Ventas Totales</span>
            <span className="font-extrabold text-lg text-emerald-600">${totalVentas}</span>
          </div>
          <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
            <span className="text-[10px] text-rose-700 block font-bold uppercase">Gastos Totales</span>
            <span className="font-extrabold text-lg text-rose-600">-${totalGastos}</span>
          </div>
        </div>
      </div>
      <button onClick={compartir} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition">
        <Share2 className="w-5 h-5" /> Compartir Resumen por WhatsApp
      </button>
    </div>
  );
}