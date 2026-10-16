import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app';
import { fixAppHeight } from './lib/viewport';
import './styles/app.css';

registerSW({ immediate: true });

fixAppHeight();
setTimeout(fixAppHeight, 300); // iOS stabilizza l'altezza poco dopo l'avvio
setTimeout(fixAppHeight, 1200);
addEventListener('resize', fixAppHeight);
addEventListener('orientationchange', fixAppHeight);
render(<App />, document.getElementById('app')!);
