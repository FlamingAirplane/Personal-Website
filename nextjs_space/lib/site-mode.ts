// The visitor's answer to "Fun or Standard?", remembered in their browser.
// (The site is static, so there is no server to remember it for them.)

const KEY = 'site-mode';

export type SiteMode = 'fun' | 'standard';

export function readSiteMode(): SiteMode | null {
  try {
    const value = window.localStorage.getItem(KEY);
    return value === 'fun' || value === 'standard' ? value : null;
  } catch {
    return null;
  }
}

export function rememberSiteMode(mode: SiteMode) {
  try {
    window.localStorage.setItem(KEY, mode);
  } catch {
    /* storage blocked: the question is simply asked again next visit */
  }
}
