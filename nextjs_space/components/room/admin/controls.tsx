'use client';

import { useRef, useState, type ReactNode } from 'react';
import { DRAFT_PREFIX, type AssetKind } from '@/lib/room/assets';
import { DEFAULT_IMAGE_SPEC, type ImageSpec } from '@/lib/room/config';
import type { Field } from '@/lib/room/config-schema';
import { useAdmin } from './admin-context';

export const inputClass =
  'w-full border border-[#2e3a1c] bg-[#1a2e38] px-2 py-1 text-sm text-[#f3f7e4] outline-none focus:border-[#94a348]';
export const buttonClass =
  'border border-[#2e3a1c] px-3 py-1.5 text-xs uppercase tracking-wider text-[#c8d4a8] transition-colors hover:border-[#94a348] hover:text-[#f3f7e4] disabled:opacity-40 disabled:hover:border-[#2e3a1c]';
export const primaryButtonClass =
  'border border-[#94a348] bg-[#94a348] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0a0c04] transition-colors hover:bg-[#c8d4a8] disabled:opacity-40';

const roundTo = (n: number, step: number) => {
  const digits = Math.min(4, Math.max(0, Math.ceil(-Math.log10(step || 1)) + 1));
  return Number(n.toFixed(digits));
};

/** A collapsible group of controls. */
export function Group({
  title,
  children,
  open = true,
  intro,
}: {
  title: string;
  children: ReactNode;
  open?: boolean;
  intro?: string;
}) {
  return (
    <details open={open} className="border-b border-[#1a1e10] py-2">
      <summary className="cursor-pointer select-none py-1 text-xs font-bold uppercase tracking-widest text-[#94a348]">
        {title}
      </summary>
      {intro && <p className="pb-2 text-xs leading-relaxed text-[#8a9a70]">{intro}</p>}
      <div className="pb-2">{children}</div>
    </details>
  );
}

export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  help,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  help?: string;
  onChange: (v: number) => void;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-[#c8d4a8]">{label}</span>
        <span className="flex shrink-0 items-center gap-1">
          <input
            type="number"
            aria-label={label}
            value={roundTo(value, step)}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const n = parseFloat(e.target.value);
              if (Number.isFinite(n)) onChange(clamp(n));
            }}
            className="w-20 border border-[#2e3a1c] bg-[#1a2e38] px-1.5 py-0.5 text-right text-xs text-[#f3f7e4] outline-none focus:border-[#94a348]"
          />
          {unit && <span className="w-8 text-xs text-[#8a9a70]">{unit}</span>}
        </span>
      </div>
      <input
        type="range"
        aria-label={`${label} slider`}
        value={Math.min(max, Math.max(min, value))}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(clamp(parseFloat(e.target.value)))}
        className="mt-1 w-full accent-[#94a348]"
      />
      {help && <p className="mt-0.5 text-xs text-[#8a9a70]">{help}</p>}
    </div>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-[#c8d4a8]">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="text"
          aria-label={`${label} (hex)`}
          maxLength={7}
          onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && onChange(e.target.value.toLowerCase())}
          onBlur={(e) => (e.target.value = value)}
          className="w-20 border border-[#2e3a1c] bg-[#1a2e38] px-1.5 py-0.5 font-mono text-xs text-[#f3f7e4] outline-none focus:border-[#94a348]"
          key={value}
          defaultValue={value}
        />
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="h-7 w-9 cursor-pointer border border-[#2e3a1c] bg-transparent p-0"
        />
      </span>
    </div>
  );
}

export function TextField({
  label,
  value,
  placeholder,
  onChange,
  multiline,
  help,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  help?: string;
}) {
  return (
    <label className="block py-1.5">
      <span className="text-xs text-[#c8d4a8]">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          placeholder={placeholder}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} mt-1 resize-y`}
        />
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} mt-1`}
        />
      )}
      {help && <span className="mt-0.5 block text-xs text-[#8a9a70]">{help}</span>}
    </label>
  );
}

export function BoolField({
  label,
  value,
  help,
  onChange,
}: {
  label: string;
  value: boolean;
  help?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 py-1.5">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[#94a348]"
      />
      <span>
        <span className="text-xs text-[#c8d4a8]">{label}</span>
        {help && <span className="block text-xs text-[#8a9a70]">{help}</span>}
      </span>
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  help,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  help?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block py-1.5">
      <span className="text-xs text-[#c8d4a8]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} mt-1`}>
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
      {help && <span className="mt-0.5 block text-xs text-[#8a9a70]">{help}</span>}
    </label>
  );
}

/** Draws the right control for a setting described in config-schema.ts. */
export function SchemaField({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  switch (field.kind) {
    case 'number':
      return (
        <NumberField
          label={field.label}
          value={typeof value === 'number' ? value : 0}
          min={field.min ?? 0}
          max={field.max ?? 100}
          step={field.step}
          unit={field.unit}
          help={field.help}
          onChange={onChange}
        />
      );
    case 'color':
      return <ColorField label={field.label} value={String(value ?? '#000000')} onChange={onChange} />;
    case 'bool':
      return <BoolField label={field.label} value={Boolean(value)} help={field.help} onChange={onChange} />;
    case 'select':
      return (
        <SelectField
          label={field.label}
          value={String(value ?? '')}
          options={field.options ?? []}
          help={field.help}
          onChange={onChange}
        />
      );
    default:
      return (
        <TextField
          label={field.label}
          value={String(value ?? '')}
          multiline={field.kind === 'longtext'}
          help={field.help}
          onChange={onChange}
        />
      );
  }
}

/** The short name to show for a file reference. */
function nameOf(ref: string, names: Map<string, string>) {
  if (ref.startsWith(DRAFT_PREFIX)) return names.get(ref) ?? 'imported file (missing)';
  return ref.split('/').pop() ?? ref;
}

/** Pick, import or clear a picture or model. */
export function AssetField({
  label,
  value,
  kind,
  onChange,
  help,
}: {
  label: string;
  value: string;
  kind: AssetKind;
  onChange: (ref: string) => void;
  help?: string;
}) {
  const admin = useAdmin();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const url = admin.resolve(value);
  const names = new Map(admin.assets.map((a) => [DRAFT_PREFIX + a.id, a.name]));
  const choices = admin.assets.filter((a) => a.kind === kind);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange(await admin.importFile(file, kind));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not import that file.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="py-1.5">
      <span className="text-xs text-[#c8d4a8]">{label}</span>
      <div className="mt-1 flex items-center gap-3">
        {kind === 'image' && value && url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-14 w-20 shrink-0 border border-[#2e3a1c] object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-[#8a9a70]">{value ? nameOf(value, names) : 'Nothing chosen'}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <button type="button" className={buttonClass} disabled={busy} onClick={() => input.current?.click()}>
              {busy ? 'Importing…' : kind === 'image' ? 'Import picture…' : 'Import model…'}
            </button>
            {value && (
              <button type="button" className={buttonClass} onClick={() => onChange('')}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
      {choices.length > 0 && (
        <select
          aria-label={`${label}: use a file imported earlier`}
          value=""
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className={`${inputClass} mt-2`}
        >
          <option value="">Use a file imported earlier…</option>
          {choices.map((a) => (
            <option key={a.id} value={DRAFT_PREFIX + a.id}>
              {a.name}
            </option>
          ))}
        </select>
      )}
      <input
        ref={input}
        type="file"
        hidden
        accept={kind === 'image' ? 'image/*' : '.glb,model/gltf-binary'}
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {error && <p className="mt-1 text-xs text-[#f07a5a]">{error}</p>}
      {help && <p className="mt-1 text-xs text-[#8a9a70]">{help}</p>}
    </div>
  );
}

/** A picture for the wall screens, with how to lay it on them. */
export function ImageSpecField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ImageSpec | null;
  onChange: (spec: ImageSpec | null) => void;
}) {
  const spec = value ?? DEFAULT_IMAGE_SPEC;
  const set = (patch: Partial<ImageSpec>) => onChange({ ...spec, ...patch });
  return (
    <div>
      <AssetField
        label={label}
        kind="image"
        value={spec.src}
        onChange={(src) => (src ? set({ src }) : onChange(null))}
        help="A wide picture works best: it wraps round all four walls."
      />
      {spec.src && (
        <div className="ml-1 border-l border-[#2e3a1c] pl-3">
          <NumberField
            label="Times it repeats around the room"
            value={spec.repeat}
            min={1}
            max={12}
            step={1}
            help="Use 4 to show a normal photo once on each wall."
            onChange={(repeat) => set({ repeat })}
          />
          <SelectField
            label="Fit"
            value={spec.fit}
            options={[
              ['cover', 'Fill the wall (crops the picture)'],
              ['stretch', 'Show all of it (squashes it)'],
            ]}
            onChange={(fit) => set({ fit: fit as ImageSpec['fit'] })}
          />
          {spec.fit === 'cover' && (
            <NumberField
              label="Which part stays in view"
              value={spec.focusY}
              min={0}
              max={1}
              step={0.05}
              help="0 keeps the top of the picture, 1 the bottom."
              onChange={(focusY) => set({ focusY })}
            />
          )}
        </div>
      )}
    </div>
  );
}
