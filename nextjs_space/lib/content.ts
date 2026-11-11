// All of the site's content lives in this file. To change the site, edit
// this file and push: GitHub rebuilds and republishes it automatically.
//
// Images go in public/images/ and are referenced as "/images/your-file.png".

import { withBase } from './site';

export interface Profile {
  name: string;
  tagline: string;
  bio: string;
  imageUrl: string;
  heroBgUrl: string;
  /** Put the PDF in public/ and set this to e.g. "/resume.pdf". Empty hides the button. */
  resumeUrl: string;
  twitterUrl: string;
  instagramUrl: string;
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
  tagline: 'Game Designer & Sound Designer attending SCAD',
  bio: 'Hello, I am Adine Johnson and I am a junior systems designer student majoring in Game Design at Savannah College of Art and Design (SCAD). I am a lover of all types of games and enjoy playing, studying, and making them in my spare time. I also am very fond of reading, writing, and learning about anything.',
  imageUrl: withBase('/images/profilepic.jpeg'),
  heroBgUrl: withBase('/images/hero-bg.jpeg'),
  resumeUrl: '',
  twitterUrl: '',
  instagramUrl: '',
};

// Listed in the order they appear on the page.
export const portfolioItems: PortfolioItem[] = [
  {
    id: 'freezepoint',
    slug: 'freezepoint',
    title: 'FreezePoint',
    category: 'Game Design & Sound Design',
    description:
      'A collaborative game design and sound design project. FreezePoint combines immersive gameplay mechanics with carefully crafted audio to create a compelling interactive experience.',
    imageUrl: withBase('/images/portfolio/FrezzePoint.png'),
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
    imageUrl: withBase('/images/portfolio/WrapersPlease.png'),
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
    imageUrl: withBase('/images/portfolio/ParkingDay.png'),
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
    imageUrl: withBase('/images/portfolio/woodcraft.jpg'),
    projectLink: '#',
    year: 2024,
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
    imageUrl: withBase('/images/portfolio/AutonomousTracker.png'),
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
    imageUrl: withBase('/images/portfolio/AotCP.png'),
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
    imageUrl: withBase('/images/portfolio/33333ft.png'),
    projectLink: '#',
    year: 2024,
    type: 'game',
    tags: 'Solo Game,Coming Soon',
  },
  {
    id: 'grime-go-away',
    slug: 'grime-go-away',
    title: 'Grime Go Away',
    category: 'Sound Design',
    description:
      'A sound design project creating immersive audio landscapes and effects. Every auditory element was carefully sculpted to enhance the overall experience.',
    imageUrl: withBase('/images/portfolio/GrimeGoAway.jpg'),
    projectLink: '#',
    year: 2025,
    type: 'sound',
    tags: 'Sound Design,SFX',
  },
];

// Newest first.
export const workHistory: WorkHistoryItem[] = [
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
