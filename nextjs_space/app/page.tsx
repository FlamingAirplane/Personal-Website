import { prisma } from '@/lib/prisma';
import { PortfolioClient } from '@/components/portfolio-client';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let portfolioItems: any[] = [];
  let workHistory: any[] = [];
  let profile: any = null;

  try {
    portfolioItems = await prisma.portfolioItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { year: 'desc' }],
    });
  } catch (e: any) {
    console.error('Failed to fetch portfolio items:', e?.message);
  }

  try {
    workHistory = await prisma.workHistory.findMany({
      orderBy: [{ sortOrder: 'asc' }],
    });
  } catch (e: any) {
    console.error('Failed to fetch work history:', e?.message);
  }

  try {
    profile = await prisma.siteProfile.findFirst();
  } catch (e: any) {
    console.error('Failed to fetch profile:', e?.message);
  }

  return (
    <PortfolioClient
      portfolioItems={JSON.parse(JSON.stringify(portfolioItems ?? []))}
      workHistory={JSON.parse(JSON.stringify(workHistory ?? []))}
      profile={JSON.parse(JSON.stringify(profile ?? {}))}
    />
  );
}
