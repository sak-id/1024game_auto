# Repository Guidelines
These notes help maintain the autoplayer-ready 1024 puzzle in this repo.

## Project Structure & Module Organization
- `src/main.tsx` boots the React app and wires providers.
- `src/App.tsx` toggles between `components/Settings` and `components/GameBoard`.
- UI pieces live under `src/components`, shared logic in `src/hooks`, and pure helpers such as AI search under `src/lib`. Static HTML and icons stay in `public/`. Keep new workers or audio assets co-located with their feature folders.

## Build, Test, and Development Commands
- `npm install` syncs dependencies; commit the lockfile when it changes.
- `npm run dev` launches Vite with hot reload at `http://localhost:5173`.
- `npm run build` runs `tsc -b` for type checking then bundles to `dist/`.
- `npm run preview` serves the production bundle for smoke testing.
- `npm run lint` executes ESLint; ensure a clean run before opening a PR.

## Coding Style & Naming Conventions
- TypeScript + React with functional components; prefer hooks.
- Use 2-space indentation, double quotes for strings, and end statements with semicolons in line with existing files.
- Components/hooks in PascalCase, helper functions in camelCase, and co-locate `.css` files with their owners.
- Rely on `eslint.config.js`; fix violations with `npm run lint -- --fix` when appropriate.

## Testing Guidelines
- No automated tests yet; add unit or integration specs next to the code (e.g., `src/lib/ai.test.ts` or `src/components/GameBoard.test.tsx`) using a Vite-compatible runner.
- Until a test harness exists, verify changes manually via `npm run dev`, covering manual play, auto-play, and worker teardown.
- Document any new test scripts in `package.json` and update this guide when introducing `npm run test`.

## Commit & Pull Request Guidelines
- Follow the log style: short, lower-case summaries that describe the scope (e.g., `optimize ai worker`).
- Reference related issues in the body, list manual verification steps, and add screenshots or clips for UI adjustments.
- Highlight how the change impacts auto-play behavior, settings, or performance to keep reviewers focused.
