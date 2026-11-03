import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

const $ = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function ProductoVariantes({ padre, hijos, enCarrito, onAgregar }) {
  const opciones = padre.opciones || [];
  const activos = hijos.filter((h) => h.estado === 'activo');
  const [sel, setSel] = useState(() => activos[0]?.atributos || {});
  const [cant, setCant] = useState(1);

  const coincide = (h, s) => opciones.every((o) => h.atributos?.[o.nombre] === s[o.nombre]);
  const variante = activos.find((h) => coincide(h, sel));
  const hayCon = (nombre, valor) => activos.some((h) => h.atributos?.[nombre] === valor
    && opciones.every((o) => o.nombre === nombre || h.atributos?.[o.nombre] === sel[o.nombre]));

  const elegir = (nombre, valor) => setSel((prev) => {
    const next = { ...prev, [nombre]: valor };
    if (activos.some((h) => coincide(h, next))) return next;
    return activos.find((h) => h.atributos?.[nombre] === valor)?.atributos || prev;
  });

  const controla = variante?.controla_stock;
  const stock = Number(variante?.stock || 0);
  const agotado = variante && controla && stock <= 0;
  const antes = variante?.precio_anterior ? Number(variante.precio_anterior) : null;
  const precio = Number(variante?.precio_venta || 0);
  const descuento = antes && antes > precio ? Math.round((1 - precio / antes) * 100) : 0;
  const enCar = variante ? enCarrito[variante.id] || 0 : 0;

  return (
    <div className="sm:col-span-2 p-4 rounded-2xl border border-slate-200 bg-white space-y-4">
      <div className="flex gap-4">
        {padre.imagen_url && <img src={padre.imagen_url} alt={padre.nombre} className="w-28 h-28 object-contain rounded-xl bg-slate-50 shrink-0" />}
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-100/60 text-[#0100FD] rounded-md">{padre.categoria}</span>
          <h4 className="font-bold text-base text-slate-800 mt-1 uppercase leading-tight">{padre.nombre}</h4>
          {variante ? (
            <div className="mt-1">
              {antes && <span className="text-sm text-slate-400 line-through mr-2">{$(antes)}</span>}
              <span className="text-2xl font-black text-slate-900">{$(precio)}</span>
              {descuento > 0 && (
                <p className="text-xs text-slate-500">Ahorrás: {$(antes - precio)} <span className="font-bold text-amber-500">{descuento}% OFF</span></p>
              )}
            </div>
          ) : <p className="text-sm text-rose-500 mt-1">Combinación no disponible</p>}
        </div>
      </div>

      {opciones.map((o) => (
        <div key={o.nombre}>
          <p className="text-xs text-slate-600 mb-1.5 uppercase">{o.nombre}: <span className="font-bold text-slate-900">{sel[o.nombre]}</span></p>
          <div className="flex flex-wrap gap-2">
            {o.valores.map((v) => {
              const elegido = sel[o.nombre] === v;
              const existe = hayCon(o.nombre, v);
              return (
                <button key={v} type="button" onClick={() => elegir(o.nombre, v)}
                  className={`px-3 py-1.5 rounded-md border text-xs transition ${elegido ? 'border-[#0100FD] text-[#0100FD] bg-blue-50 font-bold' : existe ? 'border-slate-300 text-slate-600 hover:border-slate-400' : 'border-dashed border-slate-200 text-slate-300'}`}>
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {padre.descripcion && <p className="text-xs text-slate-500 whitespace-pre-line">{padre.descripcion}</p>}

      <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
        <input type="number" min="1" step="any" value={cant} onChange={(e) => setCant(e.target.value)} disabled={!variante || agotado}
          className="w-16 text-center border border-slate-300 rounded-lg py-2 text-sm font-bold" />
        <button type="button" disabled={!variante || agotado}
          onClick={() => { onAgregar(variante.id, parseFloat(cant) || 1); setCant(1); }}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white py-2.5 rounded-lg font-bold text-sm uppercase tracking-wide transition">
          {agotado ? 'Sin stock' : 'Agregar al carrito'}
        </button>
      </div>
      <div className="flex justify-between text-[11px] text-slate-400">
        <span>{variante && controla ? `Stock: ${stock} ${variante.unidad_codigo}` : variante ? 'A pedido' : ''}</span>
        {enCar > 0 && <span className="text-[#0100FD] font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> {enCar} en el carrito</span>}
      </div>
    </div>
  );
}