import { supabase } from '../supabaseClient';

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

export const exportarBackup = (pin) =>
  supabase.rpc('backup_exportar', { p_pin: pin }).then(unwrap);

export const restaurarBackup = (backup, pin, confirmacion) =>
  supabase.rpc('backup_restaurar', { p: backup, p_pin: pin, p_confirmar: confirmacion }).then(unwrap);
