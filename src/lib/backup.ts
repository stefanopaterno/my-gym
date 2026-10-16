import { getDB } from '../db/db';
import { getSettings, saveSettings } from '../db/repo';
import { SCHEMA_VERSION, type Exercise, type Plan, type Session, type Settings } from '../db/schema';

type ExerciseJson = Omit<Exercise, 'image'> & { image?: string }; // immagine in base64 (data URL)

interface BackupFile {
  app: 'my-gym';
  schemaVersion: number;
  exportedAt: number;
  exercises: ExerciseJson[];
  plans: Plan[];
  sessions: Session[];
  settings: Partial<Settings>;
}

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });
const dataUrlToBlob = async (u: string) => (await fetch(u)).blob();

export async function buildBackup(): Promise<Blob> {
  const db = await getDB();
  const exercises = await Promise.all((await db.getAll('exercises')).map(async (e): Promise<ExerciseJson> => ({
    ...e, image: e.image ? await blobToDataUrl(e.image) : undefined,
  })));
  const data: BackupFile = {
    app: 'my-gym', schemaVersion: SCHEMA_VERSION, exportedAt: Date.now(),
    exercises, plans: await db.getAll('plans'), sessions: await db.getAll('sessions'), settings: await getSettings(),
  };
  return new Blob([JSON.stringify(data)], { type: 'application/json' });
}

/** Condivide il file (foglio di condivisione di iOS) o, in alternativa, lo scarica. */
export async function exportBackup(): Promise<'shared' | 'downloaded'> {
  const blob = await buildBackup();
  const name = `my-gym-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([blob], name, { type: 'application/json' });
  let result: 'shared' | 'downloaded' = 'downloaded';
  let shared = false;
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Backup My Gym' });
      shared = true;
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e; // l'utente ha annullato
      // altrimenti (es. gesto scaduto) ripiega sul download
    }
  }
  if (shared) result = 'shared';
  else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }
  await saveSettings({ lastBackupAt: Date.now() });
  return result;
}

export async function parseBackup(file: File): Promise<BackupFile> {
  let data: BackupFile;
  try { data = JSON.parse(await file.text()); } catch { throw new Error('Il file non è un backup valido.'); }
  if (data?.app !== 'my-gym' || typeof data.schemaVersion !== 'number') throw new Error('Questo file non è un backup di My Gym.');
  if (data.schemaVersion > SCHEMA_VERSION) throw new Error('Il backup viene da una versione più recente dell\'app. Aggiorna l\'app e riprova.');
  // Qui andranno le migrazioni dei backup vecchi quando SCHEMA_VERSION crescerà.
  return data;
}

export async function importBackup(data: BackupFile, mode: 'replace' | 'merge') {
  const exercises: Exercise[] = await Promise.all(data.exercises.map(async ({ image, ...e }) => ({
    ...e, image: image ? await dataUrlToBlob(image) : undefined,
  })));
  const db = await getDB();
  const tx = db.transaction(['exercises', 'plans', 'sessions', 'settings'], 'readwrite');
  if (mode === 'replace') await Promise.all(['exercises', 'plans', 'sessions', 'settings'].map((n) => tx.objectStore(n as 'plans').clear()));
  const put = async (store: 'exercises' | 'plans' | 'sessions', rows: { id: string }[]) => {
    for (const r of rows) {
      if (mode === 'merge' && (await tx.objectStore(store).get(r.id))) continue;
      await tx.objectStore(store).put(r as never);
    }
  };
  await put('exercises', exercises);
  await put('plans', data.plans);
  await put('sessions', data.sessions);
  if (mode === 'replace') {
    for (const [key, value] of Object.entries({ ...data.settings, onboardingDone: true })) {
      if (value !== undefined) await tx.objectStore('settings').put({ key, value } as never);
    }
  }
  await tx.done;
}
