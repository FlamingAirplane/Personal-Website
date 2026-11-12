import type { Metadata } from 'next';
import { PortfolioClient } from '@/components/portfolio-client';
import { ModeGate } from '@/components/mode-gate';
import { portfolioItems, profile, workHistory } from '@/lib/content';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/` },
};

// Tells search engines who the site is about. No contact details.
const PERSON = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  jobTitle: profile.jobTitle,
  description: profile.tagline,
  url: `${SITE_URL}/`,
  image: new URL(profile.imageUrl, SITE_URL).href,
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON) }} />
      <PortfolioClient portfolioItems={portfolioItems} workHistory={workHistory} profile={profile} />
      {/* "Fun or Standard?" — asked over the Standard page on a first visit. */}
      <ModeGate />
    </>
  );
}
