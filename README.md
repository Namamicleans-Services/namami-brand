# @namami/tokens

The single source of Namami Cleans' brand in code: colours, type, spacing, radius, control sizes and booking-status styling, shared by the customer app, the Namamian app, admin and the website.

The brand book (voice, Hindi rules, imagery, print, uniform) lives in the Namami Cleans Design System artifact. This repo's `tokens.json` is the same file; change it here first, then sync the artifact (`dist/design-system.tokens.css` is its `tokens.css`).

## Install

Pinned to a version tag, from this repo (public: it holds only token values, no secrets or logos):

```json
"@namami/tokens": "github:Namamicleans-Services/namami-brand#v1.1.0"
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
```

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
