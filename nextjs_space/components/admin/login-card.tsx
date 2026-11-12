'use client';

import { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { BRANCH, REPO_NAME, REPO_OWNER, TOKEN_URL } from '@/lib/github-content';
import { INPUT, PRIMARY_BUTTON } from './fields';

/** Asks for the GitHub token that lets this page save changes. */
export function LoginCard({
  connecting,
  notice,
  onConnect,
}: {
  connecting: boolean;
  notice: { kind: 'ok' | 'error'; text: string } | null;
  onConnect: (token: string) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <div className="min-h-screen bg-[#0a0c04] text-[#f3f7e4] flex items-center justify-center px-4">
      <form
        className="w-full max-w-md bg-[#1a2e38] rounded-xl p-6 border border-[#2a4a58]"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onConnect(value.trim());
        }}
      >
        <h1 className="text-xl font-bold text-[#94a348] mb-2 flex items-center gap-2">
          <KeyRound size={20} /> Admin Dashboard
        </h1>
        <p className="text-sm text-[#c8d4a8] mb-4">
          This site has no server, so changes are saved by committing to <code>{REPO_OWNER}/{REPO_NAME}</code> on GitHub ({BRANCH} branch). The site then republishes itself.
          Connect with a GitHub token to begin.
        </p>
        <ol className="text-xs text-[#8a9a70] list-decimal ml-4 mb-4 space-y-1">
          <li>
            <a href={TOKEN_URL} target="_blank" rel="noopener noreferrer" className="underline text-[#94a348]">
              Create a fine-grained token
            </a>{' '}
            on GitHub.
          </li>
          <li>
            Repository access: only <strong>{REPO_NAME}</strong>. Permissions: <strong>Contents &mdash; Read and write</strong>.
          </li>
          <li>Paste it below. It stays in this browser tab only and is forgotten when you close the tab.</li>
        </ol>
        <label htmlFor="admin-token" className="block text-sm text-[#8a9a70] mb-1">
          GitHub token
        </label>
        <input
          id="admin-token"
          type="password"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={INPUT}
          placeholder="github_pat_..."
        />
        {notice && (
          <p role="alert" className="mt-3 text-sm text-red-300">
            {notice.text}
          </p>
        )}
        <button type="submit" disabled={connecting || !value.trim()} className={`${PRIMARY_BUTTON} mt-4`}>
          {connecting ? <Loader2 size={16} className="animate-spin" /> : null} {connecting ? 'Connecting...' : 'Connect'}
        </button>
      </form>
    </div>
  );
}
