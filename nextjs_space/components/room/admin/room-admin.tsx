'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addAsset,
  deleteAsset,
  kindOf,
  listAssets,
  loadDraftUrls,
  makeResolver,
  type AssetKind,
  type StoredAsset,
} from '@/lib/room/assets';
import { collectRefs, DEFAULT_CONFIG, getAt, resolveConfig, setAt, type RoomConfig } from '@/lib/room/config';
import { addExtra } from '@/lib/room/config-edit';
import { SCHEMA_TABS } from '@/lib/room/config-schema';
import { clearDraft, loadDraft, saveDraft } from '@/lib/room/draft';
import { buildBundle, download, type Bundle } from '@/lib/room/export-bundle';
import { OBJECTS } from '@/lib/room/room-data';
import { withBase } from '@/lib/site';
import { RoomCanvas, type EditorHooks } from '../room-canvas';
import { AdminContext, type AdminCtx } from './admin-context';
import { buttonClass, ColorField, Group, primaryButtonClass, SchemaField } from './controls';
import { FilesPanel } from './files-panel';
import { ItemEditor } from './item-editor';
import { WorldsPanel } from './worlds-panel';

const FIXED_TABS = [
  { id: 'items', title: 'Items' },
  { id: 'places', title: 'Places' },
];
const END_TABS = [
  { id: 'files', title: 'Files' },
  { id: 'publish', title: 'Publish' },
];
const ALL_TABS = [...FIXED_TABS, ...SCHEMA_TABS.map((t) => ({ id: t.id, title: t.title })), ...END_TABS];

export function RoomAdmin() {
  const [loaded, setLoaded] = useState(false);
  const [published, setPublished] = useState<RoomConfig>(DEFAULT_CONFIG);
  const [config, setConfig] = useState<RoomConfig>(DEFAULT_CONFIG);
  // The preview follows the config a moment after you stop moving a slider.
  const [preview, setPreview] = useState<RoomConfig>(DEFAULT_CONFIG);
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  const [assets, setAssets] = useState<StoredAsset[]>([]);
  const [tab, setTab] = useState('items');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visitRequest, setVisitRequest] = useState<{ id: string; n: number } | null>(null);
  const [saved, setSaved] = useState<'saving' | 'saved' | 'failed'>('saved');
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState('');
  // The latest config, for handlers that run after an await.
  const configRef = useRef(config);
  configRef.current = config;
  const importJson = useRef<HTMLInputElement>(null);
  const addPicture = useRef<HTMLInputElement>(null);
  const addModel = useRef<HTMLInputElement>(null);

  /* ---------------------------------- loading --------------------------------- */

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let pub = DEFAULT_CONFIG;
      try {
        const response = await fetch(withBase('/room/room-config.json'), { cache: 'no-cache' });
        if (response.ok) pub = resolveConfig(await response.json());
      } catch {
        /* no published settings yet */
      }
      const start = loadDraft() ?? pub;
      const [files, map] = await Promise.all([listAssets().catch(() => []), loadDraftUrls(collectRefs(start))]);
      if (cancelled) return;
      setPublished(pub);
      setConfig(start);
      setPreview(start);
      setAssets(files);
      setUrls(map);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Rebuilding the room is not free, so wait for a pause before showing a change.
  useEffect(() => {
    if (!loaded) return;
    const t = window.setTimeout(() => setPreview(config), 300);
    return () => window.clearTimeout(t);
  }, [config, loaded]);

  // Keep the draft in this browser as you go.
  useEffect(() => {
    if (!loaded) return;
    setSaved('saving');
    const t = window.setTimeout(() => setSaved(saveDraft(config) ? 'saved' : 'failed'), 500);
    return () => window.clearTimeout(t);
  }, [config, loaded]);

  const update = useCallback((fn: (c: RoomConfig) => RoomConfig) => setConfig((c) => fn(c)), []);
  const setValue = (path: string, value: unknown) => update((c) => setAt(c, path, value));

  /* ---------------------------------- files ---------------------------------- */

  const resolve = useMemo(() => makeResolver(urls), [urls]);

  const importFile = useCallback(async (file: File, expect: AssetKind) => {
    const kind = kindOf(file);
    if (kind !== expect) {
      throw new Error(expect === 'image' ? 'That is not a picture.' : 'That is not a .glb model.');
    }
    const { ref, asset } = await addAsset(file);
    setUrls((prev) => new Map(prev).set(ref, URL.createObjectURL(asset.blob)));
    setAssets((prev) => [asset, ...prev]);
    return ref;
  }, []);

  const removeAsset = useCallback(async (id: string) => {
    await deleteAsset(id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setUrls((prev) => {
      const next = new Map(prev);
      const ref = `idb:${id}`;
      const url = next.get(ref);
      if (url) URL.revokeObjectURL(url);
      next.delete(ref);
      return next;
    });
  }, []);

  const adminCtx: AdminCtx = useMemo(
    () => ({ resolve, assets, importFile, removeAsset }),
    [resolve, assets, importFile, removeAsset],
  );

  /* ---------------------------------- preview ---------------------------------- */

  const visit = useCallback((id: string) => {
    setSelectedId(id);
    setVisitRequest((r) => ({ id, n: (r?.n ?? 0) + 1 }));
  }, []);

  const editor: EditorHooks = useMemo(
    () => ({
      selectedId,
      onSelect: (id) => {
        setSelectedId(id);
        setTab('items');
      },
      visit: visitRequest,
    }),
    [selectedId, visitRequest],
  );

  /* -------------------------------- publishing -------------------------------- */

  const isDirty = JSON.stringify(config) !== JSON.stringify(published);

  const exportBundle = async () => {
    setExporting(true);
    setNotice('');
    try {
      const b = await buildBundle(config);
      setBundle(b);
      download('room-settings.zip', b.zipBytes as BlobPart, 'application/zip');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not build the bundle.');
    } finally {
      setExporting(false);
    }
  };

  const importSettings = async (file: File | undefined) => {
    if (!file) return;
    try {
      const next = resolveConfig(JSON.parse(await file.text()));
      if (window.confirm('Replace your current draft with this file?')) {
        setConfig(next);
        setPreview(next);
        setUrls(await loadDraftUrls(collectRefs(next), new Map(urls)));
        setNotice('Settings imported.');
      }
    } catch {
      setNotice('That file is not a valid settings file.');
    } finally {
      if (importJson.current) importJson.current.value = '';
    }
  };

  const resetToPublished = () => {
    if (!window.confirm('Throw away your draft and go back to what is published on the site?')) return;
    clearDraft();
    setConfig(published);
    setPreview(published);
    setSelectedId(null);
    setNotice('Back to the published settings.');
  };

  const addItem = async (file: File | undefined, kind: AssetKind) => {
    if (!file) return;
    try {
      const ref = await importFile(file, kind);
      const label = file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'New item';
      const result = addExtra(configRef.current, kind, ref, label);
      setConfig(result.config);
      setSelectedId(result.id);
      setTab('items');
      setNotice('');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not import that file.');
    } finally {
      if (addPicture.current) addPicture.current.value = '';
      if (addModel.current) addModel.current.value = '';
    }
  };

  /* ----------------------------------- views ----------------------------------- */

  const groups = useMemo(() => {
    const map = new Map<string, { id: string; label: string }[]>();
    for (const o of OBJECTS) map.set(o.group, [...(map.get(o.group) ?? []), { id: o.id, label: o.label }]);
    return [...map.entries()];
  }, []);

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0c04] font-mono text-sm uppercase tracking-widest text-[#8a9a70]">
        Loading the admin…
      </main>
    );
  }

  const schemaTab = SCHEMA_TABS.find((t) => t.id === tab);

  return (
    <AdminContext.Provider value={adminCtx}>
      <div className="grid min-h-screen grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr] bg-[#0a0c04] font-sans text-[#c8d4a8] lg:h-screen lg:grid-cols-[minmax(340px,460px)_minmax(0,1fr)] lg:grid-rows-1">
        {/* The live room. On a phone it sits above the controls. */}
        <section aria-label="Live preview" className="relative h-[46vh] min-w-0 bg-[#05060a] lg:order-2 lg:h-auto">
          <RoomCanvas config={preview} resolve={resolve} editor={editor} />
          <p className="pointer-events-none absolute left-3 top-3 z-10 bg-[#05060a]/80 px-2 py-1 font-mono text-[11px] uppercase tracking-widest text-[#8a9a70]">
            Live preview · click anything to select it
          </p>
        </section>

        <section className="flex min-h-0 min-w-0 flex-col border-[#1a1e10] bg-[#0d0f06] lg:order-1 lg:border-r">
          <header className="border-b border-[#1a1e10] px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="font-mono text-sm font-bold uppercase tracking-widest text-[#94a348]">Room admin</h1>
              <p className="text-xs text-[#8a9a70]" aria-live="polite">
                {saved === 'saving' ? 'Saving…' : saved === 'failed' ? 'Could not save in this browser' : isDirty ? 'Draft saved in this browser' : 'Same as the published room'}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={primaryButtonClass} onClick={() => setTab('publish')}>
                Publish…
              </button>
              <a className={buttonClass} href={withBase('/room/?draft=1')} target="_blank" rel="noopener noreferrer">
                Open draft in the room
              </a>
              <a className={buttonClass} href={withBase('/room/')} target="_blank" rel="noopener noreferrer">
                Open published room
              </a>
            </div>
          </header>

          <nav aria-label="Sections" className="flex gap-1 overflow-x-auto border-b border-[#1a1e10] px-2 py-2">
            {ALL_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`shrink-0 px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                  tab === t.id ? 'bg-[#94a348] text-[#0a0c04]' : 'text-[#c8d4a8] hover:bg-[#151a0a] hover:text-[#94a348]'
                }`}
              >
                {t.title}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-2">
            {notice && <p className="mb-2 border border-[#2e3a1c] px-3 py-2 text-xs text-[#f0d9a0]">{notice}</p>}

            {/* ------------------------------ items ------------------------------ */}
            {tab === 'items' && (
              <>
                <Group title="Add your own" intro="Hang a picture on a wall or stand a 3D model in the room.">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={buttonClass} onClick={() => addPicture.current?.click()}>
                      Add a picture…
                    </button>
                    <button type="button" className={buttonClass} onClick={() => addModel.current?.click()}>
                      Add a 3D model…
                    </button>
                  </div>
                  <input ref={addPicture} type="file" accept="image/*" hidden onChange={(e) => addItem(e.target.files?.[0], 'image')} />
                  <input ref={addModel} type="file" accept=".glb,model/gltf-binary" hidden onChange={(e) => addItem(e.target.files?.[0], 'model')} />
                </Group>

                <Group title="Everything in the room" open={!selectedId}>
                  {config.extras.length > 0 && (
                    <ItemList title="Added by you" items={config.extras.map((e) => ({ id: e.id, label: e.label }))} selectedId={selectedId} onPick={visit} />
                  )}
                  {groups.map(([group, items]) => (
                    <ItemList key={group} title={group} items={items} selectedId={selectedId} onPick={visit} />
                  ))}
                </Group>

                {selectedId ? (
                  <ItemEditor
                    key={selectedId}
                    config={config}
                    id={selectedId}
                    update={update}
                    onVisit={visit}
                    onDeleted={() => setSelectedId(null)}
                  />
                ) : (
                  <p className="py-4 text-xs text-[#8a9a70]">
                    Pick an item above, or click one in the preview, to change where it stands, swap it for your own
                    model, and decide what happens when it is looked at.
                  </p>
                )}
              </>
            )}

            {/* ------------------------------ places ------------------------------ */}
            {tab === 'places' && <WorldsPanel config={config} update={update} />}

            {/* ------------------------------ schema tabs ------------------------------ */}
            {schemaTab &&
              schemaTab.sections.map((section) => (
                <Group key={section.id} title={section.title} intro={section.intro}>
                  {section.fields.map((field) => (
                    <SchemaField key={field.path} field={field} value={getAt(config, field.path)} onChange={(v) => setValue(field.path, v)} />
                  ))}
                  {tab === 'look' && section.id === 'pixels' && (
                    <PaletteEditor palette={config.look.palette} onChange={(palette) => setValue('look.palette', palette)} />
                  )}
                </Group>
              ))}

            {/* ------------------------------ files ------------------------------ */}
            {tab === 'files' && <FilesPanel config={config} />}

            {/* ------------------------------ publish ------------------------------ */}
            {tab === 'publish' && (
              <div className="py-2">
                <Group title="Put these settings on the website">
                  <ol className="list-decimal space-y-2 pl-5 text-xs leading-relaxed text-[#c8d4a8]">
                    <li>Press “Download bundle” below. You get a zip file.</li>
                    <li>
                      Unzip it into the <code className="text-[#f0d9a0]">nextjs_space/public</code> folder of the website
                      project. It adds <code className="text-[#f0d9a0]">room/room-config.json</code> and your pictures and
                      models under <code className="text-[#f0d9a0]">room/assets/</code>. Replace the old file when asked.
                    </li>
                    <li>Commit and push. The site republishes itself in a couple of minutes.</li>
                  </ol>
                  <p className="mt-3 text-xs text-[#8a9a70]">
                    Until then, changes only exist in this browser. Nobody else sees them.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className={primaryButtonClass} disabled={exporting} onClick={exportBundle}>
                      {exporting ? 'Building…' : 'Download bundle'}
                    </button>
                    <button
                      type="button"
                      className={buttonClass}
                      onClick={() => download('room-config.json', JSON.stringify(config, null, 2) + '\n', 'application/json')}
                    >
                      Settings only (.json)
                    </button>
                  </div>
                  {bundle && (
                    <div className="mt-3 border border-[#2e3a1c] p-3 text-xs">
                      <p className="text-[#f3f7e4]">Downloaded {bundle.files.length} files:</p>
                      <ul className="mt-1 space-y-0.5 text-[#8a9a70]">
                        {bundle.files.map((f) => (
                          <li key={f.path} className="truncate">
                            {f.path} · {f.size >= 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`}
                          </li>
                        ))}
                      </ul>
                      {bundle.missing.length > 0 && (
                        <p className="mt-2 text-[#f07a5a]">
                          {bundle.missing.length} imported file{bundle.missing.length === 1 ? ' is' : 's are'} no longer in this
                          browser and {bundle.missing.length === 1 ? 'was' : 'were'} left out.
                        </p>
                      )}
                    </div>
                  )}
                </Group>

                <Group title="Draft">
                  <p className="text-xs text-[#8a9a70]">
                    {isDirty ? 'Your draft differs from the published room.' : 'Your draft matches the published room.'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className={buttonClass} onClick={() => importJson.current?.click()}>
                      Load a settings file…
                    </button>
                    <button type="button" className={buttonClass} onClick={resetToPublished}>
                      Throw away the draft
                    </button>
                  </div>
                  <input ref={importJson} type="file" accept="application/json,.json" hidden onChange={(e) => importSettings(e.target.files?.[0])} />
                </Group>

                <Group title="Good to know" open={false}>
                  <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-[#8a9a70]">
                    <li>This page needs no password because it cannot change the website; it only edits a draft in your browser.</li>
                    <li>Imported files live in this browser only. Use the same browser, or publish, so you do not lose them.</li>
                    <li>Models must be single-file <code>.glb</code>. Keep them small: a few MB is plenty for a room this size.</li>
                  </ul>
                </Group>
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminContext.Provider>
  );
}

/** A compact list of items to pick from. */
function ItemList({
  title,
  items,
  selectedId,
  onPick,
}: {
  title: string;
  items: { id: string; label: string }[];
  selectedId: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <div className="py-1">
      <p className="pb-1 text-[11px] uppercase tracking-widest text-[#5e6e44]">{title}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPick(item.id)}
            aria-pressed={selectedId === item.id}
            className={`px-2 py-1 text-xs transition-colors ${
              selectedId === item.id
                ? 'bg-[#94a348] text-[#0a0c04]'
                : 'border border-[#2e3a1c] text-[#c8d4a8] hover:border-[#94a348] hover:text-[#f3f7e4]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The colours every pixel in the room is snapped to. */
function PaletteEditor({ palette, onChange }: { palette: string[]; onChange: (p: string[]) => void }) {
  return (
    <div className="mt-3 border-t border-[#1a1e10] pt-3">
      <p className="text-xs text-[#c8d4a8]">Palette ({palette.length} colours)</p>
      <p className="pb-2 text-xs text-[#8a9a70]">
        Every pixel in the room becomes the nearest of these colours. Fewer colours look chunkier; add colours your own
        pictures need.
      </p>
      <div className="grid grid-cols-2 gap-x-4">
        {palette.map((color, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="flex-1">
              <ColorField label={`Colour ${i + 1}`} value={color} onChange={(v) => onChange(palette.map((c, j) => (j === i ? v : c)))} />
            </div>
            <button
              type="button"
              aria-label={`Remove colour ${i + 1}`}
              disabled={palette.length <= 2}
              onClick={() => onChange(palette.filter((_, j) => j !== i))}
              className="px-1 text-xs text-[#8a9a70] hover:text-[#f07a5a] disabled:opacity-30"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <button type="button" className={buttonClass} disabled={palette.length >= 64} onClick={() => onChange([...palette, '#808080'])}>
          Add a colour
        </button>
        <button type="button" className={buttonClass} onClick={() => onChange([...DEFAULT_CONFIG.look.palette])}>
          Reset the palette
        </button>
      </div>
    </div>
  );
}
