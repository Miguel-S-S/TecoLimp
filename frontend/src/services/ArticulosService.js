import { supabase } from '../supabaseClient';

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

export const TIPOS_ARTICULO = {
  MateriaPrima: 'Materia prima',
  Insumo: 'Insumo',
  ProductoElaborado: 'Elaborado',
  ProductoReventa: 'Reventa',
};
export const TIPOS_VENDIBLES = ['ProductoElaborado', 'ProductoReventa'];

export const listarArticulos = () => supabase.from('v_articulos').select('*').order('nombre').then(unwrap);
export const listarCategorias = () => supabase.from('categorias_articulo').select('*').order('nombre').then(unwrap);
export const listarUnidades = () => supabase.from('unidades_medida').select('*').order('dimension').order('factor_base', { ascending: false }).then(unwrap);

export const guardarArticulo = (payload) => supabase.rpc('articulo_guardar', { p: payload }).then(unwrap);
export const ajustarStock = (articuloId, nuevoStock, motivo) =>
  supabase.rpc('articulo_ajustar_stock', { p_articulo: articuloId, p_nuevo: nuevoStock, p_motivo: motivo }).then(unwrap);
export const cambiarEstadoArticulo = (articuloId, estado) =>
  supabase.rpc('articulo_cambiar_estado', { p_articulo: articuloId, p_estado: estado }).then(unwrap);

// Transitorias hasta las Etapas 4 y 6
export const crearPreparado = (nombre, precio, cantidad) =>
  supabase.rpc('preparado_crear', { p_nombre: nombre, p_precio: precio, p_cantidad: cantidad }).then(unwrap);
export const sumarStockPreparado = (articuloId, cantidad) =>
  supabase.rpc('preparado_sumar_stock', { p_articulo: articuloId, p_cantidad: cantidad }).then(unwrap);

export const guardarProductoConVariantes = (payload) =>
  supabase.rpc('articulo_variantes_guardar', { p: payload }).then(unwrap);