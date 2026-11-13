// Registra el service worker (solo en producción) para que la app sea instalable.
export default function registrarSW() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('SW no registrado:', err));
  });
}
