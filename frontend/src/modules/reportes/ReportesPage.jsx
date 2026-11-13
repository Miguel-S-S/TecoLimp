import React, { useMemo } from 'react';
import { Share2 } from 'lucide-react';

const dinero = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// "ventas" son las ventas confirmadas (v_ventas); las anuladas no cuentan
export default function ReportesPage({ ventas, gastos, toast }) {
  const totalVentas = useMemo(() => ventas.reduce((a, s) => a + Number(s.total), 0), [ventas]);
  const cobrado = useMemo(() => ventas.reduce((a, s) => a + Number(s.pagado), 0), [ventas]);
  const porCobrar = useMemo(() => ventas.reduce((a, s) => a + Number(s.saldo), 0), [ventas]);
  const totalGastos = useMemo(() => gastos.filter((g) => g.estado !== 'anulado').reduce((a, g) => a + Number(g.importe), 0), [gastos]);
  const ganancia = totalVentas - totalGastos;

  const compartir = () => {
    const texto = `Hola! Resumen JUMA:\n- Ventas: ${dinero(totalVentas)}\n- Cobrado: ${dinero(cobrado)}\n- Por cobrar: ${dinero(porCobrar)}\n- Gastos: ${dinero(totalGastos)}\n- Ganancia Limpia: ${dinero(ganancia)}`;
    navigator.clipboard.writeText(texto);
    toast('¡Resumen copiado para WhatsApp!');
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Balance General & Ganancia Limpia</span>
        <h2 className="text-4xl font-black text-slate-900">{dinero(ganancia)}</h2>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
            <span className="text-[10px] text-emerald-700 block font-bold uppercase">Ventas Totales</span>
            <span className="font-extrabold text-lg text-emerald-600">{dinero(totalVentas)}</span>
          </div>
          <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
            <span className="text-[10px] text-rose-700 block font-bold uppercase">Gastos Totales</span>
            <span className="font-extrabold text-lg text-rose-600">-{dinero(totalGastos)}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 block font-bold uppercase">Cobrado</span>
            <span className="font-extrabold text-lg text-slate-700">{dinero(cobrado)}</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
            <span className="text-[10px] text-amber-700 block font-bold uppercase">Por cobrar</span>
            <span className="font-extrabold text-lg text-amber-700">{dinero(porCobrar)}</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400">La "ganancia limpia" resta los gastos a las ventas, sin considerar el costo de la mercadería. El margen real por producto llega con la etapa de reportes.</p>
      </div>
      <button onClick={compartir} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition">
        <Share2 className="w-5 h-5" /> Compartir Resumen por WhatsApp
      </button>
    </div>
  );
}
