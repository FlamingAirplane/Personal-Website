# Site audit

Audited on 11 November 2026 against the version live at
<https://flamingairplane.github.io/Personal-Website/>, by reading every source
file and by using both versions of the site at desktop and phone sizes.

## Summary

The site worked and deployed, but it was slow to load, had a handful of real
bugs, was hard to use without a mouse, looked the same to search engines on
every page, and carried a lot of leftovers from the template it started as.

The five findings that mattered most:

1. **The home page downloaded about 8.8 MB of images** (SP1). The hero
   background alone was 2.5 MB, shown at 30% opacity.
2. **There is no way to contact you anywhere on the site** (N1). This one
   needs you.
3. **An invisible list in the room swallowed mouse clicks** (B4), and walking
   got stuck on furniture (B6).
4. **The "Enter the room" button covered the footer** (B2), and the footer's
   "Work" button went to the wrong section (B1).
5. **About 70 of the installed packages and 60 files were never used** (P2),
   including types for an expense tracker.

Each finding below has a status:

- **Fixed**: changed in this pass.
- **Needs you**: only you can supply it (a file, a link, a decision).
- **Left alone**: a deliberate choice not to change it, with the reason.

Totals: 52 fixed, 8 need you, 8 left alone.

---

## Speed

| ID | Finding | What was done | Status |
|---|---|---|---|
| SP1 | Images were far larger than they are shown. The hero background and profile photo were 4032 × 3024 phone originals (2.5 MB and 1.6 MB); three project covers were over 1 MB each. Total 8.8 MB. | Resized and re-encoded the oversized images. Total is now about 1.1 MB. Files were also renamed after their projects (see P9). | Fixed |
| SP2 | The floating background dots were drawn on a canvas as tall as the whole page (about 1280 × 6000 pixels on desktop), wiped and redrawn every frame, although only the top screenful is ever visible. | The canvas is now the size of the screen. The dots look the same. | Fixed |
| SP3 | The particle title kept animating when scrolled out of view, and on phones it rebuilt itself (all particles scattering again) every time the address bar slid in or out. | It pauses when off screen and only rebuilds when the width changes. | Fixed |
| SP4 | The custom cursor looked up the element and its colours on every mouse event, which can be hundreds of times a second. | It now does this at most once per frame. | Fixed |
| SP5 | The code that highlights the current section in the menu ran on every scroll event. | It now runs at most once per frame. | Fixed |
| SP6 | Toast-message and theme-switching code shipped on every page although nothing used them. | Removed. | Fixed |
| SP7 | Returning visitors saw a black cover until the page's scripts had loaded, because the "Fun or Standard?" answer was only read after that. | A few lines of script at the top of the page read the answer before anything is drawn. Standard visitors see the page at once; Fun visitors go straight to the room. | Fixed |
| SP8 | The room drew a new frame as fast as the screen allowed even when nothing was moving. | It drops to about 20 frames a second when you are standing still, which saves battery. | Fixed |
| SP9 | A third font (DM Sans) was preloaded on every page but never used anywhere. | Removed. | Fixed |

## Bugs

| ID | Finding | What was done | Status |
|---|---|---|---|
| B1 | The footer's "Work" button scrolled to the Games section. | It goes to Work History. | Fixed |
| B2 | The floating "Enter the room" button covered the copyright line in the footer and hung off the bottom of the hero on phones. | It now lives in the sidebar on desktop and in the top bar on phones. | Fixed |
| B3 | The sidebar never highlighted "Resume": the last section is too short to reach the line that triggers it. | The last section is highlighted when you reach the bottom of the page. | Fixed |
| B4 | In the room, the keyboard-only list of objects at the top left was invisible but still caught mouse clicks, so clicking that part of the scene walked you to an object. | It ignores the mouse until a keyboard user focuses it. | Fixed |
| B5 | The toolbox's standing spot was inside the desk's no-walk zone, so you never quite arrived. | Moved the standing spot. | Fixed |
| B6 | Walking went in a straight line and stopped dead against furniture. | The room now plans a route around furniture (see `lib/room/pathfinding.ts`). | Fixed |
| B7 | The hero's tagline was typed into the component, so editing `tagline` in the content file changed the About section but not the hero. | The hero reads the content file. | Fixed |
| B8 | Project pages failed with an error when running the site locally in development (the published site was unaffected). One unnecessary setting caused it. | Removed the setting. | Fixed |

## Usability and design

| ID | Finding | What was done | Status |
|---|---|---|---|
| U1 | Every project had a "Read More" button leading to a page with nothing more on it. | The button only appears once a project has a write-up or a gallery. | Fixed |
| U2 | The Resume section showed "Resume coming soon." and nothing else, which reads as unfinished. | The section and its menu entry are hidden until there is a resume or a social link to show. They appear on their own once you add one (N2, N3). | Fixed |
| U3 | The particle title was always 320 pixels tall, leaving a large empty gap around a small title on phones. | Its height now scales with the screen width. | Fixed |
| U4 | Project pages were dead ends: the only way out was a small unlabelled arrow. | Added "previous" and "next" project links at the bottom, and a labelled back link. | Fixed |
| U5 | A mistyped address showed the framework's bare default "404" page. | Added a 404 page in the site's style with links home and to the room. | Fixed |
| U6 | The quote, the Expertise paragraph, the skill tags and the hero lines were typed into components, not the content file. | They are all in `lib/content.ts` now, so every word on the site is edited in one place. | Fixed |
| U7 | The room showed a black screen with no feedback while the 3D code loaded. | It says "Loading the room…" until the first frame is drawn. | Fixed |
| U8 | The room's hint said "Click to walk" on touch screens. | It says "Tap" on touch screens. | Fixed |
| U9 | In the room the cursor did not react to objects, and the hover outline was a loose box much larger than the object. | The cursor grows over anything you can use, and the outlines fit the objects. | Fixed |
| U10 | Section menus were buttons that scroll, so they could not be opened in a new tab, copied as a link, or used without scripts. | They are ordinary links to each section's anchor (for example `#about`). | Fixed |

## Accessibility

| ID | Finding | What was done | Status |
|---|---|---|---|
| A1 | The phone menu button and the project page's back arrow had no names, so a screen reader announced them only as "button" and "link". | Named both. The menu button also reports whether it is open. | Fixed |
| A2 | Headings were wrong: the home page's only top-level heading was the logo "Adine.", the big title is a drawing with no text behind it, and project pages had two top-level headings. | Each page has exactly one top-level heading, and the particle title has a text alternative. | Fixed |
| A3 | The menu did not tell assistive technology which section is current. | The current entry is marked. | Fixed |
| A4 | Work history entries open and close but did not say which state they were in. | They report open or closed. | Fixed |
| A5 | The project gallery's enlarged view could only be closed with a mouse. | Escape closes it, it takes keyboard focus, and it has a visible close button. | Fixed |
| A6 | Small text in `#5a6a40` on the near-black background has a contrast ratio of about 3.4:1; the accepted minimum for small text is 4.5:1. It was used for the copyright lines and the gate's small print. | Changed to `#8a9a70` (about 6.5:1). | Fixed |
| A7 | Nothing respected the "reduce motion" system setting: entrance animations, the tilting cards, smooth scrolling, the bouncing arrow and both particle effects all ran regardless. | All of them now stand still or cut straight to their end state when that setting is on. The room already did. | Fixed |
| A8 | Keyboard focus was shown with each browser's default ring, which is hard to see on this background, and there was no way to skip past the menu. | Added a consistent green focus ring and a "Skip to content" link. | Fixed |
| A9 | The decorative hero background was described to screen readers as "Hero background - scenic landscape". | Decorative images are now skipped. | Fixed |

## Search engines and sharing

| ID | Finding | What was done | Status |
|---|---|---|---|
| SE1 | Every page had the same title and description, so all eight project pages looked identical in search results and browser tabs. | Each project page has its own title, description and share image. | Fixed |
| SE2 | No large-image card for social sharing, no canonical addresses, no browser theme colour, no structured data. | Added all four. The structured data describes you as a person with your job title; it contains no contact details. | Fixed |
| SE3 | `robots.txt` is published at `/Personal-Website/robots.txt`. Search engines only read that file at the very top of a domain, so this copy is ignored. | Nothing to fix while the site lives under `github.io/Personal-Website`. It will start working if you move to a custom domain. The sitemap works either way. | Left alone |

## The room

| ID | Finding | What was done | Status |
|---|---|---|---|
| R1 | You asked for a bookcase instead of the wall shelf. | Replaced the shelf with a floor-standing bookcase: five shelves of books, a row of matching manga volumes, and a trinket on top. | Fixed |
| R2 | You asked for more props. | Added a desk chair, studio speakers, a couch facing the cinema screen with a game controller on it, a rug, a lava lamp, a potted plant and watering can (after your Digital Nature art), a record player on a cabinet with a crate of records, and a whiteboard. The record player and whiteboard are clickable and reserved for the music and "working on now" feeds. | Fixed |
| R3 | On very wide screens the room's pixels stretched sideways, because its width was capped. | Raised the cap. | Fixed |
| R4 | Every box in the room created its own copy of its colour, several hundred in all. | Colours are shared. | Fixed |
| R5 | If the browser dropped the 3D context (it can on phones under memory pressure) the room froze silently. | It now says what happened and offers a reload. | Fixed |
| R6 | The object-to-place pairings on the walls are placeholders. | Unchanged; they will come from each project in a later phase. | Left alone |
| R7 | The room has no sound. | Out of scope for this pass. | Left alone |

## Project health

| ID | Finding | What was done | Status |
|---|---|---|---|
| P1 | The README was a single dot. | Wrote a real one: how to edit content, add images, run it locally, and how publishing works. | Fixed |
| P2 | The project still carried the template it was generated from: about 70 installed packages (charts, maps, forms, date pickers, state libraries) and about 60 component files that nothing used, plus type definitions for an expense tracker. | Removed all of it. Fifteen packages remain, and a clean install takes about 20 seconds. | Fixed |
| P3 | `STYLE_GUIDE.md` described the template, not the site: wrong fonts, and rules the site does not follow. | Rewrote it to describe the site as it is. | Fixed |
| P4 | A build cache file and a macOS `.DS_Store` file were committed. | Removed from the repository and ignored from now on. | Fixed |
| P5 | Nothing checked that a pull request still builds; a mistake would only surface when the live deploy failed. | The build now runs on every pull request. | Fixed |
| P6 | Next.js was seven patch releases behind (14.2.28). | Updated to 14.2.35. | Fixed |
| P7 | A linter was installed but never configured, so `npm run lint` did nothing useful. | Removed the unused packages and script. Type-checking still runs on every build. | Fixed |
| P8 | The browser-support setting still targeted Internet Explorer 11. | Changed to current browsers. | Fixed |
| P9 | Image files had typos and unrelated names (`FrezzePoint.png`, `WrapersPlease.png`, `woodcraft.jpg` for Manacy). | Renamed each after its project. | Fixed |
| P10 | `npm audit` reports security advisories against Next.js. | Every one concerns a running Next.js server (image optimiser, server actions, rewrites). This site is exported to plain files and has no server, so none apply. Moving to the next major version is a bigger job for another day. | Left alone |

## Needs you

| ID | What is missing | How to supply it |
|---|---|---|
| N1 | **There is no way to contact you on the site.** No email, no form, no social links. For a portfolio this is the most important gap. | Decide how you want to be reached, then either fill in N3 or ask for an email link or contact form. |
| N2 | No resume. The Resume section is hidden until there is one. | Put the PDF in `nextjs_space/public/` and set `resumeUrl` in `lib/content.ts` (for example `'/resume.pdf'`). |
| N3 | No social links. | Set `twitterUrl` and `instagramUrl` in `lib/content.ts`. Other networks can be added on request. |
| N4 | Every project's link is a placeholder, so nothing can be played, downloaded or watched. | Set `projectLink` for each project in `lib/content.ts`. |
| N5 | No project has a write-up or gallery, so "Read More" is hidden everywhere and the project pages are thin. | Fill in `subpageContent` and `galleryImages` for each project. |
| N6 | "Parking Day SCAD Pro" is public speaking and website design, but it is listed under Game Portfolio. | Say where it belongs, or whether a third "Other work" section is wanted. |
| N7 | The content came from the old seed file, so anything you edited through the old admin page is missing. | Read through `lib/content.ts` and correct it. |
| N8 | Two of the wall panoramas (the Venice sunset and the Shanghai skyline) have tourists in the foreground. | Say if you would rather have empty scenes and replacements will be found. |

## Left alone on purpose

| ID | What | Why |
|---|---|---|
| L1 | The particle title is drawn in the browser's fallback font (Arial), not the site's Noto Sans, because the drawing code asks for the font by a name the page does not register. | Fixing it would change the look of the title you are used to. Say if you want it. |
| L2 | The custom cursor hides the normal mouse pointer everywhere. | It is a deliberate part of the design. It is already switched off on touch devices. |
| L3 | The room's close-ups (computer desktop, arcade, toolbox, cinema), the live feeds and real art for the furniture. | These are the remaining phases of the plan, not defects. |
| L4 | The room has not been tried on a real phone, only at phone size on a computer. | Needs a device. |
