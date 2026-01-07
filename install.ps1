$ErrorActionPreference = "Stop"

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "     STREAM DELAY MANAGER - INSTALADOR AUTOMATICO" -ForegroundColor Cyan
Write-Host "     Fork de @STANIXDOR" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

# --- PASO 1: NODE.JS ---
Write-Host "[1/3] Verificando Node.js..." -ForegroundColor Yellow

if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "      [OK] Node.js encontrado." -ForegroundColor Green
}
else {
    Write-Host "      [!] Node.js no encontrado. Descargando..." -ForegroundColor Magenta
    
    $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    $nodeInstaller = "$env:TEMP\nodejs.msi"
    
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
    
    Write-Host "      Instalando Node.js..." -ForegroundColor Magenta
    Start-Process msiexec.exe -ArgumentList "/i", $nodeInstaller, "/passive", "/norestart" -Wait
    
    Remove-Item $nodeInstaller -Force
    
    # Refrescar entorno para el script actual
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    if (Get-Command node -ErrorAction SilentlyContinue) {
        Write-Host "      [OK] Node.js instalado correctamente." -ForegroundColor Green
    }
    else {
        Write-Host "      [!] Node.js requiere reinicio. Por favor reinicia y vuelve a ejecutar." -ForegroundColor Red
        Read-Host "Presiona Enter para salir"
        exit
    }
}
Write-Host ""

# --- PASO 2: PLUGIN SOURCE RECORD ---
Write-Host "[2/3] Verificando plugin Source Record..." -ForegroundColor Yellow

$pluginPath = "$env:APPDATA\obs-studio\plugins\source-record\bin\64bit\source-record.dll"
$pluginPathProg = "$env:ProgramFiles\obs-studio\obs-plugins\64bit\source-record.dll"

if ((Test-Path $pluginPath) -or (Test-Path $pluginPathProg)) {
    Write-Host "      [OK] Plugin ya instalado." -ForegroundColor Green
}
else {
    Write-Host "      [!] Plugin no encontrado. Descargando..." -ForegroundColor Magenta
    
    # URL directa del zip portable que funciona mejor
    $pluginUrl = "https://obsproject.com/forum/resources/source-record.1285/version/6239/download?file=113212"
    $pluginZip = "$env:TEMP\source-record.zip"
    $obsPluginsPath = "$env:APPDATA\obs-studio\plugins"

    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $pluginUrl -OutFile $pluginZip -UserAgent "Mozilla/5.0"
        
        if (!(Test-Path $obsPluginsPath)) {
            New-Item -ItemType Directory -Force -Path $obsPluginsPath | Out-Null
        }

        Write-Host "      Extrayendo..." -ForegroundColor Magenta
        
        # Extraer en una carpeta temporal primero
        $tempExtractPath = "$env:TEMP\obs-delay-extract"
        if (Test-Path $tempExtractPath) { Remove-Item $tempExtractPath -Recurse -Force }
        New-Item -ItemType Directory -Force -Path $tempExtractPath | Out-Null
        
        Expand-Archive -LiteralPath $pluginZip -DestinationPath $tempExtractPath -Force
        
        # Crear la estructura correcta en APPDATA
        $destRoot = "$obsPluginsPath\source-record"
        if (Test-Path $destRoot) { Remove-Item $destRoot -Recurse -Force }
        
        New-Item -ItemType Directory -Force -Path "$destRoot\bin\64bit" | Out-Null
        New-Item -ItemType Directory -Force -Path "$destRoot\data" | Out-Null
        
        # Mover binarios
        if (Test-Path "$tempExtractPath\obs-plugins\64bit\source-record.dll") {
            Copy-Item "$tempExtractPath\obs-plugins\64bit\*" "$destRoot\bin\64bit\" -Force
        }
        
        # Mover data/locale
        if (Test-Path "$tempExtractPath\data\obs-plugins\source-record") {
            Copy-Item "$tempExtractPath\data\obs-plugins\source-record\*" "$destRoot\data\" -Recurse -Force
        }
        
        # Limpieza
        Remove-Item $tempExtractPath -Recurse -Force
        Remove-Item $pluginZip -Force
        
        # Limpiar carpetas incorrectas de instalación previa si existen
        if (Test-Path "$obsPluginsPath\obs-plugins") { Remove-Item "$obsPluginsPath\obs-plugins" -Recurse -Force }
        if (Test-Path "$obsPluginsPath\data") { Remove-Item "$obsPluginsPath\data" -Recurse -Force }
        
        if (Test-Path "$destRoot\bin\64bit\source-record.dll") {
            Write-Host "      [OK] Plugin instalado en AppData." -ForegroundColor Green
            
            # INTENTO COPIAR A PROGRAM FILES (Requiere Admin)
            $progFilesPath = "$env:ProgramFiles\obs-studio\obs-plugins\64bit"
            $progFilesData = "$env:ProgramFiles\obs-studio\data\obs-plugins\source-record"
            
            if (Test-Path $progFilesPath) {
                Write-Host "      Intentando instalar en Program Files (Global)..." -ForegroundColor Yellow
                try {
                    Copy-Item "$destRoot\bin\64bit\*" "$progFilesPath\" -Force -ErrorAction Stop
                    
                    if (!(Test-Path $progFilesData)) { New-Item -ItemType Directory -Force -Path $progFilesData | Out-Null }
                    Copy-Item "$destRoot\data\*" "$progFilesData\" -Recurse -Force -ErrorAction Stop
                    
                    Write-Host "      [OK] INSTALADO EN PROGRAM FILES (Máxima compatibilidad)" -ForegroundColor Green
                }
                catch {
                    Write-Host "      [INFO] No se pudo escribir en Program Files (Faltan permisos), pero está en AppData." -ForegroundColor Gray
                }
            }
        }
        else {
            throw "Error al estructurar archivos"
        }
    }
    catch {
        Write-Host "      [!] Error en la descarga automatica: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "      Abriendo pagina de descarga manual..." -ForegroundColor Yellow
        Start-Process "https://obsproject.com/forum/resources/source-record.1285/"
    }
}
Write-Host ""

# --- PASO 3: APP CONFIG ---
Write-Host "[3/3] Configurando aplicacion..." -ForegroundColor Yellow

if (!(Test-Path "node_modules")) {
    Write-Host "      Instalando dependencias npm..." -ForegroundColor Magenta
    cmd /c "npm install --silent"
}

if (!(Test-Path "dist")) {
    Write-Host "      Compilando aplicacion..." -ForegroundColor Magenta
    cmd /c "npm run build"
}

Write-Host "      [OK] Aplicacion lista." -ForegroundColor Green
Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "                 INSTALACION COMPLETADA" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE - LEER ATENTAMENTE:" -ForegroundColor Red -BackgroundColor Yellow
Write-Host "1. El plugin 'Source Record' NO aparece en el botón '+' de fuentes." -ForegroundColor Yellow
Write-Host "2. Es un FILTRO." -ForegroundColor Yellow
Write-Host "   -> Clic derecho en una Fuente > Filtros > Botón '+' > Source Record" -ForegroundColor White
Write-Host ""
Write-Host "Todo listo. Para abrir la app haz doble clic en 'ABRIR.bat'" -ForegroundColor Green
Write-Host ""
Read-Host "Presiona Enter para finalizar"
