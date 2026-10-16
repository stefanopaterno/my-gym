import { IconBack } from './Icons';
import { go } from '../lib/router';

/** Freccia indietro. Senza `to` torna alla schermata precedente (o alla Home se non c'è). */
export function BackButton({ to }: { to?: string }) {
  const onClick = () => (to !== undefined || history.length <= 1 ? go(to ?? '') : history.back());
  return <button class="btn icon" aria-label="Indietro" onClick={onClick}><IconBack /></button>;
}
