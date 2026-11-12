# Style guide

How the site looks, as it is actually built.

## Fonts

| Use | Font | Tailwind class |
|---|---|---|
| Everything on the Standard site | Noto Sans (400 to 800) | `font-sans` (the default) |
| The gate, the room, the 404 page, small labels | JetBrains Mono | `font-mono` |

Both are loaded in `app/layout.tsx`. Headings use `font-bold` and
`tracking-tight`.

## Colours

The site has one theme, dark. Colours are written as hex values in the
components.

| Colour | Hex | Used for |
|---|---|---|
| Page background | `#0a0c04` | Standard site background |
| Alternate background | `#0d0f06` | Sidebar, every other section |
| Gate and room background | `#05060a` | The gate, the room, the 404 page |
| Card | `#1a2e38` | Project cards, panels |
| Card image well | `#142028` | Behind card images |
| Brand green | `#94a348` | Buttons, links, icons, focus ring |
| Brand green, hover | `#a8b850` | Button hover |
| Heading text | `#f3f7e4` | Headings, strong text |
| Body text | `#c8d4a8` | Paragraphs |
| Quiet text | `#8a9a70` | Dates, captions, small print |
| Lines | `#1a1e10`, `#2e3a1c` | Borders |

Do not use anything dimmer than `#8a9a70` for text on the dark backgrounds:
it falls below the 4.5:1 contrast that small text needs.

## The room's palette

The room draws with exactly the 29 colours in `lib/room/palette.ts`. Every
pixel is snapped to the nearest one, which is what gives the bit-crushed
look. Build room objects from those colours so they survive the snap
unchanged.

## Behaviour to keep

- **Links are links.** Anything that goes somewhere is an `<a>`, so it can be
  opened in a new tab and works with a keyboard.
- **Icons are decoration.** Give icons `aria-hidden="true"`, and give any
  button that is only an icon an `aria-label`.
- **One top-level heading per page.**
- **Respect "reduce motion".** Movement made with framer-motion is handled for
  you by `components/motion-provider.tsx`. Anything animated by hand has to
  check `prefers-reduced-motion` itself.
- **Keep `ChunkLoadErrorHandler`** in `app/layout.tsx`. It reloads the page if
  a code chunk fails to load during development.
