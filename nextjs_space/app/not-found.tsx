import Link from 'next/link';
import { EnterRoomLink } from '@/components/mode-gate';

export const metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#05060a] px-6 text-center font-mono text-[#f3f7e4]">
      <p className="text-xs uppercase tracking-[0.3em] text-[#8a9a70]">Error 404</p>
      <h1 className="mt-3 text-3xl tracking-tight sm:text-5xl">Nothing in this corner.</h1>
      <p className="mt-4 max-w-md text-sm text-[#c8d4a8]">
        The page you were after has moved or never existed.
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Link
          href="/"
          className="border border-[#94a348] bg-[#94a348] px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#0a0c04] transition-colors hover:bg-[#c8d4a8]"
        >
          Back to the site
        </Link>
        <EnterRoomLink className="border border-[#2e3a1c] px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#c8d4a8] transition-colors hover:border-[#94a348] hover:text-[#f3f7e4]" />
      </div>
    </main>
  );
}
