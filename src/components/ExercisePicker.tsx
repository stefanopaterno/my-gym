import { useEffect, useState } from 'preact/hooks';
import type { Exercise } from '../db/schema';
import { listExercises } from '../db/repo';
import { ExerciseImage } from './ImageThumb';

/** Foglio a scorrimento per scegliere un esercizio dalla libreria. */
export function ExercisePicker({ onPick, onClose, hideIds = [] }: { onPick: (e: Exercise) => void; onClose: () => void; hideIds?: string[] }) {
  const [all, setAll] = useState<Exercise[]>([]);
  const [q, setQ] = useState('');
  useEffect(() => { listExercises().then(setAll); }, []);
  const shown = all.filter((e) => !hideIds.includes(e.id) && (e.name + e.muscleGroup).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div class="modal-bg" onClick={onClose}>
      <div class="modal" style={{ maxHeight: '85dvh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <div class="row" style={{ marginBottom: 10 }}>
          <h2 class="grow" style={{ margin: 0 }}>Aggiungi esercizio</h2>
          <button class="btn" onClick={onClose}>Chiudi</button>
        </div>
        <input class="input" type="search" placeholder="Cerca…" value={q} onInput={(e) => setQ(e.currentTarget.value)} style={{ marginBottom: 10 }} />
        <div style={{ overflowY: 'auto' }}>
          {shown.length === 0 && <div class="empty">Nessun esercizio.</div>}
          {shown.map((e) => (
            <div key={e.id} class="list-item" onClick={() => onPick(e)}>
              <ExerciseImage ex={e} />
              <div class="grow"><div class="title">{e.name}</div><div class="muted">{e.muscleGroup}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
