@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title ARMD - Windows Release Builder

where node >nul 2>nul || (
  echo [ERROR] Node.js is not installed or not in PATH.
  pause
  exit /b 1
)

where npm >nul 2>nul || (
  echo [ERROR] npm is not available.
  pause
  exit /b 1
)

echo.
echo === ARMD Windows Release ===
echo.

call npm ci --no-audit --no-fund || goto :error
call npm install --no-save --no-package-lock sharp@0.34.3 png-to-ico@2.1.8 || goto :error
node scripts\generate-release-icons.mjs || goto :error
call npm run build || goto :error
call npx electron-builder --config electron-builder.cross.yml --win dir --x64 --publish never || goto :error

set "ISCC=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if exist "%ISCC%" goto :have_inno
set "ISCC=%ProgramFiles%\Inno Setup 6\ISCC.exe"
if exist "%ISCC%" goto :have_inno

echo Inno Setup 6 was not found. Trying winget...
where winget >nul 2>nul && winget install --id JRSoftware.InnoSetup --exact --silent --accept-package-agreements --accept-source-agreements

set "ISCC=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if exist "%ISCC%" goto :have_inno
set "ISCC=%ProgramFiles%\Inno Setup 6\ISCC.exe"
if exist "%ISCC%" goto :have_inno

echo [ERROR] Inno Setup 6 is required. Install it from jrsoftware.org and run this file again.
pause
exit /b 1

:have_inno
for /f "usebackq delims=" %%V in (`node -p "require('./package.json').version"`) do set "APP_VERSION=%%V"
echo Building ARMD Setup !APP_VERSION! ...
"%ISCC%" "/DMyAppVersion=!APP_VERSION!" "installer\windows\armd.iss" || goto :error

powershell -NoProfile -ExecutionPolicy Bypass -Command "$files=Get-ChildItem 'release\ARMD-Setup-*.exe'; $lines=foreach($f in $files){$h=(Get-FileHash $f.FullName -Algorithm SHA256).Hash.ToLowerInvariant(); $h+'  '+$f.Name}; $lines ^| Set-Content 'release\SHA256SUMS-Windows.txt' -Encoding ascii" || goto :error

echo.
echo [OK] Windows release is ready in .\release
start "" explorer.exe "%CD%\release"
exit /b 0

:error
echo.
echo [ERROR] Build failed. See the message above.
pause
exit /b 1
