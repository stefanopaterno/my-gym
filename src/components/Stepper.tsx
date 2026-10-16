interface Props { value: number; step?: number; min?: number; max?: number; unit?: string; onChange: (v: number) => void }

const round = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) => String(n).replace('.', ',');

export function Stepper({ value, step = 1, min = 0, max = 9999, unit, onChange }: Props) {
  const set = (v: number) => onChange(round(Math.min(max, Math.max(min, v))));
  return (
    <div class="stepper">
      <button type="button" class="btn" aria-label="Meno" onClick={() => set(value - step)}>−</button>
      <div class="val">{fmt(value)}{unit && <span class="muted"> {unit}</span>}</div>
      <button type="button" class="btn" aria-label="Più" onClick={() => set(value + step)}>+</button>
    </div>
  );
}
