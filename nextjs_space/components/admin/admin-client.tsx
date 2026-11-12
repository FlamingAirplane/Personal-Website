'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Briefcase, Gamepad2, Loader2, LogOut, Music, Plus, SlidersVertical, User } from 'lucide-react';
import type { PortfolioItem, Profile, SiteContent, SiteSettings, WorkHistoryItem } from '@/lib/content';
import {
  ACTIONS_URL,
  checkToken,
  GitHubError,
  loadContent,
  readToken,
  rememberToken,
  saveContent,
  uploadFile,
} from '@/lib/github-content';
import { withBase } from '@/lib/site';
import { LoginCard } from './login-card';
import { PRIMARY_BUTTON, type Previewer, type Uploader } from './fields';
import { prepareImage } from './image-prep';
import { ProjectRows, WorkRows } from './list-rows';
import { ProfilePanel } from './profile-panel';
import { ProjectForm } from './project-form';
import { SettingsPanel } from './settings-panel';
import { WorkForm } from './work-form';

type Tab = 'game' | 'sound' | 'work' | 'profile' | 'settings';
type Notice = { kind: 'ok' | 'error'; text: string };

const TABS: { key: Tab; label: string; icon: typeof Gamepad2 }[] = [
  { key: 'game', label: 'Games', icon: Gamepad2 },
  { key: 'sound', label: 'Sound', icon: Music },
  { key: 'work', label: 'Work', icon: Briefcase },
  { key: 'profile', label: 'Profile & Resume', icon: User },
  { key: 'settings', label: 'Title, Particles & Cursor', icon: SlidersVertical },
];

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function ordered<T extends { sortOrder?: number }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (a.item.sortOrder ?? a.index) - (b.item.sortOrder ?? b.index) || a.index - b.index)
    .map(({ item }) => item);
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function firstSortOrder(items: { sortOrder?: number }[]): number {
  return items.length === 0 ? 0 : Math.min(...items.map((item, i) => item.sortOrder ?? i)) - 1;
}

/** The admin dashboard: edits site-content.json on GitHub, which republishes the site. */
export function AdminClient() {
  const [token, setToken] = useState('');
  const [content, setContent] = useState<SiteContent | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [tab, setTab] = useState<Tab>('game');
  const [project, setProject] = useState<PortfolioItem | null>(null);
  const [work, setWork] = useState<WorkHistoryItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const previews = useRef(new Map<string, string>());

  const preview: Previewer = (path) => previews.current.get(path) ?? withBase(path);

  const disconnect = useCallback(() => {
    rememberToken('');
    setToken('');
    setContent(null);
    setProject(null);
    setWork(null);
  }, []);

  const fail = useCallback(
    (error: unknown) => {
      if (error instanceof GitHubError && error.status === 401) disconnect();
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Something went wrong.' });
    },
    [disconnect],
  );

  const connect = useCallback(
    async (candidate: string) => {
      setConnecting(true);
      setNotice(null);
      try {
        await checkToken(candidate);
        const loaded = await loadContent(candidate);
        rememberToken(candidate);
        setToken(candidate);
        setContent(loaded.content);
      } catch (error) {
        fail(error);
      } finally {
        setConnecting(false);
      }
    },
    [fail],
  );

  useEffect(() => {
    const saved = readToken();
    if (saved) void connect(saved);
  }, [connect]);

  /** Applies a change on top of the newest content on GitHub and commits it. */
  async function commit(change: (current: SiteContent) => SiteContent, message: string): Promise<boolean> {
    setBusy(true);
    setNotice(null);
    try {
      const latest = await loadContent(token);
      const next = change(latest.content);
      await saveContent(token, next, latest.sha, message);
      setContent(next);
      setNotice({ kind: 'ok', text: 'Saved to GitHub. The site republishes in about a minute.' });
      return true;
    } catch (error) {
      fail(error);
      return false;
    } finally {
      setBusy(false);
    }
  }

  const upload: Uploader = async (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage && file.type !== 'application/pdf') {
      setNotice({ kind: 'error', text: 'Choose an image, or a PDF for the resume.' });
      return null;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setNotice({ kind: 'error', text: 'That file is over 10 MB.' });
      return null;
    }
    try {
      const blob = isImage ? await prepareImage(file) : file;
      const path = await uploadFile(token, blob, file.name);
      previews.current.set(path, URL.createObjectURL(blob));
      setNotice({ kind: 'ok', text: 'Uploaded. It goes live with the next save.' });
      return path;
    } catch (error) {
      fail(error);
      return null;
    }
  };

  function switchTab(next: Tab) {
    setTab(next);
    setProject(null);
    setWork(null);
    setNotice(null);
  }

  function startNew() {
    setNotice(null);
    setIsNew(true);
    if (tab === 'work') {
      setWork({ id: '', company: '', position: '', description: '', startDate: '', endDate: '', sortOrder: firstSortOrder(content?.workHistory ?? []) });
    } else {
      setProject({
        id: '',
        slug: '',
        title: '',
        category: '',
        description: '',
        imageUrl: '',
        projectLink: '#',
        year: new Date().getFullYear(),
        type: tab === 'sound' ? 'sound' : 'game',
        tags: '',
        sortOrder: firstSortOrder(content?.portfolioItems ?? []),
      });
    }
  }

  async function saveProject() {
    if (!project || !content) return;
    if (!project.title.trim() || !project.category.trim() || !project.year) {
      setNotice({ kind: 'error', text: 'Title, category and year are required.' });
      return;
    }
    const slug = project.slug || slugify(project.title) || `project-${Date.now()}`;
    if (content.portfolioItems.some((p) => p.slug === slug && p.id !== project.id)) {
      setNotice({ kind: 'error', text: `Another project already uses the slug "${slug}".` });
      return;
    }
    const youtubeUrl = project.youtubeUrl?.trim();
    const { youtubeUrl: _unused, ...rest } = project;
    const saved: PortfolioItem = {
      ...rest,
      ...(youtubeUrl ? { youtubeUrl } : {}),
      id: project.id || slug,
      slug,
      projectLink: project.projectLink.trim() || '#',
    };
    const ok = await commit(
      (current) => {
        const exists = current.portfolioItems.some((p) => p.id === saved.id);
        return {
          ...current,
          portfolioItems: exists
            ? current.portfolioItems.map((p) => (p.id === saved.id ? saved : p))
            : [...current.portfolioItems, saved],
        };
      },
      `Admin: ${isNew ? 'add' : 'update'} project "${saved.title}"`,
    );
    if (ok) setProject(null);
  }

  async function saveWork() {
    if (!work || !content) return;
    if (!work.company.trim() || !work.position.trim() || !work.startDate.trim()) {
      setNotice({ kind: 'error', text: 'Company, position and start date are required.' });
      return;
    }
    const saved: WorkHistoryItem = { ...work, id: work.id || `${slugify(work.company)}-${Date.now()}` };
    const ok = await commit(
      (current) => {
        const exists = current.workHistory.some((w) => w.id === saved.id);
        return {
          ...current,
          workHistory: exists ? current.workHistory.map((w) => (w.id === saved.id ? saved : w)) : [...current.workHistory, saved],
        };
      },
      `Admin: ${isNew ? 'add' : 'update'} work entry "${saved.company}"`,
    );
    if (ok) setWork(null);
  }

  async function removeProject(item: PortfolioItem) {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    await commit((c) => ({ ...c, portfolioItems: c.portfolioItems.filter((p) => p.id !== item.id) }), `Admin: delete project "${item.title}"`);
  }

  async function removeWork(item: WorkHistoryItem) {
    if (!window.confirm(`Delete "${item.company}"?`)) return;
    await commit((c) => ({ ...c, workHistory: c.workHistory.filter((w) => w.id !== item.id) }), `Admin: delete work entry "${item.company}"`);
  }

  const saveProfile = (profile: Profile, message: string) => commit((c) => ({ ...c, profile }), message);
  const saveSettings = (titleText: string, siteSettings: SiteSettings, message: string) =>
    commit((c) => ({ ...c, siteSettings, profile: { ...c.profile, siteName: titleText } }), message);

  if (!content) {
    return <LoginCard connecting={connecting} notice={notice} onConnect={connect} />;
  }

  const canAdd = (tab === 'game' || tab === 'sound' || tab === 'work') && !project && !work;

  return (
    <div className="min-h-screen bg-[#0a0c04] text-[#f3f7e4]">
      <div className="sticky top-0 z-10 bg-[#0d0f06]/95 backdrop-blur-sm border-b border-[#1a1e10]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a href={withBase('/')} aria-label="Back to the site" className="p-2 rounded-lg hover:bg-[#1a1e10] transition-colors">
              <ArrowLeft size={20} className="text-[#94a348]" />
            </a>
            <h1 className="text-xl font-bold text-[#94a348]">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            {canAdd && (
              <button type="button" onClick={startNew} disabled={busy} className={PRIMARY_BUTTON}>
                <Plus size={16} /> {tab === 'work' ? 'Add Work Entry' : 'Add Project'}
              </button>
            )}
            <button type="button" onClick={disconnect} className="p-2 rounded-lg hover:bg-[#1a1e10] text-[#c8d4a8]" aria-label="Disconnect from GitHub" title="Disconnect from GitHub">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => switchTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                tab === key ? 'bg-[#94a348] text-[#0a0c04]' : 'bg-[#1a2e38] text-[#c8d4a8] hover:bg-[#1a2e38]/80'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {notice && (
          <p
            role={notice.kind === 'error' ? 'alert' : 'status'}
            className={`mb-6 rounded-lg px-4 py-3 text-sm ${notice.kind === 'error' ? 'bg-red-500/15 text-red-300' : 'bg-[#94a348]/15 text-[#c8d4a8]'}`}
          >
            {notice.text}{' '}
            {notice.kind === 'ok' && (
              <a href={ACTIONS_URL} target="_blank" rel="noopener noreferrer" className="underline text-[#94a348]">
                Watch the publish
              </a>
            )}
          </p>
        )}
        {busy && (
          <div className="flex items-center gap-2 mb-4 text-sm text-[#8a9a70]">
            <Loader2 size={16} className="animate-spin" /> Saving to GitHub...
          </div>
        )}

        {(tab === 'game' || tab === 'sound') && project && (
          <ProjectForm item={project} isNew={isNew} busy={busy} onChange={setProject} onSave={saveProject} onCancel={() => setProject(null)} upload={upload} preview={preview} />
        )}
        {(tab === 'game' || tab === 'sound') && !project && (
          <ProjectRows
            items={ordered(content.portfolioItems).filter((p) => p.type === tab)}
            type={tab}
            preview={preview}
            onEdit={(item) => {
              setIsNew(false);
              setProject({ ...item });
            }}
            onDelete={removeProject}
          />
        )}

        {tab === 'work' && work && <WorkForm item={work} isNew={isNew} busy={busy} onChange={setWork} onSave={saveWork} onCancel={() => setWork(null)} />}
        {tab === 'work' && !work && (
          <WorkRows
            items={ordered(content.workHistory)}
            onEdit={(item) => {
              setIsNew(false);
              setWork({ ...item });
            }}
            onDelete={removeWork}
          />
        )}

        {tab === 'profile' && <ProfilePanel profile={content.profile} busy={busy} onSave={saveProfile} upload={upload} preview={preview} />}
        {tab === 'settings' && <SettingsPanel titleText={content.profile.siteName} settings={content.siteSettings} busy={busy} onSave={saveSettings} />}
      </div>
    </div>
  );
}
