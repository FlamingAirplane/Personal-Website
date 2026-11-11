// Where the site lives. GitHub Pages serves this repo from a sub-path, so
// every link to a file or page has to be prefixed with it.

/** "" in development, "/Personal-Website" in the published build. Set in next.config.js. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** The public address, used for the sitemap and social previews. */
export const SITE_URL = `https://flamingairplane.github.io${BASE_PATH}`;

/** Prefix a site-relative path ("/images/x.png", "/room/") with the base path. */
export function withBase(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  return `${BASE_PATH}${path}`;
}
