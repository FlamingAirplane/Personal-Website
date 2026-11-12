import type { Metadata, Viewport } from 'next';
import { Noto_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler';
import { CustomCursor } from '@/components/custom-cursor';
import { MotionProvider } from '@/components/motion-provider';
import { profile } from '@/lib/content';
import { BASE_PATH, SITE_URL, withBase } from '@/lib/site';

const notoSans = Noto_Sans({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600', '700', '800'] });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

const TITLE = `${profile.name} | ${profile.jobTitle}`;
const DESCRIPTION = `Portfolio of ${profile.name} - ${profile.tagline}`;
const SHARE_IMAGE = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE_URL}/`),
  // Pages that set their own title get "<their title> | Adine Johnson".
  title: { default: TITLE, template: `%s | ${profile.name}` },
  description: DESCRIPTION,
  icons: {
    icon: withBase('/favicon.svg'),
    shortcut: withBase('/favicon.svg'),
  },
  openGraph: {
    type: 'website',
    siteName: profile.name,
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/`,
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [SHARE_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0c04',
  colorScheme: 'dark',
};

// Runs before anything is drawn. It reads the visitor's "Fun or Standard?"
// answer so the page does not have to wait for the rest of the scripts:
// Standard visitors see the page at once (see .mode-gate-cover in
// globals.css) and Fun visitors on the home page go straight to the room.
const READ_SITE_MODE = `(function(){var d=document.documentElement,b=${JSON.stringify(BASE_PATH)};try{var m=localStorage.getItem('site-mode');d.setAttribute('data-site-mode',m||'unset');var p=location.pathname;if(m==='fun'&&(p===b+'/'||p===b))location.replace(b+'/room/');}catch(e){d.setAttribute('data-site-mode','unset');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the script above adds an attribute to <html>.
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: READ_SITE_MODE }} />
      </head>
      <body className={`${notoSans.variable} ${jetbrainsMono.variable} font-sans`}>
        <MotionProvider>
          <CustomCursor />
          {children}
        </MotionProvider>
        <ChunkLoadErrorHandler />
      </body>
    </html>
  );
}
