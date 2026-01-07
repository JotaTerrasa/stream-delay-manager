# Stream Delay Manager

<p align="center">
  <img src="https://img.shields.io/badge/OBS-WebSocket-blueviolet?style=for-the-badge&logo=obsstudio" alt="OBS WebSocket">
  <img src="https://img.shields.io/badge/React-Virtual_Dom-61dafb?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">
</p>

<p align="center">
  <strong>Herramienta profesional para gestionar el delay en OBS Studio con un solo PC.</strong><br>
  Controla escenas, fuentes y la cámara virtual automáticamente para aplicar retraso en tu stream.
</p>

<p align="center">
  <a href="https://www.obsdelay.com/">Web Original</a> •
  <a href="https://x.com/STANIXDOR">Basado en el trabajo de: @STANIXDOR</a>
</p>

---

## Instalación Automática (Recomendada)

Hemos creado un instalador que hace todo el trabajo difícil por ti.

### Requisitos
- **Windows 10/11**
- **OBS Studio** (Versión 28 o superior)

### Pasos
1. **Descarga** este repositorio (Botón verde "Code" -> "Download ZIP") y descomprímelo.
2. Haz **doble clic** en el archivo:
   ```
   INSTALAR.bat
   ```
3. El script hará lo siguiente automáticamente:
   - Verificará si tienes **Node.js** (y lo instalará si falta).
   - Descargará e instalará el plugin **Source Record** de Exeldro.
   - Pedirá **permisos de Administrador** para instalar el plugin en la carpeta de OBS (asegurando que funcione).
   - Instalará y compilará la aplicación.

---

## Cómo Iniciar la App

Una vez instalado, para usar la herramienta día a día:

1. Haz **doble clic** en:
   ```
   ABRIR.bat
   ```
2. Se abrirá una ventana negra (no la cierres) y la aplicación en tu navegador.
3. Para **cerrar**, simplemente cierra la ventana negra.

---

## Configuración en OBS Studio (IMPORTANTE)

Para que el sistema funcione, necesitas configurar OBS correctamente.

### 1. Activar WebSocket
La app se comunica con OBS mediante WebSocket.
1. Abre OBS.
2. Ve a **Herramientas** > **Configuración del servidor WebSocket**.
3. Marca la casilla **"Habilitar servidor WebSocket"**.
4. (Opcional) Pon una contraseña.
5. Clic en **Aplicar**.

### 2. Configurar el Plugin "Source Record"
**¡ATENCIÓN! ESTE ES EL PASO MÁS IMPORTANTE**

El plugin "Source Record" **NO aparece** en la lista de fuentes (botón `+`). Es un **FILTRO**.

1. Decide qué quieres retrasar (normalmente tu **Cámara** o una **Escena** completa).
2. Haz **clic derecho** sobre esa Fuente o Escena.
3. Selecciona **Filtros**.
4. En la parte inferior izquierda (Filtros de efectos), haz clic en el botón **`+`**.
5. Selecciona **"Source Record"**.
6. Ponle un nombre (ej: "Grabadora Delay").
7. En las propiedades del filtro:
   - **Mode**: "Memory" (para delay corto) o "File" (para grabaciones largas).
   - Ajusta lo necesario y cierra.

---

## Guía de Uso

### 1. Conectar
- Abre la app web.
- Introduce el puerto (4455 por defecto) y contraseña de OBS.
- Clic en **Conectar a OBS**.

### 2. Preparar Escenas
Necesitas tener organizadas tus escenas en OBS:
- **Escena Directo**: Tu escena normal sin delay.
- **Escena Delay**: Una escena donde pondrás la fuente que reproduce el video retrasado.
- **Fuente Puente**: Un video o imagen que se muestra durante la transición (para que no se vea negro).

### 3. Configurar en la App
Ve a la pestaña **Configuración** y selecciona:
- **Escena Principal**: Donde estás transmitiendo ahora.
- **Escena Delay**: A la que cambiará la app.
- **Video Delay**: La fuente de "Media Source" que reproducirá el archivo generado por "Source Record".

### 4. Activar
Ve a la pestaña **Control**:
- Elige el tiempo de retraso.
- Dale a **Activar Delay**.
- La app gestionará la grabación, esperará el tiempo, y cambiará la escena automáticamente.

---

## Estructura del Proyecto

```
obs-delay-controller/
├── INSTALAR.bat        # Ejecutar PRIMERO (Instalador completo)
├── ABRIR.bat           # Ejecutar para USAR (Lanzador)
├── install.ps1         # Script lógico de instalación (PowerShell)
├── src/                # Código fuente React
├── dist/               # Aplicación compilada
└── README.md           # Documentación
```

---

## Solución de Problemas

### "El plugin Source Record no aparece en OBS"
1. Asegúrate de haber ejecutado `INSTALAR.bat` y haber dado permisos de Administrador.
2. **Reinicia OBS COMPLETAMENTE** (ciérralo y ábrelo de nuevo).
3. Recuerda: **Es un FILTRO**, no una fuente. Búscalo en Click Derecho > Filtros.

### "No conecta con OBS"
1. Verifica que el WebSocket esté activado (Herramientas > WebSocket).
2. Verifica que el puerto sea `4455` (o el que hayas puesto).
3. Si tienes contraseña, escríbela en la app.

---

## Licencia y Créditos

Este proyecto es una herramienta de código abierto bajo licencia **MIT**.

- **Autor Original de la idea**: [@STANIXDOR](https://x.com/STANIXDOR)
- **Plugin Source Record**: [Exeldro](https://obsproject.com/forum/resources/source-record.1285/)
- **Desarrollo del Fork**: [Jaime Terrasa](https://www.linkedin.com/in/jaimeterrasa/)

---
<p align="center">Hecho con ❤️ para streamers</p>
