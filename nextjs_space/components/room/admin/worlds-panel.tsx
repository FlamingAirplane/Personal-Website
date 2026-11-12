'use client';

import { useRef, useState } from 'react';
import { BUILTIN_WORLD_IDS, DEFAULT_IMAGE_SPEC, type RoomConfig, type WorldOverride } from '@/lib/room/config';
import { ENVIRONMENTS } from '@/lib/room/environments';
import { chooseableWorlds } from '@/lib/room/worlds';
import { useAdmin } from './admin-context';
import {
  AssetField,
  BoolField,
  buttonClass,
  Group,
  ImageSpecField,
  NumberField,
  SelectField,
  TextField,
} from './controls';

interface Props {
  config: RoomConfig;
  update: (fn: (c: RoomConfig) => RoomConfig) => void;
}

function patchBuiltIn(c: RoomConfig, id: string, patch: Partial<WorldOverride>): RoomConfig {
  const next: Record<string, unknown> = { ...(c.worlds.overrides[id] ?? {}), ...patch };
  for (const key of Object.keys(next)) if (next[key] === undefined) delete next[key];
  return { ...c, worlds: { ...c.worlds, overrides: { ...c.worlds.overrides, [id]: next as WorldOverride } } };
}

/** The places the walls can show: the built-in ones and your own. */
export function WorldsPanel({ config, update }: Props) {
  const admin = useAdmin();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const choices = chooseableWorlds(config).map((w): [string, string] => [w.id, w.label]);

  const addPlace = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    try {
      const src = await admin.importFile(file, 'image');
      update((c) => {
        let n = c.worlds.custom.length + 1;
        while (c.worlds.custom.some((w) => w.id === `place-${n}`)) n++;
        const id = `place-${n}`;
        return {
          ...c,
          worlds: {
            ...c.worlds,
            custom: [
              ...c.worlds.custom,
              {
                id,
                label: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'My place',
                light: 3,
                followsClock: false,
                image: { ...DEFAULT_IMAGE_SPEC, src },
                ceilingImage: '',
              },
            ],
          },
        };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not import that picture.');
    } finally {
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div>
      <Group
        title="Which place when"
        intro="What the walls show with the lights on before anything has been looked at, and with the lights off."
      >
        <SelectField
          label="Lights on, nothing inspected"
          value={config.worlds.defaultWorld}
          options={choices}
          onChange={(defaultWorld) => update((c) => ({ ...c, worlds: { ...c.worlds, defaultWorld } }))}
        />
        <SelectField
          label="Lights off"
          value={config.worlds.darkWorld}
          options={choices}
          onChange={(darkWorld) => update((c) => ({ ...c, worlds: { ...c.worlds, darkWorld } }))}
        />
      </Group>

      <Group
        title="Your places"
        intro="Each place is one picture on the walls. Import a wide panorama, or any photo and set it to repeat. You can then choose it for any item."
      >
        {config.worlds.custom.map((w) => (
          <Group key={w.id} title={w.label} open={false}>
            <TextField
              label="Name"
              value={w.label}
              onChange={(label) =>
                update((c) => ({
                  ...c,
                  worlds: { ...c.worlds, custom: c.worlds.custom.map((x) => (x.id === w.id ? { ...x, label } : x)) },
                }))
              }
            />
            <ImageSpecField
              label="Picture"
              value={w.image}
              onChange={(image) =>
                image &&
                update((c) => ({
                  ...c,
                  worlds: { ...c.worlds, custom: c.worlds.custom.map((x) => (x.id === w.id ? { ...x, image } : x)) },
                }))
              }
            />
            <AssetField
              label="Ceiling picture (optional)"
              kind="image"
              value={w.ceilingImage}
              help="Left empty, the ceiling carries on the colours from the top of the walls."
              onChange={(ceilingImage) =>
                update((c) => ({
                  ...c,
                  worlds: { ...c.worlds, custom: c.worlds.custom.map((x) => (x.id === w.id ? { ...x, ceilingImage } : x)) },
                }))
              }
            />
            <NumberField
              label="How brightly it lights the room"
              value={w.light}
              min={0}
              max={12}
              step={0.1}
              onChange={(light) =>
                update((c) => ({
                  ...c,
                  worlds: { ...c.worlds, custom: c.worlds.custom.map((x) => (x.id === w.id ? { ...x, light } : x)) },
                }))
              }
            />
            <BoolField
              label="Follows the clock (dimmer at night)"
              value={w.followsClock}
              onChange={(followsClock) =>
                update((c) => ({
                  ...c,
                  worlds: { ...c.worlds, custom: c.worlds.custom.map((x) => (x.id === w.id ? { ...x, followsClock } : x)) },
                }))
              }
            />
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                if (!window.confirm(`Delete the place “${w.label}”?`)) return;
                update((c) => ({
                  ...c,
                  worlds: {
                    ...c.worlds,
                    custom: c.worlds.custom.filter((x) => x.id !== w.id),
                    defaultWorld: c.worlds.defaultWorld === w.id ? 'forest' : c.worlds.defaultWorld,
                    darkWorld: c.worlds.darkWorld === w.id ? 'nebula' : c.worlds.darkWorld,
                  },
                }));
              }}
            >
              Delete this place
            </button>
          </Group>
        ))}
        <button type="button" className={buttonClass} onClick={() => input.current?.click()}>
          Add a place from a picture…
        </button>
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => addPlace(e.target.files?.[0])} />
        {error && <p className="mt-1 text-xs text-[#f07a5a]">{error}</p>}
      </Group>

      <Group title="Built-in places" open={false} intro="Rename them, change their brightness, or swap in your own picture.">
        {BUILTIN_WORLD_IDS.map((id) => {
          const env = ENVIRONMENTS[id];
          const over = config.worlds.overrides[id] ?? {};
          const set = (patch: Partial<WorldOverride>) => update((c) => patchBuiltIn(c, id, patch));
          return (
            <Group key={id} title={over.label || env.label} open={false}>
              <TextField label="Name" value={over.label ?? ''} placeholder={env.label} onChange={(label) => set({ label })} />
              <ImageSpecField
                label={env.image ? 'Replace the picture' : 'Add a picture'}
                value={over.image ?? null}
                onChange={(image) => set({ image: image ?? undefined })}
              />
              <AssetField
                label="Ceiling picture (optional)"
                kind="image"
                value={over.ceilingImage ?? ''}
                onChange={(ceilingImage) => set({ ceilingImage: ceilingImage || undefined })}
              />
              <NumberField
                label="How brightly it lights the room"
                value={over.light ?? env.light}
                min={0}
                max={12}
                step={0.1}
                onChange={(light) => set({ light })}
              />
              <BoolField
                label="Follows the clock (dimmer at night)"
                value={over.followsClock ?? env.followsClock}
                onChange={(followsClock) => set({ followsClock })}
              />
              <button
                type="button"
                className={buttonClass}
                onClick={() =>
                  update((c) => {
                    const overrides = { ...c.worlds.overrides };
                    delete overrides[id];
                    return { ...c, worlds: { ...c.worlds, overrides } };
                  })
                }
              >
                Reset this place
              </button>
            </Group>
          );
        })}
      </Group>
    </div>
  );
}
