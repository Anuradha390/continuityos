# ContinuityOS

> ContinuityOS is a workforce resilience platform that stress-tests team capability, identifies single-person dependencies, and turns workforce risks into practical recovery plans.

ContinuityOS helps operations and people leaders understand where critical knowledge lives, measure backup readiness, and simulate targeted recovery actions before a disruption occurs. The project combines a workforce twin, dependency analysis, resilience scoring, scenario planning, and a continuity copilot in one operational dashboard.

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
