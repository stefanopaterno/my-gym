import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Exercise, Plan, Session, Settings } from './schema';

interface GymDB extends DBSchema {
  exercises: { key: string; value: Exercise };
  plans: { key: string; value: Plan };
  sessions: { key: string; value: Session; indexes: { byStart: number } };
  settings: { key: string; value: { key: string; value: Settings[keyof Settings] } };
}

// Versione di IndexedDB (struttura degli store). Distinta da SCHEMA_VERSION dei dati.
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<GymDB>> | undefined;

export function getDB() {
  dbPromise ??= openDB<GymDB>('my-gym', DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('exercises', { keyPath: 'id' });
        db.createObjectStore('plans', { keyPath: 'id' });
        db.createObjectStore('sessions', { keyPath: 'id' }).createIndex('byStart', 'startedAt');
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      // if (oldVersion < 2) { ... migrazioni future ... }
    },
  });
  return dbPromise;
}
