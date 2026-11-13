import { supabase } from '../supabaseClient';

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

export const TIPOS_COMPRABLES = ['MateriaPrima', 'Insumo', 'ProductoReventa'];

export const listarProveedores = () => supabase.from('v_proveedores').select('*').order('nombre').then(unwrap);
export const guardarProveedor = (p) => supabase.rpc('proveedor_guardar', { p }).then(unwrap);
export const listarProductosProveedor = (proveedorId) =>
  supabase.from('v_proveedor_articulos').select('*').eq('proveedor_id', proveedorId).order('articulo_nombre').then(unwrap);
export const guardarProductoProveedor = (p) => supabase.rpc('proveedor_articulo_guardar', { p }).then(unwrap);

export const listarCompras = () =>
  supabase.from('v_compras').select('*').order('numero', { ascending: false }).limit(300).then(unwrap);
export const obtenerDetallesCompra = (compraId) =>
  supabase.from('v_compra_detalles').select('*').eq('compra_id', compraId).order('orden').then(unwrap);
export const guardarCompra = (p) => supabase.rpc('compra_guardar', { p }).then(unwrap);
export const confirmarCompra = (compraId) => supabase.rpc('compra_confirmar', { p_compra: compraId }).then(unwrap);
export const anularCompra = (compraId, motivo) =>
  supabase.rpc('compra_anular', { p_compra: compraId, p_motivo: motivo }).then(unwrap);
