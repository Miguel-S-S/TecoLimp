import { supabase } from '../supabaseClient';

// Transitoria (Etapa 6 la reemplaza): una sola transacción en PostgreSQL.
export async function registrarVenta({ cliente, metodo, items }) {
  const { data, error } = await supabase.rpc('venta_registrar_transitoria', {
    p_cliente: cliente,
    p_metodo: metodo,
    p_items: items.map((i) => ({ articulo_id: i.id, qty: i.qty })),
  });
  if (error) throw new Error(error.message);
  return data;
}