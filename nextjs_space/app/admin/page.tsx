'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Gamepad2, Music, Briefcase, Loader2, Upload, ImageIcon, Settings, FileText, User, Sliders } from 'lucide-react';
import Link from 'next/link';
import { toast, Toaster } from 'sonner';

/* ===== Types ===== */
interface PortfolioItem {
  id: string; title: string; category: string; description: string | null;
  imageUrl: string | null; projectLink: string | null; year: number;
  type: string; tags: string | null; sortOrder: number;
  slug: string | null; subpageContent: string | null; galleryImages: string | null;
}
interface WorkHistoryItem {
  id: string; company: string; position: string; description: string | null;
  startDate: string; endDate: string | null; sortOrder: number;
}
interface ProfileData {
  id: string; name: string; tagline: string | null; bio: string | null;
  email: string | null; phone: string | null; imageUrl: string | null;
  resumeCloudStoragePath: string | null; resumeIsPublic: boolean;
  twitterUrl: string | null; instagramUrl: string | null; heroBgUrl: string | null;
}
interface SiteSettingsData {
  id: string; particleMouseRadius: number; particlePushForce: number;
  particleReturnSpeed: number; particleFriction: number; particleGap: number;
  titleText: string;
  cursorEnabled: boolean; cursorSize: number; cursorHoverSize: number;
  cursorLag: number; cursorColorLight: string; cursorColorDark: string;
}

type ActiveTab = 'game' | 'sound' | 'work' | 'profile' | 'settings';

/* ===== Image Upload ===== */
async function uploadImageFile(file: File): Promise<string | null> {
  try {
    const presignRes = await fetch('/api/upload/presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentType: file.type, isPublic: true }),
    });
    const presignData = await presignRes.json();
    if (!presignData?.success) throw new Error('Presign failed');

    const { uploadUrl, cloud_storage_path } = presignData;
    const urlObj = new URL(uploadUrl);
    const signedHeaders = urlObj.searchParams.get('X-Amz-SignedHeaders') || '';
    const headers: Record<string, string> = { 'Content-Type': file.type };
    if (signedHeaders.includes('content-disposition')) headers['Content-Disposition'] = 'attachment';

    const uploadRes = await fetch(uploadUrl, { method: 'PUT', headers, body: file });
    if (!uploadRes.ok) throw new Error('Upload failed');

    const fileUrlRes = await fetch('/api/upload/get-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cloud_storage_path, isPublic: true, contentType: file.type }),
    });
    const fileUrlData = await fileUrlRes.json();
    return fileUrlData?.success ? fileUrlData.url : cloud_storage_path;
  } catch (err: any) {
    console.error('Upload error:', err);
    toast.error('Failed to upload file');
    return null;
  }
}

async function uploadResumeFile(file: File): Promise<{ path: string; url: string } | null> {
  try {
    const presignRes = await fetch('/api/upload/presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentType: file.type, isPublic: true }),
    });
    const presignData = await presignRes.json();
    if (!presignData?.success) throw new Error('Presign failed');

    const { uploadUrl, cloud_storage_path } = presignData;
    const urlObj = new URL(uploadUrl);
    const signedHeaders = urlObj.searchParams.get('X-Amz-SignedHeaders') || '';
    const headers: Record<string, string> = { 'Content-Type': file.type };
    if (signedHeaders.includes('content-disposition')) headers['Content-Disposition'] = 'attachment';

    const uploadRes = await fetch(uploadUrl, { method: 'PUT', headers, body: file });
    if (!uploadRes.ok) throw new Error('Upload failed');

    return { path: cloud_storage_path, url: cloud_storage_path };
  } catch (err: any) {
    console.error('Resume upload error:', err);
    toast.error('Failed to upload resume');
    return null;
  }
}

/* ===== Image Upload Button ===== */
function ImageUploadBtn({ currentUrl, onUploaded, label = 'Image' }: { currentUrl: string; onUploaded: (url: string) => void; label?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return; }
    setUploading(true);
    const url = await uploadImageFile(file);
    if (url) { onUploaded(url); toast.success('Uploaded!'); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-sm text-[#8a9a70] mb-1">{label}</label>
      <div className="flex items-center gap-3">
        {currentUrl ? (
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#0a0c04] flex-shrink-0">
            <img src={currentUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-lg bg-[#0a0c04] flex-shrink-0 flex items-center justify-center">
            <ImageIcon size={20} className="text-[#8a9a70]/40" />
          </div>
        )}
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 bg-[#1a1e10] text-[#c8d4a8] rounded-lg hover:bg-[#252a14] transition-colors text-sm disabled:opacity-50">
          {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><Upload size={14} /> Upload</>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
      <input type="text" value={currentUrl} onChange={(e) => onUploaded(e.target.value)}
        className="w-full mt-2 px-3 py-2 rounded-lg bg-[#0a0c04] border border-[#2a4a58] text-[#f3f7e4] text-sm focus:outline-none focus:border-[#94a348]" placeholder="Or paste URL..." />
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-[#8a9a70] mb-1">{label}{required && ' *'}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-[#0a0c04] border border-[#2a4a58] text-[#f3f7e4] text-sm focus:outline-none focus:border-[#94a348]" placeholder={placeholder} />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div className="md:col-span-2">
      <label className="block text-sm text-[#8a9a70] mb-1">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
        className="w-full px-3 py-2 rounded-lg bg-[#0a0c04] border border-[#2a4a58] text-[#f3f7e4] text-sm focus:outline-none focus:border-[#94a348] resize-none" placeholder={placeholder} />
    </div>
  );
}

/* ===== Main Admin ===== */
export default function AdminPage() {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [workItems, setWorkItems] = useState<WorkHistoryItem[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('game');
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioItem | null>(null);
  const [editingWork, setEditingWork] = useState<WorkHistoryItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const resumeRef = useRef<HTMLInputElement>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [pRes, wRes, prRes, ssRes] = await Promise.all([
        fetch('/api/portfolio'), fetch('/api/work-history'),
        fetch('/api/profile'), fetch('/api/site-settings'),
      ]);
      const [pData, wData, prData, ssData] = await Promise.all([pRes.json(), wRes.json(), prRes.json(), ssRes.json()]);
      setPortfolioItems(pData?.items ?? []);
      setWorkItems(wData?.items ?? []);
      setProfile(prData?.profile ?? null);
      setSiteSettings(ssData?.settings ?? null);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const cancelEdit = () => { setEditingPortfolio(null); setEditingWork(null); setIsNew(false); };
  const switchTab = (t: ActiveTab) => { setActiveTab(t); cancelEdit(); };

  const filteredPortfolio = portfolioItems.filter(i => i.type === activeTab);
  const isPortfolioTab = activeTab === 'game' || activeTab === 'sound';

  /* Portfolio CRUD */
  const handleNewPortfolio = () => {
    cancelEdit();
    setEditingPortfolio({ id: '', title: '', category: '', description: '', imageUrl: '', projectLink: '',
      year: new Date().getFullYear(), type: activeTab, tags: '', sortOrder: 0, slug: '', subpageContent: '', galleryImages: '[]' });
    setIsNew(true);
  };
  const handleEditPortfolio = (item: PortfolioItem) => { cancelEdit(); setEditingPortfolio({ ...item }); setIsNew(false); };
  const handleSavePortfolio = async () => {
    if (!editingPortfolio) return;
    if (!editingPortfolio.title || !editingPortfolio.category || !editingPortfolio.year) { toast.error('Title, category, and year are required'); return; }
    setSaving(true);
    try {
      const url = isNew ? '/api/portfolio' : `/api/portfolio/${editingPortfolio.id}`;
      const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingPortfolio) });
      const data = await res.json();
      if (data?.success) { toast.success(isNew ? 'Created!' : 'Updated!'); cancelEdit(); await fetchAll(); }
      else toast.error(data?.error || 'Failed');
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };
  const handleDeletePortfolio = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    try { const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' }); const d = await res.json();
      if (d?.success) { toast.success('Deleted'); await fetchAll(); } else toast.error('Failed');
    } catch { toast.error('Failed'); }
  };

  /* Work History CRUD */
  const handleNewWork = () => {
    cancelEdit();
    setEditingWork({ id: '', company: '', position: '', description: '', startDate: '', endDate: '', sortOrder: 0 });
    setIsNew(true);
  };
  const handleEditWork = (item: WorkHistoryItem) => { cancelEdit(); setEditingWork({ ...item }); setIsNew(false); };
  const handleSaveWork = async () => {
    if (!editingWork) return;
    if (!editingWork.company || !editingWork.position || !editingWork.startDate) { toast.error('Company, position, start date required'); return; }
    setSaving(true);
    try {
      const url = isNew ? '/api/work-history' : `/api/work-history/${editingWork.id}`;
      const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingWork) });
      const data = await res.json();
      if (data?.success) { toast.success(isNew ? 'Created!' : 'Updated!'); cancelEdit(); await fetchAll(); }
      else toast.error(data?.error || 'Failed');
    } catch { toast.error('Failed'); } finally { setSaving(false); }
  };
  const handleDeleteWork = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    try { const res = await fetch(`/api/work-history/${id}`, { method: 'DELETE' }); const d = await res.json();
      if (d?.success) { toast.success('Deleted'); await fetchAll(); } else toast.error('Failed');
    } catch { toast.error('Failed'); }
  };

  /* Profile Save */
  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
      const data = await res.json();
      if (data?.success) { toast.success('Profile saved!'); setProfile(data.profile); }
      else toast.error('Failed');
    } catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  /* Resume Upload */
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeUploading(true);
    const result = await uploadResumeFile(file);
    if (result && profile) {
      const updated = { ...profile, resumeCloudStoragePath: result.path, resumeIsPublic: true };
      setProfile(updated);
      // Save to DB immediately
      await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
      toast.success('Resume uploaded!');
    }
    setResumeUploading(false);
    if (resumeRef.current) resumeRef.current.value = '';
  };

  /* Settings Save */
  const handleSaveSettings = async () => {
    if (!siteSettings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/site-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(siteSettings) });
      const data = await res.json();
      if (data?.success) { toast.success('Settings saved! Reload the site to see changes.'); setSiteSettings(data.settings); }
      else toast.error('Failed');
    } catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  /* Gallery management helpers */
  const getGalleryImages = (): string[] => {
    try { return JSON.parse(editingPortfolio?.galleryImages || '[]'); } catch { return []; }
  };
  const setGalleryImages = (imgs: string[]) => {
    if (!editingPortfolio) return;
    setEditingPortfolio({ ...editingPortfolio, galleryImages: JSON.stringify(imgs) });
  };
  const addGalleryImage = async (file: File) => {
    const url = await uploadImageFile(file);
    if (url) {
      const imgs = getGalleryImages();
      imgs.push(url);
      setGalleryImages(imgs);
      toast.success('Gallery image added!');
    }
  };
  const removeGalleryImage = (index: number) => {
    const imgs = getGalleryImages();
    imgs.splice(index, 1);
    setGalleryImages(imgs);
  };

  const galleryRef = useRef<HTMLInputElement>(null);

  const TABS = [
    { key: 'game' as ActiveTab, label: 'Games', icon: Gamepad2 },
    { key: 'sound' as ActiveTab, label: 'Sound', icon: Music },
    { key: 'work' as ActiveTab, label: 'Work', icon: Briefcase },
    { key: 'profile' as ActiveTab, label: 'Profile & Resume', icon: User },
    { key: 'settings' as ActiveTab, label: 'Title, Particles & Cursor', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-[#0a0c04] text-[#f3f7e4]">
      <Toaster position="top-right" theme="dark" />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0d0f06]/95 backdrop-blur-sm border-b border-[#1a1e10]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-lg hover:bg-[#1a1e10] transition-colors"><ArrowLeft size={20} className="text-[#94a348]" /></Link>
            <h1 className="text-xl font-bold text-[#94a348]">Admin Dashboard</h1>
          </div>
          {(isPortfolioTab || activeTab === 'work') && (
            <button onClick={isPortfolioTab ? handleNewPortfolio : handleNewWork}
              className="flex items-center gap-2 px-4 py-2 bg-[#94a348] text-[#0a0c04] font-semibold rounded-lg hover:bg-[#a8b850] transition-colors text-sm">
              <Plus size={16} /> {isPortfolioTab ? 'Add Project' : 'Add Work Entry'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => switchTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${activeTab === tab.key ? 'bg-[#94a348] text-[#0a0c04]' : 'bg-[#1a2e38] text-[#c8d4a8] hover:bg-[#1a2e38]/80'}`}>
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-[#94a348]" /></div>
        ) : (
          <>
            {/* ===== PORTFOLIO FORM ===== */}
            {isPortfolioTab && editingPortfolio && (
              <div className="bg-[#1a2e38] rounded-xl p-6 mb-6 border border-[#2a4a58]">
                <h2 className="text-lg font-bold text-[#94a348] mb-4">{isNew ? 'New Project' : 'Edit Project'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Title" value={editingPortfolio.title} onChange={v => setEditingPortfolio({ ...editingPortfolio, title: v })} placeholder="Project title" required />
                  <InputField label="Category" value={editingPortfolio.category} onChange={v => setEditingPortfolio({ ...editingPortfolio, category: v })} placeholder="e.g. FPS, Platformer" required />
                  <InputField label="Year" value={String(editingPortfolio.year)} onChange={v => setEditingPortfolio({ ...editingPortfolio, year: parseInt(v) || 0 })} type="number" required />
                  <div>
                    <label className="block text-sm text-[#8a9a70] mb-1">Type</label>
                    <select value={editingPortfolio.type} onChange={e => setEditingPortfolio({ ...editingPortfolio, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0a0c04] border border-[#2a4a58] text-[#f3f7e4] text-sm focus:outline-none focus:border-[#94a348]">
                      <option value="game">Game</option><option value="sound">Sound</option>
                    </select>
                  </div>
                  <TextAreaField label="Description" value={editingPortfolio.description || ''} onChange={v => setEditingPortfolio({ ...editingPortfolio, description: v })} placeholder="Short description..." />
                  <div className="md:col-span-2">
                    <ImageUploadBtn currentUrl={editingPortfolio.imageUrl || ''} onUploaded={url => setEditingPortfolio({ ...editingPortfolio, imageUrl: url })} label="Cover Image" />
                  </div>
                  <InputField label="Project Link" value={editingPortfolio.projectLink || ''} onChange={v => setEditingPortfolio({ ...editingPortfolio, projectLink: v })} placeholder="https://cdn.sanity.io/images/8zqcc24c/production/55ac70f55bffb8c7650f13e8a5863bc8012f44bc-2720x2376.png?fit=max&auto=format" />
                  <InputField label="Tags" value={editingPortfolio.tags || ''} onChange={v => setEditingPortfolio({ ...editingPortfolio, tags: v })} placeholder="Unity, C#, 3D" />
                  <InputField label="URL Slug (for subpage)" value={editingPortfolio.slug || ''} onChange={v => setEditingPortfolio({ ...editingPortfolio, slug: v.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} placeholder="my-project" />
                  <InputField label="Sort Order" value={String(editingPortfolio.sortOrder)} onChange={v => setEditingPortfolio({ ...editingPortfolio, sortOrder: parseInt(v) || 0 })} type="number" />

                  {/* Subpage Content */}
                  <div className="md:col-span-2">
                    <label className="block text-sm text-[#8a9a70] mb-1">Subpage Content (Markdown-style)</label>
                    <p className="text-xs text-[#8a9a70]/60 mb-2">Use ## for headings, ### for subheadings, - for bullet points. Only shown when a slug is set.</p>
                    <textarea value={editingPortfolio.subpageContent || ''} onChange={e => setEditingPortfolio({ ...editingPortfolio, subpageContent: e.target.value })} rows={8}
                      className="w-full px-3 py-2 rounded-lg bg-[#0a0c04] border border-[#2a4a58] text-[#f3f7e4] text-sm focus:outline-none focus:border-[#94a348] resize-y font-mono" placeholder="## About This Project\n\nDetailed description..." />
                  </div>

                  {/* Gallery */}
                  <div className="md:col-span-2">
                    <label className="block text-sm text-[#8a9a70] mb-2">Gallery Images</label>
                    <div className="flex flex-wrap gap-3 mb-3">
                      {getGalleryImages().map((url, i) => (
                        <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden bg-[#0a0c04] group">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => removeGalleryImage(i)}
                            className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={12} className="text-white" />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => galleryRef.current?.click()}
                        className="w-24 h-24 rounded-lg border-2 border-dashed border-[#2a4a58] flex items-center justify-center hover:border-[#94a348] transition-colors">
                        <Plus size={24} className="text-[#8a9a70]" />
                      </button>
                    </div>
                    <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await addGalleryImage(file);
                      if (galleryRef.current) galleryRef.current.value = '';
                    }} />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={handleSavePortfolio} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 bg-[#94a348] text-[#0a0c04] font-semibold rounded-lg hover:bg-[#a8b850] text-sm disabled:opacity-50">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={cancelEdit} className="flex items-center gap-2 px-5 py-2 bg-[#1a1e10] text-[#c8d4a8] rounded-lg hover:bg-[#252a14] text-sm"><X size={16} /> Cancel</button>
                </div>
              </div>
            )}

            {/* ===== WORK FORM ===== */}
            {activeTab === 'work' && editingWork && (
              <div className="bg-[#1a2e38] rounded-xl p-6 mb-6 border border-[#2a4a58]">
                <h2 className="text-lg font-bold text-[#94a348] mb-4">{isNew ? 'New Work Entry' : 'Edit Work Entry'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Company" value={editingWork.company} onChange={v => setEditingWork({ ...editingWork, company: v })} placeholder="Company name" required />
                  <InputField label="Position" value={editingWork.position} onChange={v => setEditingWork({ ...editingWork, position: v })} placeholder="Job title" required />
                  <InputField label="Start Date" value={editingWork.startDate} onChange={v => setEditingWork({ ...editingWork, startDate: v })} placeholder="Jan 2024" required />
                  <InputField label="End Date" value={editingWork.endDate || ''} onChange={v => setEditingWork({ ...editingWork, endDate: v })} placeholder="Present" />
                  <TextAreaField label="Description" value={editingWork.description || ''} onChange={v => setEditingWork({ ...editingWork, description: v })} placeholder="Role description..." />
                  <InputField label="Sort Order" value={String(editingWork.sortOrder)} onChange={v => setEditingWork({ ...editingWork, sortOrder: parseInt(v) || 0 })} type="number" />
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={handleSaveWork} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 bg-[#94a348] text-[#0a0c04] font-semibold rounded-lg hover:bg-[#a8b850] text-sm disabled:opacity-50">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={cancelEdit} className="flex items-center gap-2 px-5 py-2 bg-[#1a1e10] text-[#c8d4a8] rounded-lg hover:bg-[#252a14] text-sm"><X size={16} /> Cancel</button>
                </div>
              </div>
            )}

            {/* ===== LISTS ===== */}
            {isPortfolioTab && !editingPortfolio && (
              filteredPortfolio.length === 0 ? (
                <div className="text-center py-20"><p className="text-[#8a9a70] text-lg">No {activeTab} projects yet</p></div>
              ) : (
                <div className="space-y-3">
                  {filteredPortfolio.map(item => (
                    <div key={item.id} className="bg-[#1a2e38] rounded-xl p-4 flex items-center gap-4 group hover:bg-[#1a2e38]/80 transition-colors">
                      {item.imageUrl ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#0a0c04] flex-shrink-0"><img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" /></div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-[#0a0c04] flex-shrink-0 flex items-center justify-center">{activeTab === 'game' ? <Gamepad2 size={24} className="text-[#8a9a70]/40" /> : <Music size={24} className="text-[#8a9a70]/40" />}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#f3f7e4] truncate">{item.title}</h3>
                        <p className="text-sm text-[#8a9a70]">{item.category} · {item.year}{item.slug ? ` · /projects/${item.slug}` : ''}</p>
                      </div>
                      <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditPortfolio(item)} className="p-2 rounded-lg hover:bg-[#94a348]/20 text-[#94a348]"><Pencil size={16} /></button>
                        <button onClick={() => handleDeletePortfolio(item.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'work' && !editingWork && (
              workItems.length === 0 ? (
                <div className="text-center py-20"><p className="text-[#8a9a70] text-lg">No work history yet</p></div>
              ) : (
                <div className="space-y-3">
                  {workItems.map(item => (
                    <div key={item.id} className="bg-[#1a2e38] rounded-xl p-4 flex items-center gap-4 group hover:bg-[#1a2e38]/80 transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-[#0a0c04] flex-shrink-0 flex items-center justify-center"><Briefcase size={20} className="text-[#8a9a70]/40" /></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#f3f7e4] truncate">{item.company}</h3>
                        <p className="text-sm text-[#94a348]">{item.position}</p>
                        <p className="text-xs text-[#8a9a70]">{item.startDate}{item.endDate ? ` – ${item.endDate}` : ''}</p>
                      </div>
                      <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditWork(item)} className="p-2 rounded-lg hover:bg-[#94a348]/20 text-[#94a348]"><Pencil size={16} /></button>
                        <button onClick={() => handleDeleteWork(item.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ===== PROFILE & RESUME ===== */}
            {activeTab === 'profile' && profile && (
              <div className="space-y-6">
                <div className="bg-[#1a2e38] rounded-xl p-6 border border-[#2a4a58]">
                  <h2 className="text-lg font-bold text-[#94a348] mb-4 flex items-center gap-2"><User size={20} /> Profile</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Name" value={profile.name || ''} onChange={v => setProfile({ ...profile, name: v })} />
                    <InputField label="Tagline" value={profile.tagline || ''} onChange={v => setProfile({ ...profile, tagline: v })} placeholder="Corner of the Internet" />
                    <InputField label="Email" value={profile.email || ''} onChange={v => setProfile({ ...profile, email: v })} type="email" />
                    <InputField label="Phone" value={profile.phone || ''} onChange={v => setProfile({ ...profile, phone: v })} />
                    <InputField label="Twitter URL" value={profile.twitterUrl || ''} onChange={v => setProfile({ ...profile, twitterUrl: v })} placeholder="https://twitter.com/..." />
                    <InputField label="Instagram URL" value={profile.instagramUrl || ''} onChange={v => setProfile({ ...profile, instagramUrl: v })} placeholder="https://instagram.com/..." />
                    <TextAreaField label="Bio" value={profile.bio || ''} onChange={v => setProfile({ ...profile, bio: v })} rows={4} placeholder="About yourself..." />
                    <div className="md:col-span-2">
                      <ImageUploadBtn currentUrl={profile.imageUrl || ''} onUploaded={url => setProfile({ ...profile, imageUrl: url })} label="Profile Picture" />
                    </div>
                    <div className="md:col-span-2">
                      <ImageUploadBtn currentUrl={profile.heroBgUrl || ''} onUploaded={url => setProfile({ ...profile, heroBgUrl: url })} label="Hero Background Image" />
                    </div>
                  </div>
                  <button onClick={handleSaveProfile} disabled={saving}
                    className="flex items-center gap-2 mt-5 px-5 py-2 bg-[#94a348] text-[#0a0c04] font-semibold rounded-lg hover:bg-[#a8b850] text-sm disabled:opacity-50">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Profile
                  </button>
                </div>

                {/* Resume Upload */}
                <div className="bg-[#1a2e38] rounded-xl p-6 border border-[#2a4a58]">
                  <h2 className="text-lg font-bold text-[#94a348] mb-4 flex items-center gap-2"><FileText size={20} /> Resume</h2>
                  <p className="text-sm text-[#8a9a70] mb-4">
                    {profile.resumeCloudStoragePath ? 'A resume file is currently uploaded. Upload a new one to replace it.' : 'No resume uploaded yet.'}
                  </p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => resumeRef.current?.click()} disabled={resumeUploading}
                      className="flex items-center gap-2 px-4 py-2 bg-[#94a348] text-[#0a0c04] font-semibold rounded-lg hover:bg-[#a8b850] text-sm disabled:opacity-50">
                      {resumeUploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><Upload size={14} /> Upload Resume (PDF)</>}
                    </button>
                    {profile.resumeCloudStoragePath && (
                      <span className="text-xs text-[#8a9a70] flex items-center gap-1"><FileText size={12} /> Resume uploaded</span>
                    )}
                  </div>
                  <input ref={resumeRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
                </div>
              </div>
            )}

            {/* ===== SITE SETTINGS ===== */}
            {activeTab === 'settings' && siteSettings && (
              <div className="bg-[#1a2e38] rounded-xl p-6 border border-[#2a4a58]">
                <h2 className="text-lg font-bold text-[#94a348] mb-4 flex items-center gap-2"><Sliders size={20} /> Title & Particle Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Title Text" value={siteSettings.titleText} onChange={v => setSiteSettings({ ...siteSettings, titleText: v })} placeholder="Adine." />
                  <div>
                    <label className="block text-sm text-[#8a9a70] mb-1">Mouse Radius ({siteSettings.particleMouseRadius}px)</label>
                    <input type="range" min="20" max="200" value={siteSettings.particleMouseRadius}
                      onChange={e => setSiteSettings({ ...siteSettings, particleMouseRadius: parseInt(e.target.value) })}
                      className="w-full accent-[#94a348]" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#8a9a70] mb-1">Push Force ({siteSettings.particlePushForce})</label>
                    <input type="range" min="1" max="20" value={siteSettings.particlePushForce}
                      onChange={e => setSiteSettings({ ...siteSettings, particlePushForce: parseInt(e.target.value) })}
                      className="w-full accent-[#94a348]" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#8a9a70] mb-1">Return Speed ({siteSettings.particleReturnSpeed}%)</label>
                    <input type="range" min="1" max="20" value={siteSettings.particleReturnSpeed}
                      onChange={e => setSiteSettings({ ...siteSettings, particleReturnSpeed: parseInt(e.target.value) })}
                      className="w-full accent-[#94a348]" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#8a9a70] mb-1">Friction ({siteSettings.particleFriction}%)</label>
                    <input type="range" min="50" max="99" value={siteSettings.particleFriction}
                      onChange={e => setSiteSettings({ ...siteSettings, particleFriction: parseInt(e.target.value) })}
                      className="w-full accent-[#94a348]" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#8a9a70] mb-1">Particle Gap ({siteSettings.particleGap}px)</label>
                    <input type="range" min="1" max="8" value={siteSettings.particleGap}
                      onChange={e => setSiteSettings({ ...siteSettings, particleGap: parseInt(e.target.value) })}
                      className="w-full accent-[#94a348]" />
                  </div>
                </div>
                <button onClick={handleSaveSettings} disabled={saving}
                  className="flex items-center gap-2 mt-5 px-5 py-2 bg-[#94a348] text-[#0a0c04] font-semibold rounded-lg hover:bg-[#a8b850] text-sm disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Settings
                </button>

                {/* Cursor Settings */}
                <h2 className="text-lg font-bold text-[#94a348] mt-8 mb-4 flex items-center gap-2"><Settings size={20} /> Custom Cursor Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 flex items-center gap-3">
                    <label className="text-sm text-[#8a9a70]">Cursor Enabled</label>
                    <button
                      onClick={() => setSiteSettings({ ...siteSettings, cursorEnabled: !siteSettings.cursorEnabled })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${siteSettings.cursorEnabled ? 'bg-[#94a348]' : 'bg-[#1a1e10]'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${siteSettings.cursorEnabled ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm text-[#8a9a70] mb-1">Default Size ({siteSettings.cursorSize}px)</label>
                    <input type="range" min="4" max="30" value={siteSettings.cursorSize}
                      onChange={e => setSiteSettings({ ...siteSettings, cursorSize: parseInt(e.target.value) })}
                      className="w-full accent-[#94a348]" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#8a9a70] mb-1">Hover Size ({siteSettings.cursorHoverSize}px)</label>
                    <input type="range" min="15" max="80" value={siteSettings.cursorHoverSize}
                      onChange={e => setSiteSettings({ ...siteSettings, cursorHoverSize: parseInt(e.target.value) })}
                      className="w-full accent-[#94a348]" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#8a9a70] mb-1">Lag / Smoothness ({siteSettings.cursorLag}%)</label>
                    <input type="range" min="5" max="50" value={siteSettings.cursorLag}
                      onChange={e => setSiteSettings({ ...siteSettings, cursorLag: parseInt(e.target.value) })}
                      className="w-full accent-[#94a348]" />
                    <p className="text-xs text-[#8a9a70]/60 mt-1">Lower = more lag, Higher = snappier</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-[#8a9a70] mb-1">Color on Light BG</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={siteSettings.cursorColorLight}
                          onChange={e => setSiteSettings({ ...siteSettings, cursorColorLight: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer border border-[#2a4a58] bg-transparent" />
                        <span className="text-sm text-[#c8d4a8] font-mono">{siteSettings.cursorColorLight}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-[#8a9a70] mb-1">Color on Dark BG</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={siteSettings.cursorColorDark}
                          onChange={e => setSiteSettings({ ...siteSettings, cursorColorDark: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer border border-[#2a4a58] bg-transparent" />
                        <span className="text-sm text-[#c8d4a8] font-mono">{siteSettings.cursorColorDark}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={handleSaveSettings} disabled={saving}
                  className="flex items-center gap-2 mt-5 px-5 py-2 bg-[#94a348] text-[#0a0c04] font-semibold rounded-lg hover:bg-[#a8b850] text-sm disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Cursor Settings
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
