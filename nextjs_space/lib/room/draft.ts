// The admin page keeps your unpublished edits in this browser.

import { resolveConfig, type RoomConfig } from './config';

const KEY = 'room-draft';

export function loadDraft(): RoomConfig | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? resolveConfig(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveDraft(config: RoomConfig): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

export function hasDraft(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}
