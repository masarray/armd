# Windows release checklist

1. Install Node.js 22.12 or newer.
2. Double-click `BUILD-RELEASE.cmd`.
3. Confirm both files exist:
   - `release/Inkwell-Setup-<version>-x64.exe`
   - `release/Inkwell-Portable-<version>-x64.exe`
4. Install the NSIS build and verify:
   - application starts from Start Menu and Desktop shortcut;
   - `.md` appears in **Open with** and opens in the existing Inkwell window;
   - Save writes to the original path;
   - Print/PDF produces a clean A4 document.
5. Run the portable EXE from a folder with spaces and verify it starts without installation.
6. Confirm a second `.md` opened from Explorer becomes another workspace tab.
7. Create and push the release tag only after the checks pass.
