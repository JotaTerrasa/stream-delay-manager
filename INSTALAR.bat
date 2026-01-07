@echo off
title Instalador Stream Delay Manager (Admin)
color 0D

:: Forzar ejecucion como Administrador
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo.
    echo Solicitando permisos de Administrador...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    if exist "%temp%\getadmin.vbs" ( del "%temp%\getadmin.vbs" )
    pushd "%CD%"
    CD /D "%~dp0"

echo.
echo =======================================================
echo   MODO ADMINISTRADOR ACTIVADO
echo   Instalando en Program Files para asegurar visibilidad
echo =======================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" -AdminMode $true

if %errorlevel% neq 0 (
    echo.
    echo Ocurrio un error.
    pause
)
