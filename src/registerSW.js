// Registra o service worker só em produção. Em dev, o SW interceptando os
// módulos ES/HMR do Vite (@react-refresh, main.jsx com query strings, etc.)
// causa "Failed to fetch" aleatório — então, em dev, desregistra qualquer SW
// e limpa caches que tenham ficado de uma sessão anterior de build/preview.
export function setupServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  if (import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
    return;
  }

  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });

  if (window.caches?.keys) {
    caches.keys().then((keys) => {
      keys.forEach((k) => caches.delete(k));
    });
  }
}