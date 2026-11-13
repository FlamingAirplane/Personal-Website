'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Pause, Play, Power, Square, Upload, Volume2, VolumeX, X } from 'lucide-react';
import { youtubeId } from '@/lib/content';
import { useAsset, useSiteContent } from '@/lib/preview';
import { RS } from '@/lib/room/room-settings';
import type { TvVideo } from '@/lib/room/room-defaults';

const LINK = 'text-[#94a348] underline hover:text-[#f3f7e4]';
const BUTTON =
  'flex items-center gap-1 border border-[#2e3a1c] px-2 py-1 text-xs text-[#c8d4a8] hover:border-[#94a348] hover:text-[#f3f7e4]';

const VIDEO_FILE = /\.(mp4|m4v|webm|ogv|ogg|mov)(\?|#|$)/i;

/** An address a page can be shown in a frame with, for links that are not video files. */
function embedAddress(url: string): string {
  const yt = youtubeId(url);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;
  return url;
}

type Playing =
  /** A video file shown on the TV in the room. */
  | { kind: 'file'; title: string; src: string; local: boolean }
  /** A link shown in a player in front of the room (pages cannot be drawn into 3D). */
  | { kind: 'embed'; title: string; src: string; original: string };

/**
 * The TV's menu and player. Stays mounted while the TV is on, so a video keeps
 * playing when the menu is closed.
 */
export function TvPanel({
  menuOpen,
  onCloseMenu,
  onPowerOff,
  onVideo,
  onStandby,
  onWatch,
}: {
  menuOpen: boolean;
  onCloseMenu: () => void;
  onPowerOff: () => void;
  /** The video element to draw on the TV, or null. */
  onVideo: (video: HTMLVideoElement | null) => void;
  onStandby: (text: string) => void;
  /** Walk to the spot in front of the TV. */
  onWatch: () => void;
}) {
  const { portfolioItems, roomSettings } = useSiteContent();
  const asset = useAsset();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [playing, setPlaying] = useState<Playing | null>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [link, setLink] = useState('');
  const [error, setError] = useState<string | null>(null);

  const videos = useMemo<TvVideo[]>(() => {
    const list = roomSettings.tvVideos.filter((v) => v.url.trim());
    if (roomSettings.tvIncludeProjects) {
      for (const item of portfolioItems) {
        if (item.youtubeUrl) list.push({ title: item.title, url: item.youtubeUrl });
      }
    }
    return list;
  }, [portfolioItems, roomSettings]);

  const resolve = (url: string) => (url.startsWith('/') ? asset(url) : url);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, onCloseMenu]);

  useEffect(
    () => () => {
      onVideo(null);
    },
    [onVideo],
  );

  const stop = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    if (playing?.kind === 'file' && playing.local) URL.revokeObjectURL(playing.src);
    setPlaying(null);
    onVideo(null);
    onStandby(RS.tvStandbyText);
  };

  const playFile = (title: string, src: string, local: boolean) => {
    const video = videoRef.current;
    if (!video) return;
    stop();
    setError(null);
    video.crossOrigin = local ? null : 'anonymous';
    video.src = src;
    video.volume = RS.tvVolume;
    video.muted = muted;
    setPlaying({ kind: 'file', title, src, local });
    setPaused(false);
    onVideo(video);
    video.play().catch(() => setPaused(true));
    onWatch();
    onCloseMenu();
  };

  const watch = (title: string, url: string) => {
    const src = resolve(url.trim());
    if (!src) return;
    if (VIDEO_FILE.test(src) || src.startsWith('blob:')) {
      playFile(title, src, false);
      return;
    }
    stop();
    setError(null);
    setPlaying({ kind: 'embed', title, src: embedAddress(src), original: src });
    onStandby('ON THE BIG SCREEN');
    onWatch();
    onCloseMenu();
  };

  // A video file that will not load with permission to draw it in 3D (or at all).
  const onVideoError = () => {
    if (playing?.kind !== 'file') return;
    const { title, src, local } = playing;
    if (!local && videoRef.current?.crossOrigin) {
      setPlaying({ kind: 'embed', title, src, original: src });
      onVideo(null);
      onStandby('ON THE BIG SCREEN');
      return;
    }
    setError(`"${title}" could not be played. Check the link or the file type.`);
    stop();
  };

  const togglePause = () => {
    const video = videoRef.current;
    if (!video || playing?.kind !== 'file') return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
  };

  return (
    <>
      <video
        ref={videoRef}
        playsInline
        loop={false}
        className="hidden"
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onEnded={stop}
        onError={onVideoError}
      />

      {playing?.kind === 'embed' && (
        <div className="absolute inset-x-3 top-14 z-20 mx-auto max-w-4xl border-[6px] border-[#0b0d18] bg-black shadow-2xl">
          <div className="flex items-center justify-between gap-2 bg-[#0b0d18] px-2 pb-1 text-xs text-[#c8d4a8]">
            <span className="truncate">{playing.title}</span>
            <span className="flex items-center gap-3">
              <a href={playing.original} target="_blank" rel="noopener noreferrer" className={`${LINK} flex items-center gap-1`}>
                Open <ExternalLink size={12} aria-hidden="true" />
              </a>
              <button type="button" onClick={stop} aria-label="Stop video" className="hover:text-[#f3f7e4]">
                <X size={16} aria-hidden="true" />
              </button>
            </span>
          </div>
          {/\.(mp4|m4v|webm|ogv|ogg|mov)(\?|#|$)/i.test(playing.src) ? (
            <video src={playing.src} controls autoPlay playsInline className="aspect-video w-full" onEnded={stop} />
          ) : (
            <iframe
              src={playing.src}
              title={playing.title}
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full"
            />
          )}
        </div>
      )}

      {playing?.kind === 'file' && !menuOpen && (
        <div className="absolute left-1/2 top-14 z-20 flex -translate-x-1/2 items-center gap-2 bg-[#05060a]/85 px-3 py-2 text-xs text-[#c8d4a8]">
          <span className="max-w-[12rem] truncate">{playing.title}</span>
          <button type="button" onClick={togglePause} aria-label={paused ? 'Play' : 'Pause'} className="hover:text-[#f3f7e4]">
            {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
          </button>
          <button type="button" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} className="hover:text-[#f3f7e4]">
            {muted ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
          </button>
          <button type="button" onClick={stop} aria-label="Stop" className="hover:text-[#f3f7e4]">
            <Square size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {menuOpen && (
        <section
          role="dialog"
          aria-label="TV"
          className="absolute bottom-16 right-3 top-14 z-30 flex w-[min(24rem,calc(100%-1.5rem))] flex-col border border-[#2e3a1c] bg-[#05060a]/90 text-sm backdrop-blur-sm"
        >
          <div className="flex items-center justify-between border-b border-[#2e3a1c] px-4 py-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a348]">TV</h2>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onPowerOff} className={BUTTON}>
                <Power size={14} aria-hidden="true" /> Turn off
              </button>
              <button type="button" onClick={onCloseMenu} aria-label="Close" className="text-[#c8d4a8] hover:text-[#f3f7e4]">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="space-y-5 overflow-y-auto px-4 py-4 text-xs text-[#c8d4a8]">
            {playing && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[#8a9a70]">Now playing:</span>
                <span className="font-bold text-[#f3f7e4]">{playing.title}</span>
                {playing.kind === 'file' && (
                  <>
                    <button type="button" onClick={togglePause} className={BUTTON}>
                      {paused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />} {paused ? 'Play' : 'Pause'}
                    </button>
                    <button type="button" onClick={toggleMute} className={BUTTON}>
                      {muted ? 'Unmute' : 'Mute'}
                    </button>
                  </>
                )}
                <button type="button" onClick={stop} className={BUTTON}>
                  <Square size={12} aria-hidden="true" /> Stop
                </button>
              </div>
            )}

            {error && <p className="text-[#f07a5a]">{error}</p>}

            <div>
              <h3 className="mb-2 font-bold uppercase tracking-widest text-[#94a348]">Videos</h3>
              {videos.length === 0 ? (
                <p className="text-[#8a9a70]">No videos yet. Paste a link or pick a file below.</p>
              ) : (
                <ul className="space-y-2">
                  {videos.map((v, i) => (
                    <li key={`${v.url}-${i}`} className="flex items-center justify-between gap-2">
                      <span className="truncate text-[#f3f7e4]">{v.title || v.url}</span>
                      <button type="button" onClick={() => watch(v.title || v.url, v.url)} className={BUTTON}>
                        <Play size={12} aria-hidden="true" /> Watch
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (link.trim()) watch(link.trim(), link.trim());
              }}
            >
              <h3 className="mb-2 font-bold uppercase tracking-widest text-[#94a348]">Any video link</h3>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="YouTube, Vimeo, or a .mp4 / .webm address"
                  aria-label="Video link"
                  className="min-w-0 flex-1 border border-[#2e3a1c] bg-[#0a0c04] px-2 py-1 text-[#f3f7e4] placeholder:text-[#8a9a70]/60"
                />
                <button type="submit" className={BUTTON}>
                  <Play size={12} aria-hidden="true" /> Watch
                </button>
              </div>
            </form>

            <div>
              <h3 className="mb-2 font-bold uppercase tracking-widest text-[#94a348]">A video file</h3>
              <button type="button" onClick={() => fileRef.current?.click()} className={BUTTON}>
                <Upload size={12} aria-hidden="true" /> Choose a file from this device
              </button>
              <p className="mt-1 text-[#8a9a70]">It plays only here, on the TV. Nothing is uploaded.</p>
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) playFile(file.name, URL.createObjectURL(file), true);
                  e.target.value = '';
                }}
              />
            </div>

            <p className="text-[#8a9a70]">
              Video files play on the TV in the room. Links to video sites play on a big screen in front of it, since web
              pages cannot be drawn in 3D.
            </p>
          </div>
        </section>
      )}
    </>
  );
}
