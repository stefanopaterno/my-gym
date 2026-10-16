import { IconDumbbell, IconHistory, IconPlans, IconPlay } from './Icons';

const TABS = [
  { path: 'allena', label: 'Allena', icon: <IconPlay /> },
  { path: 'schede', label: 'Schede', icon: <IconPlans /> },
  { path: 'esercizi', label: 'Esercizi', icon: <IconDumbbell /> },
  { path: 'storico', label: 'Storico', icon: <IconHistory /> },
];

export function TabBar({ current }: { current: string }) {
  return (
    <nav class="tabbar">
      {TABS.map((t) => (
        <a key={t.path} href={`#/${t.path}`} class={current === t.path ? 'active' : ''}>
          {t.icon}
          {t.label}
        </a>
      ))}
    </nav>
  );
}
