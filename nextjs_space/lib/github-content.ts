// How the admin page saves. The site is static, so "saving" means committing
// to the GitHub repository: the commit rebuilds and republishes the site.
//
// The token is never part of the site. The admin page asks for it, keeps it in
// the browser tab's sessionStorage only, and sends it nowhere except GitHub.

import type { SiteContent } from './content';

export const REPO_OWNER = 'FlamingAirplane';
export const REPO_NAME = 'Personal-Website';
export const BRANCH = 'main';
export const CONTENT_PATH = 'nextjs_space/content/site-content.json';
export const UPLOAD_DIR = 'nextjs_space/public/uploads';
export const ACTIONS_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/actions`;
export const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';

const API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const TOKEN_KEY = 'admin-github-token';

export class GitHubError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function readToken(): string {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

export function rememberToken(token: string) {
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked: the token is asked for again on reload */
  }
}

function explain(status: number, fallback: string): string {
  if (status === 401) return 'GitHub did not accept that token. It may be wrong or expired.';
  if (status === 403 || status === 404) {
    return `The token cannot reach ${REPO_OWNER}/${REPO_NAME}. It needs "Contents: Read and write" on that repository.`;
  }
  if (status === 409 || status === 422) return 'The content changed on GitHub while you were editing. Try again.';
  return fallback;
}

async function github(token: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!response.ok) {
    let detail = '';
    try {
      detail = (await response.json())?.message ?? '';
    } catch {
      /* no body */
    }
    throw new GitHubError(response.status, explain(response.status, detail || `GitHub answered ${response.status}.`));
  }
  return response.json();
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(encoded: string): string {
  const binary = atob(encoded.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Checks the token can write to the repository. Throws a readable GitHubError if not. */
export async function checkToken(token: string): Promise<void> {
  const repo = await github(token, '');
  if (!repo?.permissions?.push) {
    throw new GitHubError(403, explain(403, ''));
  }
}

/** The content file as it is on GitHub right now, and the id GitHub needs to accept a change to it. */
export async function loadContent(token: string): Promise<{ content: SiteContent; sha: string }> {
  const file = await github(token, `/contents/${CONTENT_PATH}?ref=${BRANCH}`);
  return { content: JSON.parse(fromBase64(file.content)) as SiteContent, sha: file.sha };
}

/** Commits new content. Returns the new file id. */
export async function saveContent(token: string, content: SiteContent, sha: string, message: string): Promise<string> {
  const result = await github(token, `/contents/${CONTENT_PATH}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: toBase64(`${JSON.stringify(content, null, 2)}\n`),
      sha,
      branch: BRANCH,
    }),
  });
  return result.content.sha as string;
}

function safeName(name: string): string {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');
  return `${Date.now()}-${cleaned || 'file'}`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.readAsDataURL(blob);
  });
}

/** Commits a file into public/uploads/. Returns its site path, e.g. "/uploads/123-cover.jpg". */
export async function uploadFile(token: string, file: Blob, name: string): Promise<string> {
  const fileName = safeName(name);
  await github(token, `/contents/${UPLOAD_DIR}/${fileName}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Admin: upload ${fileName}`,
      content: await blobToBase64(file),
      branch: BRANCH,
    }),
  });
  return `/uploads/${fileName}`;
}
