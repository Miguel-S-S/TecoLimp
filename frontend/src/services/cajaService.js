import { supabase } from '../supabaseClient';

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

export const listarSesionesCaja = () =>
  supabase.from('v_caja_sesiones').select('*').order('numero', { ascending: false }).limit(100).then(unwrap);
export const listarMovimientosCaja = ({ sesionId = null, limite = 300 } = {}) => {
  let q = supabase.from('v_caja_movimientos').select('*').order('numero', { ascending: false }).limit(limite);
  if (sesionId) q = q.eq('sesion_id', sesionId);
  return q.then(unwrap);
};
export const listarTotalesCaja = (sesionId) => supabase.from('v_caja_totales').select('*').eq('sesion_id', sesionId).order('medio_pago').then(unwrap);

export const abrirCaja = (p) => supabase.rpc('caja_abrir', { p }).then(unwrap);
export const cerrarCaja = (p) => supabase.rpc('caja_cerrar', { p }).then(unwrap);
export const movimientoManual = (p) => supabase.rpc('caja_movimiento_manual', { p }).then(unwrap);
export const revertirMovimiento = (movId, motivo) => supabase.rpc('caja_movimiento_revertir', { p_mov: movId, p_motivo: motivo }).then(unwrap);

export const listarGastos = () =>
  supabase.from('v_gastos').select('*').order('numero', { ascending: false }).limit(300).then(unwrap);
export const registrarGasto = (p) => supabase.rpc('gasto_registrar', { p }).then(unwrap);
export const anularGasto = (gastoId, motivo) => supabase.rpc('gasto_anular', { p_gasto: gastoId, p_motivo: motivo }).then(unwrap);
export const listarCategoriasGasto = () => supabase.from('categorias_gasto').select('*').order('nombre').then(unwrap);
export const guardarCategoriaGasto = (p) => supabase.rpc('categoria_gasto_guardar', { p }).then(unwrap);
