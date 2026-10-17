@echo off
cd /d "%~dp0"
set "NODE_RUNTIME=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%NODE_RUNTIME%" (
  "%NODE_RUNTIME%" server.cjs
) else (
  node server.cjs
)
pause
