@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
if exist "%SCRIPT_DIR%backend\mvnw.cmd" (
  call "%SCRIPT_DIR%backend\mvnw.cmd" %*
) else (
  echo Maven wrapper not found. Expected "%SCRIPT_DIR%backend\mvnw.cmd".
  exit /b 1
)
