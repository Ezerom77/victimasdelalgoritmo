# AGENTS.md

## Project

Astro static site (Brutal neobrutalist theme) deployed to Netlify. Spanish-language blog about algorithmic harm.

## Commands

```bash
pnpm dev      # dev server at localhost:4321
pnpm build    # build to ./dist/
pnpm preview  # preview production build
```

## Dependencies

- **pnpm** - exact version in `packageManager` field (currently pnpm@8.6.0)
- **Node 22** - configured in netlify.toml

## Environment

Required env vars (see `.env`):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Architecture

- **Entrypoint**: `src/pages/index.astro`
- **Blog**: Markdown files in `src/content/blog/` with frontmatter schema in `src/content/config.ts`
- **API routes**: `src/pages/api/` (contact.ts, views.ts) - server-side rendered routes
- **OG images**: `src/pages/v1/generate/og/` - generates social share images via satori

## Styling

UnoCSS with Tailwind-compatible presets. Config in `uno.config.ts`. Use utility classes like `flex`, `p-4`, `bg-red`, etc.

## Build output

Static files go to `dist/` - this directory is deployed to Netlify.

## Key files

- `astro.config.ts` - Astro config, integrations (sitemap, UnoCSS, mdx, partytown), Netlify adapter
- `uno.config.ts` - UnoCSS presets (wind, icons, typography)
- `src/layouts/` - Default.astro, BlogPost.astro
- `src/components/layout/` - BaseHead, BaseNavigation, BaseFooter