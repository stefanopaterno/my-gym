import type { MuscleGroup } from '../db/schema';

const p = { fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', viewBox: '0 0 24 24' } as const;

export const IconPlay = () => <svg {...p}><path d="M7 4v16l13-8z" /></svg>;
export const IconPlans = () => <svg {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>;
export const IconDumbbell = () => <svg {...p}><path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" /></svg>;
export const IconHistory = () => <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
export const IconSettings = () => <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></svg>;
export const IconBack = () => <svg {...p}><path d="M15 5l-7 7 7 7" /></svg>;
export const IconPlus = () => <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
export const IconCamera = () => <svg {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>;

const COLORS: Record<MuscleGroup, string> = {
  Petto: '#e5383b', Dorsali: '#3a86ff', Spalle: '#f4a100', Bicipiti: '#8338ec', Tricipiti: '#d6249f',
  Addominali: '#16a34a', Gambe: '#0891b2', Glutei: '#ea580c', Altro: '#6b7280',
};

/** Icona generica per esercizi senza foto, colorata per gruppo muscolare. */
export function MuscleIcon({ group, size = 52 }: { group: MuscleGroup; size?: number }) {
  const c = COLORS[group] ?? COLORS.Altro;
  return (
    <div class="thumb thumb-svg" style={{ width: size, height: size, color: c }}>
      <svg {...p} width={size * 0.6} height={size * 0.6} style={{ strokeWidth: 2 }}>
        <path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" />
      </svg>
    </div>
  );
}
