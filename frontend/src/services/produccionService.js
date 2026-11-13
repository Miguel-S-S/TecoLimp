import { supabase } from '../supabaseClient';

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

export const TIPOS_INGREDIENTE = ['MateriaPrima', 'Insumo', 'ProductoElaborado'];

export const listarRecetas = () =>
  supabase.from('v_recetas').select('*').order('articulo_nombre').order('version', { ascending: false }).then(unwrap);
export const listarDetallesReceta = (recetaId) =>
  supabase.from('v_receta_detalles').select('*').eq('receta_id', recetaId).order('orden').then(unwrap);
export const guardarReceta = (p) => supabase.rpc('receta_guardar', { p }).then(unwrap);
export const publicarReceta = (recetaId) => supabase.rpc('receta_publicar', { p_receta: recetaId }).then(unwrap);
export const nuevaVersionReceta = (recetaId) => supabase.rpc('receta_nueva_version', { p_receta: recetaId }).then(unwrap);

export const listarOrdenes = () =>
  supabase.from('v_ordenes_produccion').select('*').order('numero', { ascending: false }).limit(300).then(unwrap);
export const listarPrevistos = (ordenId) =>
  supabase.from('v_produccion_previstos').select('*').eq('orden_id', ordenId).order('orden').then(unwrap);
export const listarConsumos = (ordenId) =>
  supabase.from('v_produccion_consumos').select('*').eq('orden_id', ordenId).order('created_at').then(unwrap);
export const crearOrden = (p) => supabase.rpc('orden_crear', { p }).then(unwrap);
export const confirmarOrden = (p) => supabase.rpc('orden_confirmar', { p }).then(unwrap);
export const anularOrden = (ordenId, motivo) => supabase.rpc('orden_anular', { p_orden: ordenId, p_motivo: motivo }).then(unwrap);
