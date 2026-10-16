import { getDB } from './db';
import { DEFAULT_SETTINGS, type Exercise, type Plan, type Session, type Settings } from './schema';
import { uid } from '../lib/id';

// ---- Esercizi ----
export const listExercises = async () =>
  (await (await getDB()).getAll('exercises')).sort((a, b) => a.name.localeCompare(b.name, 'it'));
export const getExercise = async (id: string) => (await getDB()).get('exercises', id);
export const saveExercise = async (e: Exercise) => void (await (await getDB()).put('exercises', e));
export const deleteExercise = async (id: string) => void (await (await getDB()).delete('exercises', id));

export const newExercise = (): Exercise => ({
  id: uid(), name: '', equipment: '', muscleGroup: 'Petto',
  defaultSets: 3, defaultReps: 10, defaultWeight: 0, notes: '',
});

// ---- Schede ----
export const listPlans = async () =>
  (await (await getDB()).getAll('plans')).sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999) || a.name.localeCompare(b.name, 'it'));
export const getPlan = async (id: string) => (await getDB()).get('plans', id);
export const savePlan = async (p: Plan) => void (await (await getDB()).put('plans', p));
export const deletePlan = async (id: string) => void (await (await getDB()).delete('plans', id));

// ---- Sessioni ----
export const listSessions = async () =>
  (await (await getDB()).getAllFromIndex('sessions', 'byStart')).reverse();
export const getSession = async (id: string) => (await getDB()).get('sessions', id);
export const saveSession = async (s: Session) => void (await (await getDB()).put('sessions', s));
export const deleteSession = async (id: string) => void (await (await getDB()).delete('sessions', id));

/** Sessione in corso (senza endedAt), se esiste. */
export async function getActiveSession() {
  return (await listSessions()).find((s) => s.endedAt === undefined);
}

// ---- Impostazioni ----
export async function getSettings(): Promise<Settings> {
  const rows = await (await getDB()).getAll('settings');
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.key] = r.value;
  return out as unknown as Settings;
}
export async function saveSettings(patch: Partial<Settings>) {
  const db = await getDB();
  const tx = db.transaction('settings', 'readwrite');
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) void tx.store.delete(key);
    else void tx.store.put({ key, value } as never);
  }
  await tx.done;
}
