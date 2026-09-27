# zod-refiners documentation

Source for the `zod-refiners` docs site, built with [Vocs](https://vocs.dev).

```bash
pnpm install   # Install dependencies
pnpm dev       # Dev server → http://localhost:5173
pnpm build     # Production build (also checks for dead links)
pnpm preview   # Preview the production build
```

## Deploying to Vercel

- Import the repository and set **Root Directory** to `docs`.
- Package manager: **pnpm**. Build command `vocs build`, output `dist`
  (both pre-configured in `vercel.json`).
- `baseUrl` in `vocs.config.ts` must match the production domain.

## Editing content

Pages live in `src/pages/`. Navigation is configured in `vocs.config.ts` —
when you add, move, or rename a page, update the sidebar in the same change.
Content is reorganized from the repository's root `README.md`.
