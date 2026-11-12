// All of the site's content lives in this file. To change the site, edit
// this file and push: GitHub rebuilds and republishes it automatically.
//
// Images go in public/images/ and are referenced as "/images/your-file.jpg".
// Keep them small: about 1000 pixels wide is plenty for a project cover.

import { withBase } from './site';

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
}

export interface WorkHistoryItem {
  id: string;
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate: string;
}

export const profile: Profile = {
  name: 'Adine Johnson',
  siteName: 'Adine.',
  strapline: 'Corner of the Internet',
  tagline: 'Game Designer & Sound Designer attending SCAD',
  jobTitle: 'Game Designer & Sound Designer',
  bio: 'Hello, I am Adine Johnson and I am a junior systems designer student majoring in Game Design at Savannah College of Art and Design (SCAD). I am a lover of all types of games and enjoy playing, studying, and making them in my spare time. I also am very fond of reading, writing, and learning about anything.',
  quote: 'The truest form of joy is making others happy',
  expertise:
    'My goal is to create elegant Game Design and awe-inspiring Sound Design. My core passion lies in the meticulous craft of creating elegant game design, focusing on intuitive mechanics, compelling narratives, and engaging player experiences. Complementing this, I am deeply committed to developing awe-inspiring sound design, where every auditory element is carefully sculpted to enhance immersion, convey emotion, and elevate the overall interactive journey.',
  skills: ['Game Design', 'Game Art', 'Game Tech', 'Sound Design', 'SFX Design', 'BG SFX Design'],
  imageUrl: withBase('/images/profile.jpg'),
  heroBgUrl: withBase('/images/hero-bg.jpg'),
  resumeUrl: '/Adine-Johnson-Resume.pdf',
  twitterUrl: '',
  instagramUrl: '',
  email: 'AAdineWJ3@gmail.com',
  phone: '346-234-5895',
};

// Listed in the order they appear on the page.
const rawPortfolioItems: PortfolioItem[] = [
  {
    id: 'regenesis',
    slug: 'regenesis',
    title: 'Regenesis',
    category: 'Game Design & Project Lead',
    description:
      'A strategy game for 2–4 players where teams of Heroes navigate a chaotic landscape to collect three Fragments of Regenesis and avert global annihilation.',
    imageUrl: withBase('/images/portfolio/regenesis.png'),
    projectLink: '#',
    year: 2025,
    type: 'game',
    tags: 'Board Game,Strategy,Deck Builder,4 Players',
  },
  {
    id: 'freezepoint',
    slug: 'freezepoint',
    title: 'FreezePoint',
    category: 'Game Design & Sound Design',
    description:
      'A collaborative game design and sound design project. FreezePoint combines immersive gameplay mechanics with carefully crafted audio to create a compelling interactive experience.',
    imageUrl: withBase('/images/portfolio/freezepoint.jpg'),
    projectLink: '#',
    year: 2025,
    type: 'game',
    tags: 'Game Design,Sound Design,Collaboration',
  },
  {
    id: 'wrappers-please',
    slug: 'wrappers-please',
    title: 'Wrappers Please',
    category: 'Game Design & Sound Design',
    description:
      'A unique game combining creative game design with immersive sound design elements. Players engage with intuitive mechanics in a fun and engaging environment.',
    imageUrl: withBase('/images/portfolio/wrappers-please.png'),
    projectLink: '#',
    year: 2025,
    type: 'game',
    tags: 'Game Design,Sound Design',
  },
  {
    id: 'parking-day',
    slug: 'parking-day',
    title: 'Parking Day SCAD Pro',
    category: 'Public Speaking & Website Design',
    description:
      'A SCAD Pro project involving public speaking and website design for Parking Day. Combined design skills with professional presentation to create an impactful community event.',
    imageUrl: withBase('/images/portfolio/parking-day.png'),
    projectLink: '#',
    year: 2024,
    type: 'game',
    tags: 'Public Speaking,Website Design,SCAD Pro',
  },
  {
    id: 'manacy',
    slug: 'manacy',
    title: 'Manacy',
    category: 'Solo Game',
    description:
      'An independently developed solo game project showcasing game design skills from concept to completion.',
    imageUrl: withBase('/images/portfolio/manacy.jpg'),
    projectLink: '#',
    year: 2026,
    type: 'game',
    tags: 'Solo Game,Independent',
  },
  {
    id: 'autonomous-tracker',
    slug: 'autonomous-tracker',
    title: 'Autonomous Tracker',
    category: 'Solo Game',
    description:
      'A solo game project featuring autonomous tracking mechanics and engaging gameplay systems.',
    imageUrl: withBase('/images/portfolio/autonomous-tracker.jpg'),
    projectLink: '#',
    year: 2024,
    type: 'game',
    tags: 'Solo Game,Systems Design',
  },
  {
    id: 'attack-crab-people',
    slug: 'attack-of-the-crab-people',
    title: 'Attack of the Crab People',
    category: 'Project Lead',
    description:
      'Led a team project creating an exciting game experience. As project lead, managed design direction, team coordination, and overall game development.',
    imageUrl: withBase('/images/portfolio/attack-of-the-crab-people.jpg'),
    projectLink: '#',
    year: 2024,
    type: 'game',
    tags: 'Project Lead,Team Game,Board Game',
  },
  {
    id: '33333-ft',
    slug: '33333-ft',
    title: '33,333 ft',
    category: 'Solo Game',
    description: 'A solo game project exploring height and scale in game design.',
    imageUrl: withBase('/images/portfolio/33333-ft.jpg'),
    projectLink: '#',
    year: 2024,
    type: 'game',
    tags: 'Solo Game,Coming Soon',
  },
  {
    id: 'false-alarm',
    slug: 'false-alarm',
    title: 'The Weeknd - False Alarm',
    category: 'Sound Replacement',
    description: '',
    imageUrl: '',
    projectLink: '#',
    youtubeUrl: 'https://youtu.be/CNx3Cd3rXGI',
    year: 2026,
    type: 'sound',
    tags: 'Sound Replacement',
  },
  {
    id: 'grime-go-away',
    slug: 'grime-go-away',
    title: 'Grime Go Away',
    category: 'Sound Design',
    description:
      'A sound design project creating immersive audio landscapes and effects. Every auditory element was carefully sculpted to enhance the overall experience.',
    imageUrl: withBase('/images/portfolio/grime-go-away.jpg'),
    projectLink: '#',
    year: 2025,
    type: 'sound',
    tags: 'Sound Design,SFX',
  },
];

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

// A project with a youtubeUrl gets its thumbnail as the cover (unless it has its own
// image) and the video as its link (unless it has its own link).
export const portfolioItems: PortfolioItem[] = rawPortfolioItems.map((item) => ({
  ...item,
  imageUrl: item.imageUrl || youtubeThumbnail(item.youtubeUrl),
  projectLink:
    item.projectLink && item.projectLink !== '#' ? item.projectLink : item.youtubeUrl || item.projectLink,
}));

// Newest first.
export const workHistory: WorkHistoryItem[] = [
  {
    id: 'easy-agent-pro',
    company: 'Easy Agent Pro',
    position: 'UI & UX Consultant',
    description:
      'While working as a UI & UX Consultant, I learned how to work in a professional environment and learn on the job to achieve a better result.',
    startDate: 'December 2025',
    endDate: 'Present',
  },
  {
    id: 'womack-dev',
    company: 'Womack Development',
    position: 'Website Manager',
    description:
      'While working as a Website Manager, I learned how to deal with unexpected situations and how to prioritize tasks when given multiple jobs to complete.',
    startDate: 'June 2025',
    endDate: 'August 2025',
  },
  {
    id: '3-stories',
    company: '3 Stories',
    position: "Bartender's Assistant",
    description:
      "While working as a Bartender's Assistant, I learned how to work in a fast-paced environment while maintaining a level of quality and professionalism.",
    startDate: 'December 2024',
    endDate: 'August 2025',
  },
  {
    id: 'sjli',
    company: 'SJLI',
    position: 'Higher Pathways Scholar',
    description:
      'While working as a Higher Pathways Scholar, I was able to share my college experience with rising college freshmen to better prepare them for college.',
    startDate: 'May 2023',
    endDate: 'August 2023',
  },
  {
    id: 'freelance-tutor',
    company: 'Freelance',
    position: 'Math Tutor',
    description:
      'While working as a Freelance Tutor, I learned how to educate others quickly on complex topics in a professional setting.',
    startDate: 'November 2022',
    endDate: 'March 2023',
  },
];

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
