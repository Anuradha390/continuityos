# ContinuityOS

ContinuityOS is a React/Vite workforce resilience dashboard reconstructed from the public preview.

## Local development

```bash
pnpm install
pnpm dev
```

## Render deployment

This repository is configured as a **Render Static Site** through [`render.yaml`](./render.yaml).

- Build command: `corepack enable && pnpm install --frozen-lockfile && pnpm run build`
- Publish directory: `dist`
- SPA routes are rewritten to `index.html`
- No fixed application port is configured; Render manages the static deployment

To deploy, create a new **Static Site** in Render and connect the public GitHub repository:
`Anuradha390/continuityos`. Render can also use the included Blueprint configuration.

## Checks

```bash
pnpm run build
pnpm run check
```

Platform-managed secrets, database credentials, generated dependencies, and Manus runtime internals are intentionally excluded.
