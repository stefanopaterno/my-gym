import type { LoggedSet, Session } from '../db/schema';
import { setVolume } from './format';

export interface ExerciseLog {
  sessionId: string;
  date: number;
  sets: LoggedSet[]; // solo completate
  maxWeight: number;
  volume: number;
}

/** Storico di un esercizio, dal più vecchio al più recente (solo sessioni concluse). */
export function exerciseHistory(sessions: Session[], exerciseId: string): ExerciseLog[] {
  const out: ExerciseLog[] = [];
  for (const s of sessions) {
    if (s.endedAt === undefined) continue;
    for (const e of s.entries) {
      if (e.exerciseId !== exerciseId || e.skipped) continue;
      const sets = e.sets.filter((x) => x.done);
      if (!sets.length) continue;
      out.push({ sessionId: s.id, date: s.startedAt, sets, maxWeight: Math.max(...sets.map((x) => x.weight)), volume: setVolume(sets) });
    }
  }
  return out.sort((a, b) => a.date - b.date);
}

/** Ultima volta che l'esercizio è stato svolto (escludendo la sessione indicata). */
export function lastTime(sessions: Session[], exerciseId: string, excludeSessionId?: string) {
  return exerciseHistory(sessions.filter((s) => s.id !== excludeSessionId), exerciseId).at(-1);
}

export function personalRecords(log: ExerciseLog[]) {
  if (!log.length) return undefined;
  const bestWeight = log.reduce((a, b) => (b.maxWeight > a.maxWeight ? b : a));
  const bestVolume = log.reduce((a, b) => (b.volume > a.volume ? b : a));
  const topSet = bestWeight.sets.filter((s) => s.weight === bestWeight.maxWeight).reduce((a, b) => (b.reps > a.reps ? b : a));
  return { bestWeight, bestVolume, topSet };
}

export const sessionVolume = (s: Session) => s.entries.reduce((a, e) => a + (e.skipped ? 0 : setVolume(e.sets)), 0);
export const sessionSetsDone = (s: Session) => s.entries.reduce((a, e) => a + (e.skipped ? 0 : e.sets.filter((x) => x.done).length), 0);

export function startOfWeek(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // lunedì
  return d.getTime();
}
