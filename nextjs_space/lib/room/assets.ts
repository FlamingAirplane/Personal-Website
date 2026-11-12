// Files you import in the admin page (pictures, 3D models) are kept in this
// browser, in IndexedDB, until you export them. A reference to one looks like
// "idb:<id>". Once exported and added to the site, a reference is an ordinary
// path such as "/room/assets/poster-4f2a.jpg".

import { withBase } from '../site';

export const DRAFT_PREFIX = 'idb:';
export const ASSET_FOLDER = '/room/assets';
export const MAX_FILE_BYTES = 40 * 1024 * 1024;

export type AssetKind = 'image' | 'model';

export interface StoredAsset {
  id: string;
  name: string;
  type: string;
  kind: AssetKind;
  size: number;
  blob: Blob;
  added: number;
}

const DB_NAME = 'room-assets';
const STORE = 'assets';

export const isDraftRef = (ref: string) => ref.startsWith(DRAFT_PREFIX);

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = fn(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export function listAssets(): Promise<StoredAsset[]> {
  return run('readonly', (s) => s.getAll() as IDBRequest<StoredAsset[]>).then((all) =>
    all.sort((a, b) => b.added - a.added),
  );
}

export function getAsset(id: string): Promise<StoredAsset | undefined> {
  return run('readonly', (s) => s.get(id) as IDBRequest<StoredAsset | undefined>);
}

export async function deleteAsset(id: string): Promise<void> {
  await run('readwrite', (s) => s.delete(id));
}

/** Work out what a dropped file is, or null if the room cannot use it. */
export function kindOf(file: File): AssetKind | null {
  if (file.type.startsWith('image/')) return 'image';
  if (/\.glb$/i.test(file.name) || file.type === 'model/gltf-binary') return 'model';
  return null;
}

/** Make a big picture smaller. The room draws at low resolution, so very large pictures only add weight. */
export async function prepareImage(file: File, maxSide = 2560): Promise<Blob> {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;
  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  if (longest <= maxSide && file.size <= 2 * 1024 * 1024) {
    bitmap.close();
    return file;
  }
  const scale = Math.min(1, maxSide / longest);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // Keep transparency (PNG); otherwise JPEG, which is far smaller for photos.
  const keepPng = file.type === 'image/png';
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, keepPng ? 'image/png' : 'image/jpeg', 0.86),
  );
  return blob && blob.size < file.size ? blob : file;
}

/** Store a file and return the reference to use for it. */
export async function addAsset(file: File): Promise<{ ref: string; asset: StoredAsset }> {
  const kind = kindOf(file);
  if (!kind) throw new Error('Use a picture (JPG, PNG, WebP, GIF, SVG) or a .glb 3D model.');
  if (file.size > MAX_FILE_BYTES * 2) throw new Error('That file is too large (over 80 MB).');
  const blob = kind === 'image' ? await prepareImage(file) : file;
  if (blob.size > MAX_FILE_BYTES) throw new Error('That file is over 40 MB. Shrink it first; GitHub refuses files over 100 MB.');
  const id = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  const asset: StoredAsset = {
    id,
    name: file.name,
    type: blob.type || file.type,
    kind,
    size: blob.size,
    blob,
    added: Date.now(),
  };
  await run('readwrite', (s) => s.put(asset));
  return { ref: DRAFT_PREFIX + id, asset };
}

/** Object URLs for the draft files named in `refs`. */
export async function loadDraftUrls(refs: string[], into = new Map<string, string>()): Promise<Map<string, string>> {
  for (const ref of refs) {
    if (!isDraftRef(ref) || into.has(ref)) continue;
    try {
      const asset = await getAsset(ref.slice(DRAFT_PREFIX.length));
      if (asset) into.set(ref, URL.createObjectURL(asset.blob));
    } catch {
      /* storage blocked: the file just will not show */
    }
  }
  return into;
}

/** Turns a file reference into an address the browser can load. */
export type Resolver = (ref: string) => string;

export function makeResolver(urls: Map<string, string>): Resolver {
  return (ref) => {
    if (!ref) return '';
    if (isDraftRef(ref)) return urls.get(ref) ?? '';
    if (/^(https?:|data:|blob:)/.test(ref)) return ref;
    return ref.startsWith('/') ? withBase(ref) : ref;
  };
}

/** A tidy file name: lower case, safe characters, and the original extension. */
export function safeFileName(name: string, id: string): string {
  const dot = name.lastIndexOf('.');
  const base = (dot > 0 ? name.slice(0, dot) : name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'file';
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) : '';
  return `${base}-${id.slice(0, 4)}${ext ? '.' + ext : ''}`;
}
