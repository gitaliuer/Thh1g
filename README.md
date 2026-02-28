# 4-Page Comic Generator (MVP)

Next.js app that takes one prompt and generates a cohesive 4-page comic (images + captions) using OpenAI.

## Stack
- Next.js (App Router), TypeScript
- Tailwind CSS + shadcn-style UI components
- Route Handlers (`/api/*`)
- Validation with Zod
- In-memory rate limiting + client history in `localStorage`

## Features
- Prompt input + options: style preset, page format, tone, consistency mode.
- Progress stepper: `Plan → Page 1 → Page 2 → Page 3 → Page 4`.
- 2×2 page grid with placeholders/skeletons while generating.
- Per-page actions: regenerate, inline caption edit, download PNG.
- Global actions: regenerate all, start new, cancel current flow.
- API routes:
  - `POST /api/comic/plan`
  - `POST /api/comic/generate`
  - `POST /api/comic/generateAll` (optional utility)
- Server-only OpenAI key handling.
- Basic IP rate-limit: 10 requests / 10 min per endpoint family.

## Run locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.example .env.local
   ```
3. Set `OPENAI_API_KEY`.
4. Run:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000

## Assumptions / Notes
- The app defaults `language` to `ru` from UI call for plan generation.
- Rate limiter and generated project cache are in-memory only (reset on server restart).
- `localStorage` stores last 8 generation sessions in browser.
- `Consistency mode` injects visual + character bibles, invariants, and `globalNegative` into each image prompt.

## Production extension points
- Add auth/session and replace local storage with DB-backed projects.
- Provider abstraction can be introduced in `lib/openai.ts` + service layer.
- BYOK mode can be added by storing encrypted user keys and routing requests per user/provider config.
- PDF export can be added as a server action/route that composes generated page images.
