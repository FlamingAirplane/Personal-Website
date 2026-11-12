'use client';

import { useRef, useState } from 'react';
import { FileText, Loader2, Save, Upload, User } from 'lucide-react';
import type { Profile } from '@/lib/content';
import { withBase } from '@/lib/site';
import { Field, ImageField, PRIMARY_BUTTON, TextArea, type Previewer, type Uploader } from './fields';

/** Profile details, pictures and the resume. */
export function ProfilePanel({
  profile,
  busy,
  onSave,
  upload,
  preview,
}: {
  profile: Profile;
  busy: boolean;
  onSave: (profile: Profile, message: string) => void;
  upload: Uploader;
  preview: Previewer;
}) {
  const [draft, setDraft] = useState(profile);
  const [uploadingResume, setUploadingResume] = useState(false);
  const resumeInput = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setDraft({ ...draft, [key]: value });

  async function uploadResume(file?: File) {
    if (!file) return;
    setUploadingResume(true);
    const path = await upload(file);
    setUploadingResume(false);
    if (resumeInput.current) resumeInput.current.value = '';
    if (!path) return;
    const next = { ...draft, resumeUrl: path };
    setDraft(next);
    onSave(next, 'Admin: upload resume');
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1a2e38] rounded-xl p-6 border border-[#2a4a58]">
        <h2 className="text-lg font-bold text-[#94a348] mb-4 flex items-center gap-2">
          <User size={20} /> Profile
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name" value={draft.name} onChange={(v) => set('name', v)} />
          <Field label="Tagline" value={draft.tagline} onChange={(v) => set('tagline', v)} placeholder="Game Designer & Sound Designer attending SCAD" />
          <Field label="Strapline" value={draft.strapline} onChange={(v) => set('strapline', v)} placeholder="Corner of the Internet" hint="The small line under the big title." />
          <Field label="Job Title" value={draft.jobTitle} onChange={(v) => set('jobTitle', v)} hint="Used in search-engine results." />
          <Field label="Email" type="email" value={draft.email} onChange={(v) => set('email', v)} />
          <Field label="Phone" value={draft.phone} onChange={(v) => set('phone', v)} />
          <Field label="Twitter URL" value={draft.twitterUrl} onChange={(v) => set('twitterUrl', v)} placeholder="https://twitter.com/..." />
          <Field label="Instagram URL" value={draft.instagramUrl} onChange={(v) => set('instagramUrl', v)} placeholder="https://instagram.com/..." />
          <TextArea label="Bio" value={draft.bio} onChange={(v) => set('bio', v)} rows={4} placeholder="About yourself..." />
          <TextArea label="Expertise" value={draft.expertise} onChange={(v) => set('expertise', v)} rows={4} />
          <Field label="Skills" value={draft.skills.join(', ')} onChange={(v) => set('skills', v.split(',').map((s) => s.trim()).filter(Boolean))} hint="Separate with commas." />
          <Field label="Quote" value={draft.quote} onChange={(v) => set('quote', v)} hint="Leave empty to hide the quote box." />
          <div className="md:col-span-2">
            <ImageField label="Profile Picture" value={draft.imageUrl} onChange={(v) => set('imageUrl', v)} upload={upload} preview={preview} />
          </div>
          <div className="md:col-span-2">
            <ImageField label="Hero Background Image" value={draft.heroBgUrl} onChange={(v) => set('heroBgUrl', v)} upload={upload} preview={preview} />
          </div>
        </div>
        <button type="button" onClick={() => onSave(draft, 'Admin: update profile')} disabled={busy} className={`${PRIMARY_BUTTON} mt-5`}>
          <Save size={16} /> Save Profile
        </button>
      </div>

      <div className="bg-[#1a2e38] rounded-xl p-6 border border-[#2a4a58]">
        <h2 className="text-lg font-bold text-[#94a348] mb-4 flex items-center gap-2">
          <FileText size={20} /> Resume
        </h2>
        <p className="text-sm text-[#8a9a70] mb-4">
          {draft.resumeUrl ? 'A resume file is set. Upload a new one to replace it.' : 'No resume uploaded yet. The Download Resume button stays hidden.'}
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <button type="button" onClick={() => resumeInput.current?.click()} disabled={uploadingResume || busy} className={PRIMARY_BUTTON}>
            {uploadingResume ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploadingResume ? 'Uploading...' : 'Upload Resume (PDF)'}
          </button>
          {draft.resumeUrl && (
            <a href={preview(draft.resumeUrl) || withBase(draft.resumeUrl)} target="_blank" rel="noopener noreferrer" className="text-xs text-[#94a348] underline flex items-center gap-1">
              <FileText size={12} /> View current resume
            </a>
          )}
        </div>
        <input ref={resumeInput} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => uploadResume(e.target.files?.[0])} />
      </div>
    </div>
  );
}
