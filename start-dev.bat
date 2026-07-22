@echo off
REM Start backend and frontend dev servers in separate cmd windows
setlocal

REM Load environment variables from .env
for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    set "%%A=%%B"
)

REM Root directory of this script
set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

REM Start Backend
start "Backend" cmd /k "cd /d "%BACKEND%" & if exist mvnw.cmd (mvnw.cmd spring-boot:run) else (mvn spring-boot:run)"

REM Start Frontend
start "Frontend" cmd /k "cd /d "%FRONTEND%" & if exist npm.cmd (npm.cmd run dev) else (npm run dev)"

echo Launched backend and frontend in separate windows.
endlocal
pause
