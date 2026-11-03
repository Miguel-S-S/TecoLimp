import { useCallback, useEffect, useState } from 'react';
import { listarArticulos, listarCategorias, listarUnidades } from '../services/ArticulosService';

export default function useArticulos() {
  const [articulos, setArticulos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    try {
      const [a, c, u] = await Promise.all([listarArticulos(), listarCategorias(), listarUnidades()]);
      setArticulos(a);
      setCategorias(c);
      setUnidades(u);
      setError(null);
    } catch (e) {
      console.error('Error al cargar el catálogo:', e);
      setError(e.message);
    }
  }, []);

  useEffect(() => { recargar(); }, [recargar]);

  return { articulos, categorias, unidades, error, recargar };
}