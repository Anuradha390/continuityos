# ContinuityOS

> ContinuityOS is a workforce resilience platform that stress-tests team capability, identifies single-person dependencies, and turns workforce risks into practical recovery plans.

ContinuityOS helps operations and people leaders understand where critical knowledge lives, measure backup readiness, and simulate targeted recovery actions before a disruption occurs. The project combines a workforce twin, dependency analysis, resilience scoring, scenario planning, and a continuity copilot in one operational dashboard.

## Integrated project description

ContinuityOS is an integrated workforce-continuity project built to help teams prepare for operational disruption. It brings together the complete workflow in one application:

- **Workforce intelligence:** maps people, roles, skills, workload, availability, and experience.
- **Critical-dependency analysis:** identifies single-person dependencies and continuity exposure.
- **Resilience scoring:** evaluates backup readiness, knowledge concentration, and recovery risk.
- **Scenario planning:** lets teams simulate a key-person absence and compare recovery strategies.
- **Recovery planning:** recommends cross-training, documentation, mentoring, and backup actions.
- **Workforce twin:** provides an interactive view of team capability and knowledge-transfer relationships.
- **Continuity Copilot:** answers operational questions using the project’s workforce evidence and explains the next action.
- **Integrated full-stack structure:** includes the React/Vite client, shared types, server routing, database schema, runtime helpers, and Render deployment configuration.

The goal is to move continuity planning from static documentation to an evidence-based operating workflow that shows **where the risk is, why it matters, and what the team should do next**.

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
