import type { LoggedSet } from '../db/schema';
import { Stepper } from './Stepper';

/** Stepper grandi per ripetizioni e kg di una serie. */
export function SetEditor({ set, onChange }: { set: LoggedSet; onChange: (s: LoggedSet) => void }) {
  return (
    <div class="set-editor">
      <div class="set-editor-row"><span class="muted">Ripetizioni</span>
        <Stepper value={set.reps} min={0} onChange={(reps) => onChange({ ...set, reps })} /></div>
      <div class="set-editor-row"><span class="muted">Peso</span>
        <Stepper value={set.weight} step={0.5} unit="kg" onChange={(weight) => onChange({ ...set, weight })} /></div>
    </div>
  );
}
