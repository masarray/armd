# ARMD release guide

ARMD ships as a native desktop Markdown editor/viewer for Windows and Linux.

## Release artifacts

A tagged release builds:

- `ARMD-Setup-<version>-x64.exe` — Windows 10/11 x64, modern Inno Setup installer.
- `ARMD-<version>-x86_64.AppImage` — portable Linux x64 application.
- `ARMD-<version>-amd64.deb` — Debian/Ubuntu x64 package.
- SHA-256 checksum files for both platforms.

## Windows installer

The Inno Setup installer is per-user by default, does not require elevation for a normal install, creates a Start Menu shortcut, offers an optional desktop shortcut, and offers a checked-once task to associate `.md` files with ARMD.

ARMD is also registered in Windows **Default apps** / **Open with** using a stable `ARMD.Markdown` ProgID. Windows 10/11 intentionally protects an existing `UserChoice`; when another app is already the default, Windows may ask the user to confirm ARMD rather than allowing an installer to silently replace that choice.

Build locally by double-clicking:

```text
BUILD-WINDOWS-RELEASE.cmd
```

## Linux

The AppImage is portable. The `.deb` package installs ARMD as a desktop application and advertises `text/markdown` / `.md` support so desktop environments can offer ARMD in **Open With** and default-application settings.

Build locally:

```bash
bash BUILD-LINUX-RELEASE.sh
```

## GitHub Actions

`.github/workflows/release-cross-platform.yml` runs on pull requests that touch release-sensitive files, can be started manually, and publishes a GitHub Release when a `v*` tag is pushed.

Example:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Branding

`build/app-icon.svg` is the single source of truth for the application icon. `scripts/generate-release-icons.mjs` creates Windows ICO, Linux PNG sizes, and browser favicon files before packaging.
