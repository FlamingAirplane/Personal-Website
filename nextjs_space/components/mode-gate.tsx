'use client';

import { useEffect, useRef, useState } from 'react';
import { readSiteMode, rememberSiteMode } from '@/lib/site-mode';
import { withBase } from '@/lib/site';

// checking: we have not looked up the visitor's earlier answer yet
// ask:      first visit, show the question
// standard: they chose Standard, show the page
// leaving:  on the way to the room
type Stage = 'checking' | 'ask' | 'standard' | 'leaving';

const ROOM_URL = withBase('/room/');

/**
 * The first-visit question, shown over the Standard site, plus the small
 * persistent control that lets a Standard visitor step into the room later.
 *
 * The page is static, so the remembered answer is only known once the
 * browser runs this. Until then a plain dark cover hides the page, so a
 * returning "Fun" visitor never sees the Standard site flash by.
 */
export function ModeGate() {
  const [stage, setStage] = useState<Stage>('checking');
  const funRef = useRef<HTMLButtonElement>(null);
  const standardRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mode = readSiteMode();
    if (mode === 'fun') {
      setStage('leaving');
      window.location.replace(ROOM_URL);
    } else {
      setStage(mode === 'standard' ? 'standard' : 'ask');
    }
  }, []);

  useEffect(() => {
    if (stage !== 'ask') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    funRef.current?.focus();

    // Keep Tab inside the question while it covers the page.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      const onFun = document.activeElement === funRef.current;
      (onFun ? standardRef : funRef).current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [stage]);

  const chooseFun = () => {
    rememberSiteMode('fun');
    setStage('leaving');
    window.location.assign(ROOM_URL);
  };

  const chooseStandard = () => {
    rememberSiteMode('standard');
    setStage('standard');
  };

  if (stage === 'standard') {
    return (
      <button
        type="button"
        onClick={chooseFun}
        className="fixed bottom-4 right-4 z-40 border border-[#2e3a1c] bg-[#0a0c04]/90 px-3 py-2 font-mono text-xs uppercase tracking-widest text-[#94a348] backdrop-blur-sm transition-colors hover:border-[#94a348] hover:text-[#f3f7e4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#94a348]"
      >
        Enter the room
      </button>
    );
  }

  if (stage !== 'ask') {
    return (
      <>
        {/* Without JavaScript there is no room, so show the Standard page. */}
        <noscript>
          <style>{'.mode-gate-cover{display:none}'}</style>
        </noscript>
        <div aria-hidden="true" className="mode-gate-cover fixed inset-0 z-[100] bg-[#05060a]" />
      </>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mode-gate-question"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#05060a] px-6 font-mono text-[#f3f7e4]"
    >
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#5a6a40]">Adine Johnson</p>
      <h2 id="mode-gate-question" className="text-center text-3xl tracking-tight sm:text-5xl">
        Fun or Standard?
      </h2>

      <div className="mt-10 flex w-full max-w-md flex-col gap-4 sm:flex-row">
        <button
          ref={funRef}
          type="button"
          onClick={chooseFun}
          className="flex-1 border border-[#94a348] bg-[#94a348] px-6 py-4 text-left text-[#0a0c04] transition-colors hover:bg-[#c8d4a8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8d4a8]"
        >
          <span className="block text-lg font-bold uppercase tracking-widest">Fun</span>
          <span className="mt-1 block text-xs opacity-80">Walk around a room</span>
        </button>
        <button
          ref={standardRef}
          type="button"
          onClick={chooseStandard}
          className="flex-1 border border-[#2e3a1c] px-6 py-4 text-left text-[#c8d4a8] transition-colors hover:border-[#94a348] hover:text-[#f3f7e4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#94a348]"
        >
          <span className="block text-lg font-bold uppercase tracking-widest">Standard</span>
          <span className="mt-1 block text-xs opacity-80">Scroll a normal page</span>
        </button>
      </div>

      <p className="mt-8 text-xs text-[#5a6a40]">You can switch at any time.</p>
    </div>
  );
}
