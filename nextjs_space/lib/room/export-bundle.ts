// Turns the draft into files you can add to the site: a config file plus
// every imported picture and model, zipped. Unzip it into nextjs_space/public/
// and commit.

import { zip } from '../zip';
import { ASSET_FOLDER, DRAFT_PREFIX, getAsset, isDraftRef, safeFileName } from './assets';
import { collectRefs, mapRefs, type RoomConfig } from './config';

export interface Bundle {
  /** The config with draft file references rewritten to site paths. */
  config: RoomConfig;
  /** The whole bundle as a zip. */
  zipBytes: Uint8Array;
  files: { path: string; size: number }[];
  /** References that point at files no longer in this browser. */
  missing: string[];
}

export async function buildBundle(config: RoomConfig): Promise<Bundle> {
  const renames = new Map<string, string>();
  const files: { path: string; data: Uint8Array }[] = [];
  const missing: string[] = [];

  for (const ref of collectRefs(config)) {
    if (!isDraftRef(ref)) continue;
    const asset = await getAsset(ref.slice(DRAFT_PREFIX.length));
    if (!asset) {
      missing.push(ref);
      continue;
    }
    const name = safeFileName(asset.name, asset.id);
    renames.set(ref, `${ASSET_FOLDER}/${name}`);
    files.push({ path: `room/assets/${name}`, data: new Uint8Array(await asset.blob.arrayBuffer()) });
  }

  // A reference to a lost file becomes empty rather than a dead link.
  const published = mapRefs(config, (ref) => (isDraftRef(ref) ? (renames.get(ref) ?? '') : ref));
  const json = JSON.stringify(published, null, 2) + '\n';
  const jsonFile = { path: 'room/room-config.json', data: new TextEncoder().encode(json) };

  const readme = new TextEncoder().encode(
    [
      'How to publish these room settings',
      '===================================',
      '',
      'Unzip this into the "nextjs_space/public" folder of the website project,',
      'so that you end up with:',
      '',
      '  nextjs_space/public/room/room-config.json',
      '  nextjs_space/public/room/assets/...   (your pictures and models)',
      '',
      'Replace the existing room-config.json when asked. Then commit and push;',
      'the site republishes itself in a couple of minutes.',
      '',
    ].join('\n'),
  );

  const all = [jsonFile, ...files, { path: 'README.txt', data: readme }];
  return {
    config: published,
    zipBytes: zip(all),
    files: all.map((f) => ({ path: f.path, size: f.data.length })),
    missing,
  };
}

/** Offer bytes as a download. */
export function download(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
