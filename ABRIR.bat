@echo off
title OBS Delay Controller
color 0D

:: Verificar que la app esta compilada
if not exist "dist\index.html" (
    echo.
    echo  [!] La aplicacion no esta instalada.
    echo  Por favor, ejecuta primero INSTALAR.bat
    echo.
    pause
    exit /b 1
)

echo.
echo  ==============================================================
echo       OBS DELAY CONTROLLER
echo  ==============================================================
echo.
echo   La aplicacion se abrira en tu navegador.
echo.
echo   Para CERRAR la aplicacion:
echo   - Simplemente cierra ESTA VENTANA
echo.
echo  ==============================================================
echo.

:: Abrir navegador despues de 2 segundos
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:4173"

:: Iniciar servidor (npx serve sirve la carpeta dist)
npx --yes serve dist -l 4173 -s
