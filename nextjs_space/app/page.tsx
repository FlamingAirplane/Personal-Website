import { PortfolioClient } from '@/components/portfolio-client';
import { ModeGate } from '@/components/mode-gate';
import { portfolioItems, profile, workHistory } from '@/lib/content';

export default function HomePage() {
  return (
    <>
      <PortfolioClient portfolioItems={portfolioItems} workHistory={workHistory} profile={profile} />
      {/* "Fun or Standard?" — asked over the Standard page on a first visit. */}
      <ModeGate />
    </>
  );
}
