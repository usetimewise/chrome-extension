# Integration Rules

## Allowed to transfer

- JSX layout structure
- static SVG markup
- spacing, radius, color, and typography tokens
- small stateless presentational helpers
- CSS rules that are local to the target screen

## Must be rewritten or adapted

- mock data arrays and hardcoded metrics
- top-level `useState` / `useEffect` screen logic
- app shell composition
- navigation, routing, or browser integration
- analytics wiring, background messaging, storage access
- debug and feature-flag behavior

## Dependency policy

Default stance: do not import the exported design-system stack into the production app.

Block direct transfer when the export introduces:

- a new global styling framework
- charting or component libraries not already used by the app
- icon packages when existing icons already cover the use case
- router, form, or state-management libraries that duplicate the target app

Only adopt a new dependency when:

- the target app already uses it, or
- the dependency clearly reduces long-term maintenance cost and the user explicitly accepts the tradeoff

## Review checklist

- Does the adapted component consume target-side props and types instead of export-side mocks?
- Does it keep target-side loading, empty, error, and success behavior?
- Does it avoid importing export-side `App`, router, or bootstrap files?
- Does it avoid global CSS collisions?
- Does it avoid hidden dependency creep?
- Does it preserve accessibility and semantic controls?

## Red flags

- copied `package.json` dependencies
- copied `main.tsx` or app bootstrap
- copied tailwind/shadcn stack into a non-tailwind app
- copied demo notifications, fake durations, or hardcoded site lists
- copied stateful chart wrappers when a small SVG/CSS version is enough
