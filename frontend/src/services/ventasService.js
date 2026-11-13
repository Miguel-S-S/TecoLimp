import { supabase } from '../supabaseClient';

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

export const listarMediosPago = () => supabase.from('medios_pago').select('*').order('orden').then(unwrap);
export const guardarMedioPago = (p) => supabase.rpc('medio_pago_guardar', { p }).then(unwrap);
export const listarParametros = async () => {
  const filas = await supabase.from('parametros').select('*').then(unwrap);
  return Object.fromEntries(filas.map((f) => [f.clave, f.valor]));
};
export const guardarParametro = (clave, valor) => supabase.rpc('parametro_guardar', { p_clave: clave, p_valor: valor }).then(unwrap);

export const listarVentas = () =>
  supabase.from('v_ventas').select('*').order('numero', { ascending: false }).limit(300).then(unwrap);
export const listarDetallesVenta = (ventaId) =>
  supabase.from('v_venta_detalles').select('*').eq('venta_id', ventaId).order('orden').then(unwrap);
export const listarLotesVenta = (ventaId) =>
  supabase.from('v_venta_detalle_lotes').select('*').eq('venta_id', ventaId).then(unwrap);
export const listarPagosVenta = (ventaId) =>
  supabase.from('v_venta_pagos').select('*').eq('venta_id', ventaId).order('fecha').then(unwrap);

// Una sola transacción en PostgreSQL: stock, detalle, pagos y entrega
export const registrarVenta = (p) => supabase.rpc('venta_registrar', { p }).then(unwrap);
export const registrarPagoVenta = (ventaId, medioId, monto, referencia = null) =>
  supabase.rpc('venta_registrar_pago', { p_venta: ventaId, p_medio: medioId, p_monto: monto, p_referencia: referencia }).then(unwrap);
export const anularPagoVenta = (pagoId, motivo) => supabase.rpc('venta_anular_pago', { p_pago: pagoId, p_motivo: motivo }).then(unwrap);
export const anularVenta = (ventaId, motivo) => supabase.rpc('venta_anular', { p_venta: ventaId, p_motivo: motivo }).then(unwrap);

export const listarEntregas = () =>
  supabase.from('v_entregas').select('*').order('fecha_prevista', { ascending: true, nullsFirst: false }).limit(300).then(unwrap);
export const cambiarEstadoEntrega = (entregaId, estado, observaciones = null) =>
  supabase.rpc('entrega_cambiar_estado', { p_entrega: entregaId, p_estado: estado, p_observaciones: observaciones }).then(unwrap);
