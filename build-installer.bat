@echo off
setlocal
cd /d "%~dp0"
title Build Eudora installer

rem Windows needs admin rights to unpack one of the build tools (symbolic links), so ask for them once
net session >nul 2>nul
if errorlevel 1 (
  echo Asking for administrator rights...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Download the LTS version from https://nodejs.org and run this again.
  pause
  exit /b 1
)
set CSC_IDENTITY_AUTO_DISCOVERY=false
rem remove half-unpacked leftovers from a failed earlier try
if exist "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"
echo Installing build tools (first time takes a few minutes)...
call npm install --no-audit --no-fund
if errorlevel 1 goto fail
echo Building the installer...
call npm run dist
if errorlevel 1 goto fail
echo.
echo Done! Your installer is in the "dist" folder: Eudora-Setup.exe
start "" "%~dp0dist"
pause
exit /b 0
:fail
echo.
echo Something went wrong. Copy the red text above and send it to me.
pause
exit /b 1
