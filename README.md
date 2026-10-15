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

## Architecture

ContinuityOS is organized as a full-stack TypeScript application:

```text
client/          React/Vite interface, pages, dashboard components, workforce twin, and styles
shared/          Shared constants and domain types used across the application
server/          Express/tRPC runtime, routing, authentication helpers, integrations, and services
drizzle/         Database schema and relationship definitions
public/          Static brand assets and route metadata
render.yaml      Render Static Site deployment configuration
```

The browser client provides the interactive dashboard and demo workflow. Shared types keep the client and server contracts aligned. The server layer provides the integration boundary for authenticated APIs and persistence, while Drizzle defines the relational data model. The current Render deployment is configured for the static client build.

## Prototype status

**Status: functional prototype / demo-ready.**

The current prototype includes a working workforce dashboard, seeded workforce evidence, resilience scoring, dependency analysis, scenario simulation, workforce-twin views, recovery recommendations, project setup interactions, and the Continuity Copilot experience. It is suitable for product demonstrations, user feedback, and workflow validation.

Before production use, the project would still need production authentication, persistent environment-specific data, database migrations and provisioning, observability, access controls, automated tests, and deployment-specific secret configuration.

## Data boundary

The demo is intentionally bounded to seeded and user-entered project information:

- No production employee records, credentials, or private customer datasets are included in this repository.
- Demo workforce profiles and continuity evidence are sample data used to demonstrate the workflow.
- Secrets and environment values are excluded from GitHub; use environment configuration in the target deployment.
- The client and server are separated so production integrations can be connected behind an explicit API boundary.
- Any real deployment should apply least-privilege access, data minimization, retention rules, audit logging, and appropriate privacy controls before importing workforce data.

## Optimization objective

The product is designed to optimize for **continuity risk reduction**, not simply for a higher dashboard score. A recovery plan should aim to:

1. Reduce single-person dependencies around critical skills and work.
2. Increase verified backup readiness and knowledge-transfer coverage.
3. Improve the time-to-recovery for a key-person absence.
4. Balance workload so recovery actions do not create a second operational bottleneck.
5. Prefer practical actions such as cross-training, documentation, mentoring, and staged handoffs.

The prototype surfaces these trade-offs through evidence, scores, scenarios, and recommended next actions. A production optimization service could later formalize the objective as a weighted risk function constrained by capacity, skill thresholds, availability, and training effort.

## Running locally

Requirements: Node.js, Corepack, and pnpm.

```bash
corepack enable
pnpm install
pnpm dev
```

For a production-style local build:

```bash
pnpm run build
pnpm run start
```

Useful checks:

```bash
pnpm run check
pnpm run test
```

The Render deployment uses the same build path through `render.yaml`; no fixed application port is required for the static site.

## Demo workflow

1. Open the application and review the ContinuityOS overview dashboard.
2. Inspect the resilience score, critical dependency, and current recovery posture.
3. Open the workforce twin to explore people, skills, workload, and knowledge-transfer relationships.
4. Select a person or capability to review the evidence behind the risk and readiness score.
5. Open the scenario view and simulate the absence of a critical owner.
6. Compare the suggested recovery strategies, such as cross-training, documentation, or mentoring.
7. Apply a recovery action and observe the projected change in backup readiness and continuity exposure.
8. Use the Continuity Copilot to ask which dependency is most urgent, what evidence supports it, and what action should happen next.
9. Review the project setup and team-builder interactions to see how a new initiative can be evaluated against available capability.
10. Use the resulting recovery plan as the handoff artifact for operational follow-up.
