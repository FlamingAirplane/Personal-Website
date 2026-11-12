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
Games, Sound, Work, Profile & Resume, and Title/Particles/Cursor. Saving puts a
change in your draft (kept in the browser). **Preview** opens the real site with
the draft in a new tab, and it updates as you save. **Publish** commits the draft
to `main` through the GitHub API and the site republishes in about a minute;
**Discard** throws the draft away.

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

## Changing the room: the admin page

The room has its own control panel at `/room/admin/` (on the live site:
<https://flamingairplane.github.io/Personal-Website/room/admin/>). It shows the
room on one side, updating as you change things, and the controls on the other.

What you can change:

- **Items**: move, turn, resize or hide any object; swap it for your own `.glb`
  3D model; add your own pictures and models; and decide what happens when
  each item is looked at (a line of text, a card with title, text, picture and
  link, and its own background picture for the walls).
- **Places**: the pictures the walls show. Rename or re-light the built-in ones,
  or add your own from any photo.
- **Room, Player, Look, Light, Screens, Words**: the size of the room, how
  fast you walk, how chunky the pixels are, the colour palette, how the panels
  flicker and glitch, the fog, and every piece of text.

The admin has no password because it cannot change the website. It edits a
**draft that lives in your browser**, and the pictures and models you import
are kept there too. To publish:

1. Open the **Publish** tab and press **Download bundle**.
2. Unzip it into `nextjs_space/public/`. It adds `room/room-config.json` and
   your files under `room/assets/`.
3. Commit and push, as for any other change.

Visitors always see the published settings. To look at your draft in the real
room, use **Open draft in the room** (it only works in the browser that made
the draft).

Notes on files you import:

- Models must be single-file `.glb`. A few MB is plenty. Models stand on the
  object's spot, and "Height" scales them to a size in metres.
- Pictures are shrunk to 2560 pixels on import. The room is drawn at low
  resolution, so bigger pictures only add weight.
- The room's walls repeat one wide picture all the way round. For an ordinary
  photo, set "Times it repeats around the room" to 4 to get one per wall.

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
    config.ts            every setting the room has, with defaults and checks
    config-schema.ts     which settings the admin page shows, and how
    models.ts            loading your own .glb models
    assets.ts            files imported in the admin (kept in the browser)
    export-bundle.ts     the zip the admin's Publish tab makes
    crush-pass.ts        the low-resolution, limited-palette look
  components/room/admin/  the admin page
  public/              images and other files served as they are
  public/room/         room-config.json: the published room settings
SITE_AUDIT.md          the last full review: what was fixed, what is waiting on you
```

To add something to the room: build it in `props.ts`, give it a rectangle in
`OBSTACLES` in `room-data.ts` if it stands on the floor, and add an entry to
`HOTSPOTS` there if it should be clickable.

See [`nextjs_space/STYLE_GUIDE.md`](nextjs_space/STYLE_GUIDE.md) for colours
and fonts.
