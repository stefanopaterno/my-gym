// Screen Wake Lock: schermo acceso durante l'allenamento. Nessun errore se non supportato.
type Sentinel = { release: () => Promise<void> };
let sentinel: Sentinel | undefined;
let wanted = false;

async function acquire() {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } }).wakeLock;
    if (wl && wanted && !sentinel) sentinel = await wl.request('screen');
  } catch { /* non supportato o negato */ }
}
document.addEventListener('visibilitychange', () => {
  sentinel = undefined; // il lock viene rilasciato dal sistema quando la pagina è nascosta
  if (document.visibilityState === 'visible') void acquire();
});

export function keepAwake(on: boolean) {
  wanted = on;
  if (on) void acquire();
  else { void sentinel?.release().catch(() => {}); sentinel = undefined; }
}
