import { useEffect, useState } from 'preact/hooks';
import type { Exercise } from '../db/schema';
import { MuscleIcon } from './Icons';

/** Foto dell'esercizio (Blob) oppure icona generica del gruppo muscolare. */
export function ExerciseImage({ ex, size = 52, large = false }: { ex: Exercise; size?: number; large?: boolean }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!ex.image) return setUrl(undefined);
    const u = URL.createObjectURL(ex.image);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [ex.image]);
  if (!url) return <MuscleIcon group={ex.muscleGroup} size={large ? 120 : size} />;
  return <img class={large ? 'thumb lg' : 'thumb'} style={large ? undefined : { width: size, height: size }} src={url} alt={ex.name} />;
}
