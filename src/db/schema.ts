// Versione dello schema dei dati. Va incrementata quando cambia la forma dei
// record e aggiunta una migrazione in db.ts (upgrade) e backup.ts (import).
export const SCHEMA_VERSION = 1;

export const MUSCLE_GROUPS = [
  'Petto', 'Dorsali', 'Spalle', 'Bicipiti', 'Tricipiti',
  'Addominali', 'Gambe', 'Glutei', 'Altro',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export interface Exercise {
  id: string;
  name: string;
  equipment: string;
  muscleGroup: MuscleGroup;
  image?: Blob;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number; // kg
  notes: string;
}

/** Elemento di una scheda: i campi vuoti ereditano dal default dell'esercizio. */
export interface PlanItem {
  exerciseId: string;
  sets?: number;
  reps?: number;
  weight?: number;
  /** Superserie: questo esercizio è accoppiato con quello successivo. */
  superset?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  order: number; // ordine di rotazione degli allenamenti
  items: PlanItem[]; // ordinato
}

export interface LoggedSet {
  reps: number;
  weight: number;
  done: boolean;
}

export interface SessionEntry {
  exerciseId: string;
  exerciseName: string; // snapshot: lo storico resta leggibile se l'esercizio viene eliminato
  skipped: boolean;
  superset?: boolean; // accoppiato con l'esercizio successivo
  sets: LoggedSet[];
}

export interface Session {
  id: string;
  startedAt: number; // data/ora dell'allenamento (modificabile), epoch ms
  beganAt: number; // istante reale di inizio, per calcolare la durata
  endedAt?: number; // assente = sessione in corso
  durationSec: number;
  planId: string;
  planName: string;
  notes: string;
  entries: SessionEntry[];
}

export interface Settings {
  restEnabled: boolean;
  restSeconds: number;
  lastBackupAt?: number;
  onboardingDone: boolean;
  weeklyGoal: number; // allenamenti a settimana
  seedMigrated?: number; // revisione del seed già applicata
  installHintDismissed?: boolean; // suggerimento "Aggiungi a Home" nascosto
}

export const DEFAULT_SETTINGS: Settings = {
  restEnabled: true,
  restSeconds: 90,
  onboardingDone: false,
  weeklyGoal: 3,
};
