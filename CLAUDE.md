# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev    # Start development server at http://localhost:3000
npm run build  # Production build
npm run lint   # Run ESLint
npm run typecheck # Check TypeScript types
```

## Architecture

This is a Linktree-style personal links page built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS. Use Node.js 24 LTS and `npm ci` with the committed lockfile. Production uses the multi-stage Dockerfile and Next.js standalone output.

### Data-Driven Design

All content is defined in `data.json` at the project root:
- `name`, `desc`, `avatar`: Profile information
- `links[]`: Array of link cards with `title`, `href`, `image`, and optional `discontinued`/`acquired` flags
- `socials[]`: Social media links (icons are selected by URL pattern in `app/page.tsx`)

To add/modify links, edit `data.json` only. The UI renders dynamically from this file.

### Key Files

- `app/page.tsx`: Main page component with inline SVG social icons (Twitter, GitHub, LinkedIn, HuggingFace, Weights & Biases). Social icons are selected by matching URL substrings.
- `components/LinkCard.tsx`: Client component for link cards with touch-optimized interactions and status badges
- `app/layout.tsx`: Root layout with SEO metadata, image preloading, and analytics script
- `styles/globals.css`: Gradient background (dark blue to purple) and Tailwind component styles for touch feedback

### Image Handling

Images are stored in `/public/` and referenced by filename in `data.json`. The Next.js Image component handles optimization. External domains must be allowlisted in `next.config.js`.

### Agent Discovery Surfaces

The site exposes several machine-readable resources for AI agents. All derive content from `data.json`, so updating links/socials there keeps every surface in sync:

- `proxy.ts`: Rewrites requests with `Accept: text/markdown` to `/api/markdown` (markdown rendering of the homepage). Browsers still get HTML.
- `app/api/markdown/route.ts`: Markdown representation; sets `Content-Type: text/markdown`, `x-markdown-tokens`, and `Vary: Accept`.
- `app/.well-known/api-catalog/route.ts`: RFC 9727 `application/linkset+json` API catalog.
- `app/.well-known/agent-card.json/route.ts`: A2A Agent Card describing available skills.
- `app/.well-known/agent-skills/index.json/route.ts`: Agent Skills Discovery v0.2.0 index. Reads `public/.well-known/agent-skills/*/SKILL.md` at build time and embeds their SHA-256 digests. **If you edit a SKILL.md file, rebuild (`npm run build`) so the digest is recomputed.**
- `app/llms.txt/route.ts`: Plain-text summary per llmstxt.org.
- `app/api/health/route.ts`: JSON health endpoint advertised by the API catalog.
- `components/WebMcp.tsx`: Client component that registers `list_links`, `get_profile`, and `find_link` tools via `navigator.modelContext` (WebMCP).
- `next.config.js` `headers()`: Emits RFC 8288 `Link` headers on every page pointing to the discovery resources above, plus CORS + cache headers for `/.well-known/*`.
