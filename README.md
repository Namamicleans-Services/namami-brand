# @namami/tokens

The single source of Namamicleans' brand in code: colours, type, spacing, radius, control sizes, booking-status styling, and every logo and icon file, shared by the customer app, the Namamian app, admin and the website.

The guidelines are the brand book (`book/index.html`, published as a private claude.ai page; the PDF and kit zip are exported from it). The Design System artifact mirrors `tokens.json`; change tokens here first, then sync the artifact (`dist/design-system.tokens.css` is its `tokens.css`).

## Install

Pinned to a version tag, from this repo (public: it holds token values and the brand's logo and icon files, no secrets):

```json
"@namami/tokens": "github:Namamicleans-Services/namami-brand#v1.3.0"
```

No tokens or CI secrets are needed.

## Use

**Tailwind v3 apps (customer app, Namamian app, website)**

```css
/* globals.css */
@import "@namami/tokens/tokens.css";
@import "@namami/tokens/shadcn-v3.css";
```

```js
// tailwind.config
presets: [require("@namami/tokens/tailwind-preset")],
```

**Tailwind v4 (admin)**

```css
@import "tailwindcss";
@import "@namami/tokens/tokens.css";
@import "@namami/tokens/theme-v4.css";
```

**Fonts.** Load with `next/font/google` (`Poppins` 600 as `--font-poppins`, `Mukta` 400/600 as `--font-mukta`, subsets `latin` + `devanagari`, `display: 'swap'`) or `@fontsource` on Vite. Put the font `variable` classes on **`<html>`**, not `<body>`: the token font stacks are defined on `:root` and can only see variables set on `<html>`. Never `@import` Google Fonts in CSS.

**Booking status**

```ts
import { BOOKING_STATUS, STATUS_FAMILY_CLASSES } from "@namami/tokens/status";
const s = BOOKING_STATUS[booking.status]; // { family, icon, en, hi }
<span className={cn("rounded-full border-2 px-3", STATUS_FAMILY_CLASSES[s.family])}>{s.en}</span>
```

Two things every consumer must do, or pills silently lose their colour:

- **Let Tailwind see the classes.** They live in `node_modules`, which Tailwind doesn't scan. Add `"./node_modules/@namami/tokens/dist/status.js"` to `content` (Tailwind 3) or `@source "../node_modules/@namami/tokens/dist/status.js";` (Tailwind 4).
- **Give the pill a border width** (`border-2`). The family classes set only the border *colour*: transparent for live/done/stopped, an outline for upcoming.

## Utilities

Every colour token is a Tailwind colour: `bg-surface`, `bg-surface-raised`, `text-ink`, `text-ink-muted`, `bg-brand`, `text-on-brand`, `bg-gold`, `text-on-gold`, `bg-status-live-bg` … Type styles are font sizes: `text-title-1`, `text-body`, `text-field`, `text-price` (use `font-display` for Poppins). Control heights: `h-control-md`, `min-h-control-xl`. shadcn's own names (`bg-primary`, `text-muted-foreground`) keep working and point at the tokens.

## Lint

```bash
npx namami-lint src/app/(screens) src/components
```

Rejects raw hex colours, Tailwind palette classes (`bg-teal-600`, `text-gray-500`) and arbitrary colour values. Add each folder to the repo's lint script once it has migrated, so it can't drift back. A deliberate exception takes `// namami-lint-ignore` on the same line, with a reason.

## Changing a token

1. Edit `tokens.json`.
2. `npm run check` (contrast and status-family separation in both themes) and `npm run build`.
3. Bump `version` in `package.json` (minor for additions, major for removals or renames), commit `dist/`, tag `vX.Y.Z`.
4. Sync the Design System artifact (tokens.json + `dist/design-system.tokens.css`).
5. Products upgrade by changing their pinned tag.

The brand owner approves every change.

## Logo and icon files (the kit)

`kit/` generates every logo and icon from two masters: the drop (`kit/src/drop.svg`) and the wordmark, set in Poppins SemiBold and outlined so it can't be retyped.

```bash
cd kit && npm install && npm run build   # in Docker: node:22
```

- `kit/dist/01-logo`: horizontal, stacked, drop and wordmark in 5 colourways (SVG; PNG at 600/1200/2400 px).
- `kit/dist/02-app-icons/<app>`: Android `res/` (adaptive layers at every density, legacy icons, splash), Play 512, iOS 1024, Capacitor sources. `namamicleans` is the customer app, `namamian` the staff app.
- `kit/dist/03-web-icons/<app>`: `favicon.ico`/`.svg`/`.png`, PWA icons (standard + maskable), Apple touch icon.
- `kit/dist/04-social`: avatar, 1200 × 630 share image, 1584 × 396 banner.

The package ships the SVG logos, app, web and social icons, so products copy them from `node_modules/@namami/tokens/kit/dist/…`. Never edit a generated file or export one by hand: change the generator, rebuild, release.

### Keeping apps in step

Each app lists the kit files it uses in `brand-assets.json`, mapping its own path to a path under `kit/dist`:

```json
{
  "files": { "public/brand/favicon.ico": "03-web-icons/namamicleans/favicon.ico" },
  "dirs": { "android/app/src/main/res": "02-app-icons/namamicleans/android/res" }
}
```

```bash
npx namami-assets check   # fails if a listed file is missing or differs from the kit
npx namami-assets sync    # copies the kit's files into place
```

`check` runs in each app's deploy workflow next to `lint:brand`, so an icon can't drift from the kit. After a kit release, bump `@namami/tokens`, run `sync`, commit.
