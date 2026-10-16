import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app';
import './styles/app.css';

registerSW({ immediate: true });

// Alcuni iPhone con isola dinamica calcolano l'altezza dell'app installata più corta dello schermo
// (striscia vuota sotto la tab bar). Se rileviamo quel caso, spostiamo gli elementi fissi in basso.
function fixAppHeight() {
  const standalone = (navigator as unknown as { standalone?: boolean }).standalone === true || matchMedia('(display-mode: standalone)').matches;
  const gap = standalone ? screen.height - window.innerHeight : 0;
  const px = gap > 20 && gap < 120 ? gap : 0;
  document.documentElement.style.setProperty('--gap', `${px}px`);
  document.documentElement.style.setProperty('--app-h', px ? `${window.innerHeight + px}px` : '100dvh');
}
fixAppHeight();
addEventListener('resize', fixAppHeight);
addEventListener('orientationchange', fixAppHeight);
render(<App />, document.getElementById('app')!);
