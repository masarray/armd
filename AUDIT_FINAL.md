# Final release audit

Date: 2026-08-05

## Removed

- `.lovable/` project metadata and all Lovable-specific source references.
- `@lovable.dev/vite-tanstack-config` and the TanStack Start/Nitro production server path.
- Generated shadcn UI components and unrelated dependencies that were not used by the editor.
- Bun-specific files and stale generated lock data from the previous scaffold.

## Final architecture

- Static Vite + React SPA.
- Electron loads the packaged `dist/index.html` directly; no local production web server or child process.
- Context-isolated, sandboxed preload bridge; Node integration is disabled in the renderer.
- One running desktop instance receives additional `.md`, `.markdown`, and `.mdx` files as workspace tabs.
- GitHub rendering mode is the default; Writer mode remains available.

## Windows outputs

`BUILD-RELEASE.cmd` produces:

- `release/Inkwell-Setup-<version>-x64.exe`
- `release/Inkwell-Portable-<version>-x64.exe`
- `release/SHA256SUMS.txt`

The NSIS installer is per-machine so Windows file associations can be registered. The portable build is one EXE and intentionally does not change file associations or the registry.

## One-click entry points

- `RUN-DEV.cmd`: install dependencies and run Vite + Electron.
- `BUILD-AND-RUN.cmd`: validate, create the unpacked production app, and launch it.
- `BUILD-RELEASE.cmd`: validate and create installer + portable EXE.

## Validation performed in the audit environment

Passed:

- Electron main/preload JavaScript syntax checks.
- Package JSON and GitHub Actions YAML parsing.
- Relative TypeScript import resolution.
- Windows icon structure (256 x 256 ICO).
- Search for Lovable/TanStack Start/Nitro/Vinxi remnants.
- Basic PowerShell structure checks.

Not completed in this environment:

- Full `npm install`, TypeScript dependency-aware checking, Vite build, and electron-builder packaging. The audit container's internal npm registry returned a 404 for a public package. Run `BUILD-RELEASE.cmd` on Windows with normal npm registry access; the script stops immediately if validation or packaging fails.
