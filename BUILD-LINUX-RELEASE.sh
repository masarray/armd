#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

command -v node >/dev/null || { echo "[ERROR] Node.js is required."; exit 1; }
command -v npm >/dev/null || { echo "[ERROR] npm is required."; exit 1; }

echo "=== ARMD Linux Release ==="
npm ci --no-audit --no-fund
npm install --no-save --no-package-lock sharp@0.34.3 png-to-ico@2.1.8
node scripts/generate-release-icons.mjs
npm run build
npx electron-builder --config electron-builder.cross.yml --linux AppImage deb --x64 --publish never

version="$(node -p "require('./package.json').version")"
appimage="$(find release -maxdepth 1 -type f -name '*.AppImage' -print -quit)"
deb="$(find release -maxdepth 1 -type f -name '*.deb' -print -quit)"

[[ -n "$appimage" && -n "$deb" ]] || { echo "[ERROR] Linux artifacts were not produced."; exit 1; }

mv -f "$appimage" "release/ARMD-${version}-x86_64.AppImage"
mv -f "$deb" "release/ARMD-${version}-amd64.deb"
chmod +x "release/ARMD-${version}-x86_64.AppImage"
(
  cd release
  sha256sum "ARMD-${version}-x86_64.AppImage" "ARMD-${version}-amd64.deb" > SHA256SUMS-Linux.txt
)

echo "[OK] Linux release is ready in ./release"
printf '  %s\n' \
  "release/ARMD-${version}-x86_64.AppImage" \
  "release/ARMD-${version}-amd64.deb" \
  "release/SHA256SUMS-Linux.txt"
