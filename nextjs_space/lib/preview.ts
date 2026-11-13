'use client';

import { useSyncExternalStore } from 'react';
import { published, resolveContent, type ResolvedContent, type SiteContent } from './content';
import { withBase } from './site';

export const DRAFT_KEY = 'admin-draft';
export const PREVIEW_PATH = '/admin/preview/';

const RAW_BASE = 'https://raw.githubusercontent.com/FlamingAirplane/Personal-Website/main/nextjs_space/public';

let override: ResolvedContent | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Uploads are on GitHub straight away but only on the site after the next publish. */
function previewAsset(path: string): string {
  return path.startsWith('/uploads/') ? `${RAW_BASE}${path}` : withBase(path);
}

/** Turns a site path (e.g. an upload) into an address, also while previewing. */
export function useAsset(): (path: string) => string {
  return useIsPreview() ? previewAsset : withBase;
}

/** Shows the given draft instead of the published content. Null goes back to the published content. */
export function setPreviewContent(draft: SiteContent | null) {
  override = draft ? resolveContent(draft, previewAsset) : null;
  listeners.forEach((listener) => listener());
}

export function useIsPreview(): boolean {
  return useSyncExternalStore(subscribe, () => override !== null, () => false);
}

/** The content to show: the admin draft while previewing, otherwise the published content. */
export function useSiteContent(): ResolvedContent {
  return useSyncExternalStore(subscribe, () => override ?? published, () => published);
}

/** Links to pages, kept inside the preview while previewing. */
export function useSiteLinks() {
  const isPreview = useIsPreview();
  return {
    home: isPreview ? PREVIEW_PATH : '/',
    project: (slug: string) => (isPreview ? `${PREVIEW_PATH}?project=${encodeURIComponent(slug)}` : `/projects/${slug}`),
  };
}

export interface StoredDraft {
  content: SiteContent;
  baseSha: string;
}

export function readDraft(): StoredDraft | null {
  try {
    const saved = window.localStorage.getItem(DRAFT_KEY);
    return saved ? (JSON.parse(saved) as StoredDraft) : null;
  } catch {
    return null;
  }
}

export function writeDraft(draft: StoredDraft | null) {
  try {
    if (draft) window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else window.localStorage.removeItem(DRAFT_KEY);
  } catch {}
}
