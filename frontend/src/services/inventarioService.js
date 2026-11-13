import { supabase } from '../supabaseClient';

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

export const listarLotes = () =>
  supabase.from('v_lotes').select('*').order('fecha_vencimiento', { ascending: true, nullsFirst: false }).then(unwrap);
export const listarUbicaciones = () => supabase.from('ubicaciones').select('*').order('nombre').then(unwrap);

export const listarMovimientos = ({ loteId = null, limite = 200 } = {}) => {
  let q = supabase.from('v_movimientos').select('*').order('id', { ascending: false }).limit(limite);
  if (loteId) q = q.eq('lote_id', loteId);
  return q.then(unwrap);
};

export const ingresarLote = (p) => supabase.rpc('lote_ingresar', { p }).then(unwrap);
export const ajustarLote = (loteId, nueva, motivo) =>
  supabase.rpc('lote_ajustar', { p_lote: loteId, p_nueva: nueva, p_motivo: motivo }).then(unwrap);
export const cambiarEstadoLote = (loteId, estado, motivo = null) =>
  supabase.rpc('lote_cambiar_estado', { p_lote: loteId, p_estado: estado, p_motivo: motivo }).then(unwrap);
export const editarLote = (p) => supabase.rpc('lote_editar', { p }).then(unwrap);
export const guardarUbicacion = (p) => supabase.rpc('ubicacion_guardar', { p }).then(unwrap);
