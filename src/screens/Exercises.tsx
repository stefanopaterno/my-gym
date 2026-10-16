import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '../db/schema';
import { deleteExercise, getExercise, listExercises, newExercise, saveExercise } from '../db/repo';
import { ExerciseImage } from '../components/ImageThumb';
import { IconBack, IconCamera, IconPlus } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Stepper } from '../components/Stepper';
import { confirmAsk } from '../components/Confirm';
import { resizeImage } from '../lib/image';
import { back, go } from '../lib/router';

export function ExerciseList() {
  const [all, setAll] = useState<Exercise[]>();
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<MuscleGroup | ''>('');
  useEffect(() => { listExercises().then(setAll); }, []);

  const shown = useMemo(() => (all ?? []).filter((e) =>
    (!group || e.muscleGroup === group) &&
    (e.name + ' ' + e.equipment).toLowerCase().includes(q.trim().toLowerCase())), [all, q, group]);

  return (
    <div class="page">
      <div class="page-head">
        <BackButton to="" />
        <h1>Esercizi</h1>
        <button class="btn primary icon" aria-label="Nuovo esercizio" onClick={() => go('esercizi/nuovo')}><IconPlus /></button>
      </div>
      <input class="input" type="search" placeholder="Cerca esercizio…" value={q}
        onInput={(e) => setQ(e.currentTarget.value)} style={{ marginBottom: 10 }} />
      <div class="chips">
        <button class={'chip' + (group === '' ? ' on' : '')} onClick={() => setGroup('')}>Tutti</button>
        {MUSCLE_GROUPS.map((g) => (
          <button key={g} class={'chip' + (group === g ? ' on' : '')} onClick={() => setGroup(g)}>{g}</button>
        ))}
      </div>
      {all && shown.length === 0 && (
        <div class="empty">{all.length === 0 ? 'Nessun esercizio. Aggiungine uno con + o carica i dati iniziali da Impostazioni.' : 'Nessun risultato.'}</div>
      )}
      {shown.map((e) => (
        <a key={e.id} class="list-item" href={`#/esercizi/${e.id}`}>
          <ExerciseImage ex={e} />
          <div class="grow">
            <div class="title">{e.name}</div>
            <div class="muted">{e.muscleGroup}{e.equipment && ` · ${e.equipment}`}</div>
          </div>
          <div class="muted">{e.defaultSets}×{e.defaultReps} · {String(e.defaultWeight).replace('.', ',')} kg</div>
        </a>
      ))}
    </div>
  );
}

export function ExerciseEdit({ id }: { id: string }) {
  const isNew = id === 'nuovo';
  const [ex, setEx] = useState<Exercise>();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) setEx(newExercise());
    else getExercise(id).then((e) => (e ? setEx(e) : go('esercizi')));
  }, [id]);

  if (!ex) return null;
  const patch = (p: Partial<Exercise>) => setEx({ ...ex, ...p });

  const onFile = async (e: Event) => {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (file) patch({ image: await resizeImage(file) });
  };
  const save = async () => {
    if (!ex.name.trim()) return;
    await saveExercise({ ...ex, name: ex.name.trim() });
    back();
  };
  const remove = async () => {
    if (await confirmAsk(`Eliminare "${ex.name}"?`, 'Resterà nello storico delle sessioni passate.')) {
      await deleteExercise(ex.id);
      back();
    }
  };

  return (
    <div class="page">
      <div class="page-head">
        <button class="btn icon" aria-label="Indietro" onClick={back}><IconBack /></button>
        <h1>{isNew ? 'Nuovo esercizio' : 'Esercizio'}</h1>
      </div>

      <div class="row" style={{ marginBottom: 16 }}>
        <ExerciseImage ex={ex} size={96} />
        <div class="grow" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button class="btn" onClick={() => fileRef.current?.click()}><IconCamera /> Foto</button>
          {ex.image && <button class="btn danger" onClick={() => patch({ image: undefined })}>Rimuovi foto</button>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
      </div>

      <label class="field"><span>Nome</span>
        <input class="input" value={ex.name} onInput={(e) => patch({ name: e.currentTarget.value })} /></label>
      <label class="field"><span>Attrezzo / macchina</span>
        <input class="input" value={ex.equipment} onInput={(e) => patch({ equipment: e.currentTarget.value })} /></label>
      <label class="field"><span>Gruppo muscolare</span>
        <select class="input" value={ex.muscleGroup} onChange={(e) => patch({ muscleGroup: e.currentTarget.value as MuscleGroup })}>
          {MUSCLE_GROUPS.map((g) => <option key={g}>{g}</option>)}
        </select></label>

      <div class="card">
        <div class="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <span>Serie</span><Stepper value={ex.defaultSets} min={1} onChange={(v) => patch({ defaultSets: v })} />
        </div>
        <div class="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <span>Ripetizioni</span><Stepper value={ex.defaultReps} min={1} onChange={(v) => patch({ defaultReps: v })} />
        </div>
        <div class="row" style={{ justifyContent: 'space-between' }}>
          <span>Peso</span><Stepper value={ex.defaultWeight} step={0.5} unit="kg" onChange={(v) => patch({ defaultWeight: v })} />
        </div>
      </div>

      <label class="field"><span>Note</span>
        <textarea class="input" value={ex.notes} onInput={(e) => patch({ notes: e.currentTarget.value })} /></label>

      <button class="btn primary big" style={{ minHeight: 56, fontSize: 18 }} disabled={!ex.name.trim()} onClick={save}>Salva</button>
      {!isNew && <a class="btn" href={`#/progressi/${ex.id}`} style={{ width: '100%', marginTop: 10 }}>Vedi progressi e record</a>}
      {!isNew && <button class="btn danger" style={{ width: '100%', marginTop: 10 }} onClick={remove}>Elimina esercizio</button>}
    </div>
  );
}
