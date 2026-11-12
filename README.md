# Personal Website

Adine Johnson's portfolio, live at <https://flamingairplane.github.io/Personal-Website/>.

It comes in two versions, chosen by the "Fun or Standard?" question on a
first visit:

- **Standard**: a normal scrolling portfolio page.
- **Fun**: a 3D room you walk around, at `/room/`.

The site is plain static files. There is no server and no database.

## Changing what the site says

Everything written on the site lives in one data file:
[`nextjs_space/content/site-content.json`](nextjs_space/content/site-content.json)
(profile, projects, jobs, and the title/particle/cursor settings).

**Easiest way: the admin page** at `/Personal-Website/admin/`. It has tabs for
Games, Sound, Work, Profile & Resume, and Title/Particles/Cursor. Saving commits
the change to `main` through the GitHub API and the site republishes in about a
minute.

To sign in, paste a fine-grained GitHub token. Create one at
<https://github.com/settings/personal-access-tokens/new>, limited to the
`Personal-Website` repository only, with **Contents: Read and write** and a
short expiry. The token stays in the browser tab (session storage) and is sent
only to api.github.com. Uploaded images and the resume go to
`nextjs_space/public/uploads/`.

You can also edit `site-content.json` by hand, commit, and push to `main`.

Things that appear on their own once they have content:

- The **Resume** section and its menu entry (needs a resume or a social link).
- A project's **Read More** button (needs `subpageContent` or `galleryImages`).
- A project's **View Project** button (needs a `projectLink` other than `'#'`).

### Images

Put images in `nextjs_space/public/images/` and refer to them as
`'/images/your-file.jpg'`. Keep them small: about 1000 pixels wide is plenty
for a project cover. Large images are the main thing that makes a site slow.

## Running it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
cd nextjs_space
npm install
npm run dev
```

Then open <http://localhost:3000>.

To build exactly what gets published:

```bash
npm run build
```

The result is in `nextjs_space/out/`.

## How publishing works

[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)
builds the site on every pull request, and builds and publishes it on every
push to `main`. In the repository settings, Pages must have its source set to
"GitHub Actions".

The site is built to live under `/Personal-Website`. To move it to a custom
domain, build with `NEXT_PUBLIC_BASE_PATH=""` (there is a note in the
workflow file).

## Where things are

```
nextjs_space/
  app/                 pages: home, /room, /projects/<slug>, 404
  components/          the Standard site's sections
  components/room/     the room's page component
  content/             site-content.json: all of the site's words and settings
  lib/content.ts       typed access to that JSON
  app/admin/           the admin page (commits to GitHub)
  lib/site.ts          the site's address and base path
  lib/room/            the room
    room-data.ts         size, objects you can use, furniture footprints
    build-room.ts        walls, desk, door, arcade, lights
    props.ts             bookcase, couch, rug, plant and other furniture
    wall-screens.ts      the walls, which are screens
    environments.ts      the places the walls can show
    pathfinding.ts       walking around furniture
    crush-pass.ts        the low-resolution, limited-palette look
  public/              images and other files served as they are
SITE_AUDIT.md          the last full review: what was fixed, what is waiting on you
```

To add something to the room: build it in `props.ts`, give it a rectangle in
`OBSTACLES` in `room-data.ts` if it stands on the floor, and add an entry to
`HOTSPOTS` there if it should be clickable.

See [`nextjs_space/STYLE_GUIDE.md`](nextjs_space/STYLE_GUIDE.md) for colours
and fonts.
