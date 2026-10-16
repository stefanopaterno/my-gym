// DATI INIZIALI — modifica liberamente questo file.
// "Carica dati iniziali" (Impostazioni) aggiunge solo ciò che non esiste già
// (stesso `id`), senza mai sovrascrivere o cancellare i tuoi dati.
//
// Esercizio: id (stabile, a tua scelta), nome, attrezzo, gruppo, serie, rip, kg.
// Scheda: elenco ORDINATO di esercizi; sets/reps/weight sono override opzionali.
import type { Exercise, MuscleGroup, Plan, PlanItem } from './db/schema';

type SeedExercise = Omit<Exercise, 'image' | 'notes'> & { notes?: string };

const ex = (
  id: string, name: string, equipment: string, muscleGroup: MuscleGroup,
  defaultSets: number, defaultReps: number, defaultWeight: number, notes = '',
): SeedExercise => ({ id, name, equipment, muscleGroup, defaultSets, defaultReps, defaultWeight, notes });

export const SEED_EXERCISES: SeedExercise[] = [
  // Petto
  ex('croci-alto', 'Croci panca inclinata (su)', 'Manubri', 'Petto', 3, 10, 5),
  ex('croci-centro', 'Croci panca piana (centrali)', 'Manubri', 'Petto', 3, 10, 7.5),
  ex('croci-basso', 'Croci panca declinata (sotto)', 'Manubri', 'Petto', 3, 10, 5),
  // Dorsali (kg di stretta/media da verificare: 35 o 40 a seconda di verticale/orizzontale)
  ex('dorsali-larga', 'Presa larga', 'Macchina', 'Dorsali', 3, 10, 45),
  ex('dorsali-media', 'Presa media', 'Macchina', 'Dorsali', 3, 10, 40),
  ex('dorsali-stretta', 'Presa stretta', 'Macchina', 'Dorsali', 3, 10, 35),
  // Spalle (ripetizioni non indicate: assunte 3×10)
  ex('lento-avanti', 'Lento avanti', 'Manubri', 'Spalle', 3, 10, 10),
  ex('alzate-laterali', 'Alzate laterali', 'Manubri', 'Spalle', 3, 10, 8),
  ex('croci-posteriori', 'Croci posteriori', 'Manubri', 'Spalle', 3, 10, 6, 'Superserie con le alzate frontali'),
  ex('alzate-frontali', 'Alzate frontali', 'Manubri', 'Spalle', 3, 10, 6, 'Superserie con le croci posteriori'),
  // Braccia (opzionali, se avanza tempo)
  ex('bicipiti', 'Curl bicipiti', 'Manubri', 'Bicipiti', 3, 10, 10),
  ex('tricipiti', 'Tricipiti', 'Cavo/Manubri', 'Tricipiti', 3, 10, 15),
  // Addominali e core (ogni volta)
  ex('addominali', 'Addominali', 'Corpo libero', 'Addominali', 3, 15, 0),
  ex('rotazioni-bastone', 'Rotazioni busto con bastone', 'Bastone', 'Addominali', 1, 20, 0),
  ex('flessioni-bastone', 'Flessioni laterali con bastone', 'Bastone', 'Addominali', 1, 20, 0),
];

// Un id seguito da '+' è accoppiato in superserie con l'esercizio successivo.
const items = (...ids: string[]): PlanItem[] =>
  ids.map((id) => (id.endsWith('+') ? { exerciseId: id.slice(0, -1), superset: true } : { exerciseId: id }));
const FINALE = ['addominali', 'rotazioni-bastone', 'flessioni-bastone'];

export const SEED_PLANS: Plan[] = [
  { id: 'plan-petto', order: 1, name: 'Petto', items: items('croci-alto', 'croci-centro', 'croci-basso', 'tricipiti', 'bicipiti', ...FINALE) },
  { id: 'plan-dorsali', order: 2, name: 'Dorsali', items: items('dorsali-larga', 'dorsali-media', 'dorsali-stretta', 'tricipiti', 'bicipiti', ...FINALE) },
  { id: 'plan-spalle', order: 3, name: 'Spalle', items: items('lento-avanti', 'alzate-laterali', 'croci-posteriori+', 'alzate-frontali', 'bicipiti', 'tricipiti', ...FINALE) },
  // Gambe e glutei: da aggiungere quando mi descrivi gli esercizi.
];

/** Incrementa quando cambi il seed: all'avvio le schede di seed vengono riapplicate. */
export const SEED_REV = 2;

/** Recupero tra le serie preferito (secondi). */
export const SEED_REST_SECONDS = 120;
