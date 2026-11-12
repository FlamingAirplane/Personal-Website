'use client';

import {
  DEFAULT_CARD,
  DEFAULT_MODEL,
  effectiveHotspot,
  effectiveObject,
  type ExtraCfg,
  type RoomConfig,
} from '@/lib/room/config';
import { patchCard, patchExtra, patchHotspot, patchObject, removeExtra, resetObject } from '@/lib/room/config-edit';
import { OBJECTS } from '@/lib/room/room-data';
import { chooseableWorlds } from '@/lib/room/worlds';
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
  id: string;
  update: (fn: (c: RoomConfig) => RoomConfig) => void;
  onVisit: (id: string) => void;
  onDeleted: () => void;
}

/** Everything you can change about one item in the room. */
export function ItemEditor({ config, id, update, onVisit, onDeleted }: Props) {
  const def = OBJECTS.find((o) => o.id === id);
  const extra = config.extras.find((e) => e.id === id);
  if (!def && !extra) return <p className="p-3 text-xs text-[#8a9a70]">That item no longer exists.</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 py-2">
        <h3 className="text-sm font-bold text-[#f3f7e4]">{extra?.label ?? def?.label}</h3>
        <div className="flex gap-2">
          <button type="button" className={buttonClass} onClick={() => onVisit(id)}>
            Walk there
          </button>
          {extra ? (
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                if (window.confirm(`Delete “${extra.label}”?`)) {
                  update((c) => removeExtra(c, id));
                  onDeleted();
                }
              }}
            >
              Delete
            </button>
          ) : (
            <button type="button" className={buttonClass} onClick={() => update((c) => resetObject(c, id))}>
              Reset all
            </button>
          )}
        </div>
      </div>

      {extra ? <ExtraPlacement config={config} extra={extra} update={update} /> : <BuiltInPlacement config={config} id={id} update={update} />}
      <Interaction config={config} id={id} update={update} />
    </div>
  );
}

/* ------------------------------ built-in objects ------------------------------ */

function BuiltInPlacement({ config, id, update }: Pick<Props, 'config' | 'id' | 'update'>) {
  const oc = effectiveObject(config, id);
  const set = (patch: Parameters<typeof patchObject>[2]) => update((c) => patchObject(c, id, patch));
  const model = oc.model;
  const setModel = (patch: Partial<typeof DEFAULT_MODEL>) =>
    set({ model: { ...DEFAULT_MODEL, ...(model ?? {}), ...patch } });

  return (
    <>
      <Group title="Placement">
        <BoolField label="Show it" value={oc.visible} onChange={(visible) => set({ visible })} />
        <NumberField label="Move east (+) or west (−)" value={oc.x} min={-8} max={8} step={0.05} unit="m" onChange={(x) => set({ x })} />
        <NumberField label="Move up" value={oc.y} min={-2} max={4} step={0.05} unit="m" onChange={(y) => set({ y })} />
        <NumberField label="Move south (+) or north (−)" value={oc.z} min={-8} max={8} step={0.05} unit="m" onChange={(z) => set({ z })} />
        <NumberField label="Turn" value={oc.rotY} min={-180} max={180} step={5} unit="°" onChange={(rotY) => set({ rotY })} />
        <NumberField label="Size" value={oc.scale} min={0.2} max={4} step={0.05} unit="×" onChange={(scale) => set({ scale })} />
      </Group>

      <Group
        title="Your own 3D model"
        open={Boolean(model)}
        intro="Replace this object with a .glb model, or show a model alongside it. The model stands on the object's spot."
      >
        <AssetField
          label="Model (.glb)"
          kind="model"
          value={model?.src ?? ''}
          onChange={(src) => set({ model: src ? { ...DEFAULT_MODEL, ...(model ?? {}), src } : undefined })}
        />
        {model && (
          <>
            <BoolField
              label="Hide the built-in object"
              value={model.hideBuiltIn}
              onChange={(hideBuiltIn) => setModel({ hideBuiltIn })}
            />
            <NumberField
              label="Height"
              value={model.fitHeight}
              min={0}
              max={6}
              step={0.05}
              unit="m"
              help="0 keeps the model's own size, which is often far too big or small."
              onChange={(fitHeight) => setModel({ fitHeight })}
            />
            <NumberField label="Extra size" value={model.scale} min={0.05} max={10} step={0.05} unit="×" onChange={(scale) => setModel({ scale })} />
            <NumberField label="Shift east (+) or west (−)" value={model.x} min={-5} max={5} step={0.05} unit="m" onChange={(x) => setModel({ x })} />
            <NumberField label="Shift up" value={model.y} min={-5} max={5} step={0.05} unit="m" onChange={(y) => setModel({ y })} />
            <NumberField label="Shift south (+) or north (−)" value={model.z} min={-5} max={5} step={0.05} unit="m" onChange={(z) => setModel({ z })} />
            <NumberField label="Turn" value={model.rotY} min={-180} max={180} step={5} unit="°" onChange={(rotY) => setModel({ rotY })} />
          </>
        )}
      </Group>
    </>
  );
}

/* ------------------------------ things you added ------------------------------ */

function ExtraPlacement({ config, extra, update }: { config: RoomConfig; extra: ExtraCfg; update: Props['update'] }) {
  const set = (patch: Partial<ExtraCfg>) => update((c) => patchExtra(c, extra.id, patch));
  const w = config.room.width / 2;
  const d = config.room.depth / 2;
  return (
    <Group title={extra.kind === 'image' ? 'Picture' : 'Model'}>
      <TextField label="Name" value={extra.label} onChange={(label) => set({ label })} />
      <AssetField
        label={extra.kind === 'image' ? 'Picture' : 'Model (.glb)'}
        kind={extra.kind}
        value={extra.src}
        onChange={(src) => src && set({ src })}
      />
      <BoolField label="Show it" value={extra.visible} onChange={(visible) => set({ visible })} />
      <NumberField label="Position: east (+) or west (−)" value={extra.x} min={-w} max={w} step={0.05} unit="m" onChange={(x) => set({ x })} />
      <NumberField
        label={extra.kind === 'image' ? 'Position: height of its centre' : 'Position: height of its base'}
        value={extra.y}
        min={-1}
        max={config.room.height}
        step={0.05}
        unit="m"
        onChange={(y) => set({ y })}
      />
      <NumberField label="Position: south (+) or north (−)" value={extra.z} min={-d} max={d} step={0.05} unit="m" onChange={(z) => set({ z })} />
      <NumberField
        label="Turn"
        value={extra.rotY}
        min={-180}
        max={180}
        step={5}
        unit="°"
        help={extra.kind === 'image' ? '0 faces south, towards the north wall. Use 180 on the south wall, 90 or −90 on the side walls.' : undefined}
        onChange={(rotY) => set({ rotY })}
      />
      {extra.kind === 'image' ? (
        <NumberField label="Width" value={extra.width} min={0.1} max={8} step={0.05} unit="m" onChange={(width) => set({ width })} />
      ) : (
        <NumberField
          label="Height"
          value={extra.fitHeight}
          min={0}
          max={6}
          step={0.05}
          unit="m"
          help="0 keeps the model's own size."
          onChange={(fitHeight) => set({ fitHeight })}
        />
      )}
      <NumberField label="Extra size" value={extra.scale} min={0.05} max={10} step={0.05} unit="×" onChange={(scale) => set({ scale })} />
      <BoolField label="Walk around it (instead of through it)" value={extra.solid} onChange={(solid) => set({ solid })} />
    </Group>
  );
}

/* ------------------------------ looking at it ------------------------------ */

function Interaction({ config, id, update }: Pick<Props, 'config' | 'id' | 'update'>) {
  const def = OBJECTS.find((o) => o.id === id);
  const hc = effectiveHotspot(config, id);
  const set = (patch: Parameters<typeof patchHotspot>[2]) => update((c) => patchHotspot(c, id, patch));
  const interactiveByDefault = def ? def.hotspot !== undefined : true;
  const interactive = config.hotspots[id]?.interactive ?? interactiveByDefault;
  const card = hc.card ?? DEFAULT_CARD;
  const setCard = (patch: Partial<typeof DEFAULT_CARD>) => update((c) => patchCard(c, id, patch));

  const worldOptions: [string, string][] = [
    ['', def?.hotspot?.world ? `Built-in (${def.hotspot.world})` : 'Leave the walls as they are'],
    ...chooseableWorlds(config).map((w): [string, string] => [w.id, w.label]),
  ];
  const action = def?.hotspot?.action;
  const isSpecial = action?.type === 'toggle-light' || action?.type === 'exit';

  return (
    <Group
      title="When you look at it"
      intro="What happens when a visitor clicks it: they walk up, the walls can change place, and a line of text or a card appears."
    >
      <BoolField
        label="Can be clicked"
        value={interactive}
        onChange={(v) => set({ interactive: v === interactiveByDefault ? undefined : v })}
      />
      {interactive && (
        <>
          <TextField label="Name shown on hover" value={hc.label} placeholder={def?.label} onChange={(label) => set({ label })} />
          {!isSpecial && (
            <>
              <TextField
                label="Line of text on arrival"
                value={hc.line}
                placeholder={action?.type === 'inspect' ? action.line : 'Shown at the bottom of the screen'}
                multiline
                onChange={(line) => set({ line })}
              />
              <SelectField label="Place shown on the walls" value={hc.world} options={worldOptions} onChange={(world) => set({ world })} />
              <Group title="Your own background picture" open={Boolean(hc.background)}>
                <ImageSpecField
                  label="Picture for the walls while you look at this"
                  value={hc.background}
                  onChange={(background) => set({ background: background ?? undefined })}
                />
              </Group>
              <Group title="Card" open={Boolean(hc.card)} intro="A small panel with a title, text, picture and link.">
                <TextField label="Title" value={card.title} onChange={(title) => setCard({ title })} />
                <TextField label="Text" value={card.text} multiline onChange={(text) => setCard({ text })} />
                <AssetField label="Picture" kind="image" value={card.image} onChange={(image) => setCard({ image })} />
                <TextField label="Link address" value={card.link} placeholder="https://…" onChange={(link) => setCard({ link })} />
                <TextField label="Link button says" value={card.linkLabel} onChange={(linkLabel) => setCard({ linkLabel })} />
                {hc.card && (
                  <button type="button" className={buttonClass} onClick={() => set({ card: undefined })}>
                    Remove the card
                  </button>
                )}
              </Group>
            </>
          )}
          <NumberField
            label="How far away you stand"
            value={hc.standDistance}
            min={0}
            max={6}
            step={0.1}
            unit="m"
            help="0 picks a distance to suit its size."
            onChange={(standDistance) => set({ standDistance })}
          />
        </>
      )}
    </Group>
  );
}
