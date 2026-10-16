import { getDB } from '../db/db';
import { getSettings, saveSettings } from '../db/repo';
import { SEED_EXERCISES, SEED_PLANS, SEED_REST_SECONDS, SEED_REV } from '../seed';

/** Foto di seed (public/exercises/<id>.jpg). Se manca o sei offline: nessuna foto. */
async function fetchPhoto(id: string): Promise<Blob | undefined> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}exercises/${id}.jpg`);
    return res.ok ? await res.blob() : undefined;
  } catch {
    return undefined;
  }
}

/** Aggiunge i dati di seed mancanti e le foto mancanti (non sovrascrive nulla di tuo). */
export async function loadSeed() {
  const db = await getDB();
  const photos = new Map(await Promise.all(SEED_EXERCISES.map(async (e) => [e.id, await fetchPhoto(e.id)] as const)));
  let added = 0;
  const tx = db.transaction(['exercises', 'plans'], 'readwrite');
  for (const e of SEED_EXERCISES) {
    const cur = await tx.objectStore('exercises').get(e.id);
    if (!cur) {
      await tx.objectStore('exercises').put({ notes: '', ...e, image: photos.get(e.id) });
      added++;
    } else if (!cur.image && photos.get(e.id)) {
      await tx.objectStore('exercises').put({ ...cur, image: photos.get(e.id) });
    }
  }
  for (const p of SEED_PLANS) {
    const cur = await tx.objectStore('plans').get(p.id);
    if (!cur) {
      await tx.objectStore('plans').put(p);
      added++;
    } else if (cur.order === undefined) {
      await tx.objectStore('plans').put({ ...cur, order: p.order });
    }
  }
  await tx.done;
  const s = await getSettings();
  if (s.restSeconds === 90) await saveSettings({ restSeconds: SEED_REST_SECONDS });
  await saveSettings({ seedMigrated: SEED_REV });
  return added;
}

/** All'avvio: se il seed è stato rivisto (foto, superserie…), riapplica le schede di seed. */
export async function migrateSeed() {
  const s = await getSettings();
  if (!s.onboardingDone || (s.seedMigrated ?? 0) >= SEED_REV) return;
  const db = await getDB();
  for (const p of SEED_PLANS) await db.put('plans', p);
  await loadSeed();
}
