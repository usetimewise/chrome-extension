# Time Wise Targets

Use this reference when adapting Figma exports into the current repository.

## UI entrypoints

- Dashboard mount: `src/ui/dashboard.tsx`
- Dashboard app: `src/ui/dashboard/index.tsx`
- Dashboard styles: `src/ui/dashboard.css`
- Popup mount: `src/ui/popup.tsx`
- Popup app: `src/ui/popup/index.tsx`
- Popup styles: `src/ui/popup.css`

## Data ownership

- Dashboard data comes from `useDashboardBootstrap()` and `bootstrap.dashboardCache`.
- Dashboard analytics view model lives in `DashboardOverview`.
- Popup data comes from `usePopupBootstrap()` and `bootstrap.popupModel`.
- Background messaging and storage logic live outside `src/ui/`.

## Project constraints

- Keep the existing React + Vite + TypeScript stack.
- Do not add the Figma export's dependency graph by default.
- Use the app's existing data flow instead of copied local screen state.
- Prefer plain CSS in the existing screen stylesheet over introducing Tailwind.
- Preserve current extension-specific actions such as opening dashboard/debug pages and toggling focus mode.

## Recommended landing zones

### Dashboard export

- use `figma/src/app/components/Dashboard.tsx` only as a presentation donor
- adapt layout into `src/ui/dashboard/components/overview-dashboard.tsx`
- keep `src/ui/dashboard/index.tsx` as the shell and bootstrap boundary

### Popup export

- use `figma/src/app/App.tsx` only as a presentation donor for popup layout ideas
- adapt layout into `src/ui/popup/index.tsx` and small popup components
- keep focus-session actions and background messaging in the target popup code
