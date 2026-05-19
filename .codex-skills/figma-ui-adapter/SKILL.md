---
name: figma-ui-adapter
description: Adapt Figma-exported React UI bundles into an existing production React application without importing their mock data, duplicate app shell, or design-system stack wholesale. Use when Codex needs to audit a `figma/` export, transfer `dashboard` or `popup` screens into an existing app, extract presentational JSX/CSS safely, compare dependencies, or build an integration plan that preserves the target app's architecture and data flow.
---

# Figma UI Adapter

Use this skill to turn a Figma-generated React export into a safe donor for production UI work.

## Quick Start

1. Identify the source export root, target app root, and the screen entry files to migrate.
2. Run `scripts/audit_figma_export.py` before editing anything.
3. Run `scripts/validate_skill.py` after changing the skill itself.
4. Read [references/integration-rules.md](references/integration-rules.md) for transfer constraints.
5. For this repository, read [references/time-wise-targets.md](references/time-wise-targets.md) before moving `dashboard` or `popup` UI.
6. Transfer only the presentational layer unless the target app explicitly adopts the exported stack.

Example:

```bash
python3 scripts/audit_figma_export.py \
  --figma-root /path/to/repo/figma \
  --target-root /path/to/repo \
  --entry src/app/components/Dashboard.tsx \
  --entry src/app/App.tsx
```

## Workflow

### 1. Audit the export

Run the audit script first. Use it to answer:

- Which external packages the export depends on
- Which packages are missing from the target app
- Which files contain local state, mock data, console logging, or global style coupling
- Whether the screen is a presentational donor or a candidate for leaf-component transplant

If the audit finds unsupported dependencies, mock data, or top-level app state, default to markup-and-styles transfer only.

### 2. Choose the transfer mode

Use one of these modes:

- `presentation-only`: Rebuild the screen in the target app using existing state, types, messaging, and analytics. This is the default.
- `leaf-component transplant`: Copy a small, stateless component with minimal edits when it has no mock data and no incompatible dependency stack.
- `stack adoption`: Only use when the target app is intentionally adopting the exported stack. Do not choose this by default.

### 3. Adapt into the target app

Apply these rules:

- Keep the target app's routing, bootstrap hooks, messaging, and data types.
- Replace exported mock data with typed props or existing selectors/hooks.
- Preserve the target app's styling approach unless the project explicitly decides otherwise.
- Import only the JSX structure, CSS tokens, SVG patterns, and small stateless helpers that survive review.
- Rewrite icons, charts, and controls when copying them would drag in a large dependency chain.

### 4. Validate the integration

After adapting the screen:

- run typecheck
- run the relevant tests
- run build
- verify loading, empty, error, and success states
- verify that debug and developer affordances still exist when required by the target app

## Transfer Heuristics

- Treat `App.tsx`, router shells, and bootstrap files as reference only.
- Treat files with `useState`, `useEffect`, hardcoded arrays, fake durations, or sample domains as non-transferable business logic.
- Prefer copying HTML structure and CSS semantics over copying the exported dependency graph.
- Prefer local target-side helpers over imported export-side utility layers.

## Bundled Resources

- `scripts/audit_figma_export.py`: Compare export dependencies to the target app and flag risky files.
- `scripts/validate_skill.py`: Validate the skill folder without external Python packages.
- `references/integration-rules.md`: Stable rules for safe UI transfer.
- `references/time-wise-targets.md`: This repository's target entrypoints, constraints, and recommended landing zones.
