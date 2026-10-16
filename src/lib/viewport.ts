/** Altezza reale dell'area in cui si posizionano gli elementi "fixed" (non sempre uguale a innerHeight su iOS). */
export function fixedHeight(): number {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:1px;bottom:0;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  const h = probe.offsetHeight;
  probe.remove();
  return h;
}

/**
 * Alcuni iPhone con isola dinamica calcolano l'altezza dell'app installata più corta dello schermo:
 * resta una striscia vuota sotto la tab bar. Se rileviamo quel caso, spostiamo gli elementi fissi in basso.
 */
export function fixAppHeight() {
  const standalone = (navigator as unknown as { standalone?: boolean }).standalone === true || matchMedia('(display-mode: standalone)').matches;
  const fixed = fixedHeight();
  const gap = standalone && fixed ? screen.height - fixed : 0;
  const px = gap > 20 && gap < 120 ? gap : 0;
  const root = document.documentElement.style;
  root.setProperty('--gap', `${px}px`);
  root.setProperty('--app-h', px ? `${fixed + px}px` : '100dvh');
}
