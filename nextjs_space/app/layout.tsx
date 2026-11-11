import { Noto_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler';
import { CustomCursor } from '@/components/custom-cursor';
import { SITE_URL, withBase } from '@/lib/site';

const notoSans = Noto_Sans({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600', '700', '800'] });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-display' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata = {
  title: 'Adine Johnson | Game Designer & Sound Designer',
  description: 'Portfolio of Adine Johnson - Game Designer & Sound Designer attending SCAD',
  metadataBase: new URL(`${SITE_URL}/`),
  icons: {
    icon: withBase('/favicon.svg'),
    shortcut: withBase('/favicon.svg'),
  },
  openGraph: {
    title: 'Adine Johnson | Game Designer & Sound Designer',
    description: 'Portfolio of Adine Johnson - Game Designer & Sound Designer attending SCAD',
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${notoSans.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <CustomCursor />
          {children}
          <Toaster />
          <ChunkLoadErrorHandler />
        </ThemeProvider>
      </body>
    </html>
  );
}
