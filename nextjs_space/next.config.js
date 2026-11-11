// The site is exported as plain static files for GitHub Pages.
//
// GitHub Pages serves this repo at https://flamingairplane.github.io/Personal-Website,
// so the published build lives under that sub-path. To move to a custom domain
// later, build with NEXT_PUBLIC_BASE_PATH="" (see .github/workflows/deploy-pages.yml).

const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (process.env.NODE_ENV === 'production' ? '/Personal-Website' : '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
