// What the site says lives in content/site-content.json. You can edit that file
// by hand, or use the admin page at /admin/, which edits it for you. Either way,
// pushing the change to GitHub rebuilds and republishes the site.
//
// Images go in public/images/ (or public/uploads/, where the admin page puts
// uploads) and are referenced as "/images/your-file.jpg".
// Keep them small: about 1000 pixels wide is plenty for a project cover.

import { withBase } from './site';
import data from '../content/site-content.json';

export interface Profile {
  name: string;
  /** The big title on the home page, also the logo in the menu. */
  siteName: string;
  /** Small line under the big title. */
  strapline: string;
  tagline: string;
  /** Short job title, used in search-engine data. */
  jobTitle: string;
  bio: string;
  /** Shown in a quote box in the About section. Empty hides the box. */
  quote: string;
  /** The "Expertise" paragraph in the About section. */
  expertise: string;
  /** Skill tags under the Expertise paragraph. */
  skills: string[];
  imageUrl: string;
  heroBgUrl: string;
  /** Put the PDF in public/ and set this to e.g. "/resume.pdf". Empty hides the button. */
  resumeUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  email: string;
  phone: string;
}

export interface PortfolioItem {
  id: string;
  /** Address of the project's own page: /projects/<slug>/ */
  slug: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  /** External link to play / view it. "#" means none yet. */
  projectLink: string;
  /** Optional YouTube link. Its thumbnail becomes the cover when imageUrl is empty, and it is the default projectLink. */
  youtubeUrl?: string;
  year: number;
  type: 'game' | 'sound';
  /** Comma-separated. */
  tags: string;
  /** Longer write-up for the project page (plain text or markdown). */
  subpageContent?: string;
  /** JSON array of image paths for the project page gallery. */
  galleryImages?: string;
  /** Lower numbers show first. */
  sortOrder?: number;
}

export interface WorkHistoryItem {
  id: string;
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate: string;
  /** Lower numbers show first. */
  sortOrder?: number;
}

/** The title particles and the custom cursor. The sliders in the admin page set these. */
export interface SiteSettings {
  particleMouseRadius: number;
  particlePushForce: number;
  /** Percent. */
  particleReturnSpeed: number;
  /** Percent. */
  particleFriction: number;
  particleGap: number;
  cursorEnabled: boolean;
  cursorSize: number;
  cursorHoverSize: number;
  /** Percent. Lower is a lazier cursor. */
  cursorLag: number;
  cursorColorLight: string;
  cursorColorDark: string;
}

/** The whole content file, as the admin page reads and writes it. */
export interface SiteContent {
  profile: Profile;
  siteSettings: SiteSettings;
  portfolioItems: PortfolioItem[];
  workHistory: WorkHistoryItem[];
}

const content = data as SiteContent;

/** The 11-character video id from any common YouTube link, or null. */
export function youtubeId(url?: string): string | null {
  const m = (url ?? '').match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

/** Thumbnail address for a YouTube link, or '' when the link is not a YouTube video. */
export function youtubeThumbnail(url?: string): string {
  const id = youtubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
}

/** Items in the order the file's sortOrder numbers ask for. Items without one keep their place. */
function bySortOrder<T extends { sortOrder?: number }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (a.item.sortOrder ?? a.index) - (b.item.sortOrder ?? b.index) || a.index - b.index)
    .map(({ item }) => item);
}

export const profile: Profile = {
  ...content.profile,
  imageUrl: withBase(content.profile.imageUrl),
  heroBgUrl: withBase(content.profile.heroBgUrl),
};

export const siteSettings: SiteSettings = content.siteSettings;

// A project with a youtubeUrl gets its thumbnail as the cover (unless it has its own
// image) and the video as its link (unless it has its own link).
export const portfolioItems: PortfolioItem[] = bySortOrder(content.portfolioItems).map((item) => ({
  ...item,
  imageUrl: withBase(item.imageUrl || youtubeThumbnail(item.youtubeUrl)),
  projectLink:
    item.projectLink && item.projectLink !== '#' ? item.projectLink : item.youtubeUrl || item.projectLink,
}));

export const workHistory: WorkHistoryItem[] = bySortOrder(content.workHistory);

/** True when a project has something to show beyond its card. */
export function hasProjectPageContent(item: PortfolioItem): boolean {
  return Boolean(item.subpageContent?.trim()) || parseGallery(item).length > 0;
}

/** The gallery image paths of a project, already prefixed for the site's address. */
export function parseGallery(item: PortfolioItem): string[] {
  try {
    const list = JSON.parse(item.galleryImages || '[]');
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string').map(withBase) : [];
  } catch {
    return [];
  }
}

/** True when the Resume section has anything to show. */
export function hasResumeSection(p: Profile): boolean {
  return Boolean(p.resumeUrl || p.twitterUrl || p.instagramUrl || p.email || p.phone);
}
