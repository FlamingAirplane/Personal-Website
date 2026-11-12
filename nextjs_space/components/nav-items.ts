import { Briefcase, FileText, Gamepad2, Home, Music, User, type LucideIcon } from 'lucide-react';
import { hasResumeSection, profile } from '@/lib/content';

export interface NavItem {
  /** The id of the section on the home page; the link is "#<id>". */
  id: string;
  label: string;
  icon: LucideIcon;
}

const ALL_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'game-portfolio', label: 'Games', icon: Gamepad2 },
  { id: 'sound-portfolio', label: 'Sound', icon: Music },
  { id: 'work-history', label: 'Work', icon: Briefcase },
  { id: 'about', label: 'About Me', icon: User },
  { id: 'contact', label: 'Resume', icon: FileText },
];

/** The sections of the home page, in order. Resume is left out while it is empty. */
export const NAV_ITEMS: NavItem[] = ALL_ITEMS.filter(
  (item) => item.id !== 'contact' || hasResumeSection(profile),
);
