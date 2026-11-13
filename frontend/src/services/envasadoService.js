import { supabase } from '../supabaseClient';

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

export const listarPresentaciones = () => supabase.from('v_presentaciones').select('*').order('nombre').then(unwrap);
export const guardarPresentacion = (p) => supabase.rpc('presentacion_guardar', { p }).then(unwrap);

export const previstoEnvasado = (presentacionId, unidades, granelReal = null) =>
  supabase.rpc('envasado_previsto', { p_presentacion: presentacionId, p_unidades: unidades, p_granel_real: granelReal }).then(unwrap);
export const crearEnvasado = (p) => supabase.rpc('envasado_crear', { p }).then(unwrap);
export const anularEnvasado = (ordenId, motivo) => supabase.rpc('envasado_anular', { p_orden: ordenId, p_motivo: motivo }).then(unwrap);

export const listarOrdenesEnvasado = () =>
  supabase.from('v_ordenes_envasado').select('*').order('numero', { ascending: false }).limit(300).then(unwrap);
export const listarConsumosEnvasado = (ordenId) =>
  supabase.from('v_envasado_consumos').select('*').eq('orden_id', ordenId).order('created_at').then(unwrap);
