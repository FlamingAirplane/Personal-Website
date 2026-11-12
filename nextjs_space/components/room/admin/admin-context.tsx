'use client';

import { createContext, useContext } from 'react';
import type { AssetKind, Resolver, StoredAsset } from '@/lib/room/assets';

export interface AdminCtx {
  /** Turns a file reference into an address the browser can load. */
  resolve: Resolver;
  /** The files imported in this browser. */
  assets: StoredAsset[];
  /** Import a file; resolves to the reference to store in a setting. */
  importFile(file: File, expect: AssetKind): Promise<string>;
  removeAsset(id: string): Promise<void>;
}

export const AdminContext = createContext<AdminCtx | null>(null);

export function useAdmin(): AdminCtx {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside the admin page');
  return ctx;
}
