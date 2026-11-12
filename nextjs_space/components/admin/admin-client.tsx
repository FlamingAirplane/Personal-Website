'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Box, Briefcase, Eye, Gamepad2, Loader2, LogOut, Music, Plus, SlidersVertical, Undo2, Upload, User } from 'lucide-react';
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
import { PREVIEW_PATH, readDraft, writeDraft } from '@/lib/preview';
import { withBase } from '@/lib/site';
import { withRoomDefaults, type RoomSettings } from '@/lib/room/room-defaults';
import { LoginCard } from './login-card';
import { PRIMARY_BUTTON, type Previewer, type Uploader } from './fields';
import { prepareImage } from './image-prep';
import { ProjectRows, WorkRows } from './list-rows';
import { ProfilePanel } from './profile-panel';
import { ProjectForm } from './project-form';
import { RoomSettingsPanel } from './room-panel';
import { SettingsPanel } from './settings-panel';
import { WorkForm } from './work-form';

type Tab = 'game' | 'sound' | 'work' | 'profile' | 'settings' | 'room';
type Notice = { kind: 'ok' | 'error'; text: string };

const TABS: { key: Tab; label: string; icon: typeof Gamepad2 }[] = [
  { key: 'game', label: 'Games', icon: Gamepad2 },
  { key: 'sound', label: 'Sound', icon: Music },
  { key: 'work', label: 'Work', icon: Briefcase },
  { key: 'profile', label: 'Profile & Resume', icon: User },
  { key: 'settings', label: 'Title, Particles & Cursor', icon: SlidersVertical },
  { key: 'room', label: 'Room', icon: Box },
];

function normalise(content: SiteContent): SiteContent {
  return { ...content, roomSettings: withRoomDefaults(content.roomSettings) };
}

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
  const [published, setPublished] = useState<SiteContent | null>(null);
  const [publishedSha, setPublishedSha] = useState('');
  const [content, setContent] = useState<SiteContent | null>(null);
  const [baseSha, setBaseSha] = useState('');
  const [changes, setChanges] = useState<string[]>([]);
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
    setPublished(null);
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
        const stored = readDraft();
        rememberToken(candidate);
        setToken(candidate);
        const live = normalise(loaded.content);
        setPublished(live);
        setPublishedSha(loaded.sha);
        setContent(stored ? normalise(stored.content) : live);
        setBaseSha(stored?.baseSha ?? loaded.sha);
        if (stored) setNotice({ kind: 'ok', text: 'Your unpublished draft from last time is back. Preview it, then Publish.' });
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

  /** Applies a change to the draft. Nothing reaches the site until Publish. */
  async function commit(change: (current: SiteContent) => SiteContent, message: string): Promise<boolean> {
    if (!content || !published) return false;
    const next = change(content);
    const isPublished = JSON.stringify(next) === JSON.stringify(published);
    setContent(next);
    writeDraft(isPublished ? null : { content: next, baseSha });
    setChanges((list) => (isPublished ? [] : [...list, message.replace(/^Admin: /, '')]));
    setNotice({ kind: 'ok', text: 'Saved to your draft. Preview it, then Publish to put it on the site.' });
    return true;
  }

  async function publish() {
    if (!content) return;
    setBusy(true);
    setNotice(null);
    try {
      const latest = await loadContent(token);
      if (
        latest.sha !== baseSha &&
        !window.confirm('The content on GitHub changed after you started this draft. Publishing replaces it with your draft. Continue?')
      ) {
        return;
      }
      const summary = changes.length ? `\n\n${changes.map((c) => `- ${c}`).join('\n')}` : '';
      const sha = await saveContent(token, content, latest.sha, `Admin: publish changes${summary}`);
      setPublished(content);
      setPublishedSha(sha);
      setBaseSha(sha);
      setChanges([]);
      writeDraft(null);
      setNotice({ kind: 'ok', text: 'Published to GitHub. The site republishes in about a minute.' });
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  }

  function discard() {
    if (!published || !window.confirm('Throw away all unpublished changes?')) return;
    setContent(published);
    setBaseSha(publishedSha);
    setChanges([]);
    setProject(null);
    setWork(null);
    writeDraft(null);
    setNotice({ kind: 'ok', text: 'Draft discarded.' });
  }

  function openPreview(view?: 'room') {
    window.open(withBase(view ? `${PREVIEW_PATH}?view=${view}` : PREVIEW_PATH), 'admin-preview');
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
      setNotice({ kind: 'ok', text: 'Uploaded. Save to add it to your draft.' });
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

  const saveRoom = (roomSettings: RoomSettings, message: string) => commit((c) => ({ ...c, roomSettings }), message);
  const saveProfile = (profile: Profile, message: string) => commit((c) => ({ ...c, profile }), message);
  const saveSettings = (titleText: string, siteSettings: SiteSettings, message: string) =>
    commit((c) => ({ ...c, siteSettings, profile: { ...c.profile, siteName: titleText } }), message);

  if (!content) {
    return <LoginCard connecting={connecting} notice={notice} onConnect={connect} />;
  }

  const canAdd = (tab === 'game' || tab === 'sound' || tab === 'work') && !project && !work;
  const dirty = JSON.stringify(content) !== JSON.stringify(published);

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
            <button type="button" onClick={() => openPreview()} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-[#1a2e38] text-[#c8d4a8] hover:bg-[#1a2e38]/80" title="See the site with your draft">
              <Eye size={16} /> Preview
            </button>
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

        {dirty && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#94a348]/50 bg-[#94a348]/10 px-4 py-3 text-sm">
            <span className="text-[#c8d4a8]">
              You have unpublished changes{changes.length ? ` (${changes.length})` : ''}. Preview them, then Publish.
            </span>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => openPreview()} className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold bg-[#1a2e38] text-[#c8d4a8] hover:bg-[#1a2e38]/80">
                <Eye size={16} /> Preview
              </button>
              <button type="button" onClick={discard} disabled={busy} className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold bg-[#1a2e38] text-[#c8d4a8] hover:bg-[#1a2e38]/80 disabled:opacity-50">
                <Undo2 size={16} /> Discard
              </button>
              <button type="button" onClick={publish} disabled={busy} className={PRIMARY_BUTTON}>
                <Upload size={16} /> Publish
              </button>
            </div>
          </div>
        )}

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
            <Loader2 size={16} className="animate-spin" /> Publishing to GitHub...
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
        {tab === 'room' && <RoomSettingsPanel settings={content.roomSettings} busy={busy} onSave={saveRoom} onPreview={() => openPreview('room')} />}
        {tab === 'settings' && <SettingsPanel titleText={content.profile.siteName} settings={content.siteSettings} busy={busy} onSave={saveSettings} />}
      </div>
    </div>
  );
}
