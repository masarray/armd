# Inkwell

Inkwell is a lightweight, offline-first Markdown editor for Windows. It provides direct WYSIWYG editing, raw Markdown mode, a GitHub-style preview theme, multi-document tabs, tables, task lists, GitHub alerts, code highlighting, and smart PDF export.

## Release outputs

A full Windows release produces two separate files in `release/`:

- `Inkwell-Setup-<version>-x64.exe` — NSIS installer with Start Menu/Desktop shortcuts and Markdown file association.
- `Inkwell-Portable-<version>-x64.exe` — standalone single-file portable application; no installation or registry changes.

The installer registers `.md`, `.markdown`, and `.mdx` as documents editable by Inkwell. Windows may still ask the user to confirm the default app when another editor already owns those extensions.

## One-click Windows commands

From File Explorer, double-click:

- `RUN-DEV.cmd` — install/check dependencies, start Vite, then run Electron development mode.
- `BUILD-AND-RUN.cmd` — validate, build the unpacked production app, then launch it.
- `BUILD-RELEASE.cmd` — validate and create both installer and portable EXE, then open the `release` folder.

Requirements: Windows 10/11 x64 and Node.js 22.12 or newer.

## Command line

```powershell
npm install
npm run check
npm run desktop:dist
```

Other useful commands:

```powershell
npm run dev                 # browser development server
npm run desktop:dev         # Electron against the running Vite server
npm run desktop:pack        # unpacked production app
npm run desktop:installer   # installer only
npm run desktop:portable    # portable EXE only
```

## Release workflow

`.github/workflows/release-windows.yml` validates pull requests and can be run manually. Pushing a tag such as `v1.0.0` builds and uploads both EXE files to a GitHub Release.

```powershell
git tag v1.0.0
git push origin v1.0.0
```

Optional Authenticode signing secrets:

- `WINDOWS_CSC_LINK`
- `WINDOWS_CSC_KEY_PASSWORD`

Unsigned builds remain functional but Windows SmartScreen may display a warning.

## Architecture

The production application is a static Vite SPA loaded directly by Electron. It does not start a local web server, does not run Nitro, and does not require an internet connection for the editor itself. Remote images referenced by a Markdown document naturally require network access.

Electron exposes only a narrow context-isolated bridge for Open, Save, PDF export, and file-association events. Node integration is disabled in the renderer.

## License

MIT
