import { useCallback, useEffect, useState } from 'react';
import { listarLotes, listarUbicaciones } from '../services/inventarioService';

export default function useInventario() {
  const [lotes, setLotes] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    try {
      const [l, u] = await Promise.all([listarLotes(), listarUbicaciones()]);
      setLotes(l);
      setUbicaciones(u);
      setError(null);
    } catch (e) {
      console.error('Error al cargar el inventario:', e);
      setError(e.message);
    }
  }, []);

  useEffect(() => { recargar(); }, [recargar]);

  return { lotes, ubicaciones, error, recargar };
}
