import type { LoggedSet } from '../db/schema';

export const fmtKg = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');
export const fmtNum = (n: number) => Math.round(n).toLocaleString('it-IT');

const dayFmt = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
const dayLongFmt = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' });
export const fmtDay = (t: number) => dayFmt.format(t);
export const fmtDayLong = (t: number) => dayLongFmt.format(t);
export const fmtShort = (t: number) => shortFmt.format(t);
export const fmtTime = (t: number) => timeFmt.format(t);

export function fmtDuration(sec: number) {
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`;
}
export const fmtClock = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

/** Valore per <input type="datetime-local"> in ora locale. */
export function toLocalInput(t: number) {
  const d = new Date(t - new Date(t).getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}
export const fromLocalInput = (v: string) => new Date(v).getTime();

export const setVolume = (sets: LoggedSet[]) => sets.filter((s) => s.done).reduce((a, s) => a + s.reps * s.weight, 0);

/** "3×10 @ 40 kg" oppure, se le serie differiscono, "10×40 · 8×42,5 kg". */
export function summarizeSets(sets: LoggedSet[]) {
  const done = sets.filter((s) => s.done);
  if (!done.length) return '—';
  const same = done.every((s) => s.reps === done[0].reps && s.weight === done[0].weight);
  if (same) return `${done.length}×${done[0].reps}${done[0].weight ? ` @ ${fmtKg(done[0].weight)} kg` : ''}`;
  return done.map((s) => `${s.reps}×${fmtKg(s.weight)}`).join(' · ') + ' kg';
}
