# 🛠️ Manual del Comando Global `sko` (v3.0)

Este documento detalla el funcionamiento de la interfaz de terminal (TUI) de Sko-Nexus v3 y la arquitectura de su motor de ejecución en `@bin/`.

---

## 🕹️ Guía del Menú Interactivo (TUI)

Al ejecutar `npm run sko` (o el alias `sko`), se presenta un menú con las siguientes capacidades:

### 1. Dashboard (Monitor & Más)
Un centro de control para la salud del sistema. Contiene tres sub-módulos:
*   **Monitor de Misiones (Live)**: Consulta MariaDB cada 3 segundos para mostrar las últimas 5 misiones activas, su porcentaje de progreso y estado. Permite forzar el cierre o eliminación de misiones.
*   **Crear Respaldo (ZIP)**: Genera un archivo comprimido por cada agente activo que contiene sus instrucciones, comandos, skills y configuración MCP actual.
*   **Modo Fresh (Purga Total)**: Elimina físicamente todas las inyecciones de Sko-Nexus en los agentes seleccionados, devolviéndolos a su estado "vainilla" (útil para desinstalaciones o limpiezas profundas).

### 2. Sincronizar Cerebro (Skills)
Orquesta la sincronización en dos niveles:
*   **SSOT (Nube)**: Carga todas las carpetas de `assets/skills/` en la tabla `skills` de MariaDB para que el servidor MCP pueda realizar búsquedas rápidas.
*   **Eficiencia (Local)**: Si tienes agentes inyectados y habilitados, despliega físicamente las skills en sus respectivas carpetas locales.

### 3. Autodetectar Agentes Locales
Escanea el sistema operativo en busca de rutas estándar de agentes AI (`.config/opencode`, `.claude`, `.gemini`, etc.). Los resultados se guardan en `agents_local.json` (ignorado por git) para uso de la CLI.

### 4. Inyectar Maestro y MCP a Agentes Locales
El proceso "corazón" de la instalación. Ejecuta 3 pasos secuenciales para cada agente elegido:

1.  **Vincular MCP**: 
    *   Registra el servidor `sko-brain` en el archivo de configuración del agente (ej: `opencode.json`).
    *   Inyecta automáticamente los plugins obligatorios definidos en el perfil (ej: `antigravity-auth`).
2.  **Inyectar Maestro**: 
    *   **Ensamblaje ADN**: Construye el `maestro.md` uniendo la base, la personalidad y el escudo de reglas (`shield.md`).
    *   **Bypass de Seguridad**: Crea un archivo `AGENTS.md` vacío para evitar que el agente haga fallback a configuraciones globales externas.
    *   **Copia de Comandos**: Copia físicamente todos los archivos `.md` de `assets/commands/` a la carpeta `commands/` local del agente. Esto habilita los comandos de barra inclinada (ej: `/sko-init`).
    *   **Soberanía de Shell**: Inyecta en el `.bashrc` / `.zshrc` el alias global `sko` y las variables `OPENCODE_DISABLE_CLAUDE_CODE` para blindar el entorno de ejecución.
3.  **Inyectar Subagentes & Skills**: 
    *   **Subagentes**: Copia los ejecutores (`@builder`, `@arquitecto`, etc.) desde `assets/subagents/`. A cada uno se le **anexa automáticamente el escudo de reglas (`shield.md`)** al final de sus instrucciones para garantizar el cumplimiento del protocolo.
    *   **Skills (Arsenal)**: Copia físicamente todas las carpetas de `assets/skills/` al disco local del agente. Esto permite que el agente consulte guías técnicas (Prisma, React, etc.) localmente sin depender de la red.


### 5. Detectar Modelos de Opencode
Consulta directamente a la CLI de OpenCode para obtener la lista actualizada de modelos y proveedores disponibles. 
*   **Identidad**: Antes de la detección, este comando inyecta automáticamente el `auth.json` local (si existe) en la ruta global de OpenCode, evitando que tengas que hacer login manualmente en nuevas máquinas.
*   **Caché**: El resultado se guarda en `opencode_models.json` para alimentar el selector de modelos.


### 6. Asignar Modelos a Agentes
Permite vincular un modelo específico (ej: `google/gemini-2.0-flash`) a un agente local específico. Esta acción **modifica físicamente** el frontmatter del archivo `.md` del agente en la carpeta del usuario, no en el repositorio.

### 7. Exportar Identidad OpenCode (auth.json)
Extrae las credenciales y tokens de la instalación global de OpenCode y genera un archivo `auth.json` en la raíz del proyecto. 
*   **Seguridad**: Este archivo está en el `.gitignore` y nunca debe subirse al repo. Sirve para que puedas mover tu identidad entre carpetas de trabajo manualmente.

### 8. Salir
Cierra la aplicación Ink y libera la terminal.

---

## 🏗️ Arquitectura de Carpeta `@bin/`

El motor está diseñado bajo el patrón **Logic-UI Separation** utilizando React 19 e Ink v7.

### 📂 `bin/` (Raíz)
*   **`sko.js`**: El "Main Loop". Orquesta las fases (Phase Management), maneja el estado global de la TUI y renderiza los componentes según la elección del usuario.

### 📂 `bin/core/` (Cerebro Lógico)
*   **`detector.js`**: Lógica de escaneo de archivos en el sistema operativo.
*   **`identity.js`**: Gestión de rutas globales (`~/.local/share/opencode`) y movimientos de archivos `auth.json`.
*   **`injector.js`**: El motor de despliegue. Sabe cómo ensamblar ADN y dónde copiar cada asset.
*   **`models.js`**: Interface con la CLI externa de OpenCode y manipulación de Frontmatter en archivos MD.
*   **`syncer.js`**: Puente entre los activos físicos de `assets/` y la base de datos MariaDB.
*   **`agents_global_config.js`**: Diccionario de perfiles. Define qué archivos necesita cada tipo de agente (OpenCode vs Claude).

### 📂 `bin/ui/` (Componentes Ink)
*   **`Banner.js`**: Logo ASCII y bienvenida.
*   **`AgentSelector.js`**: Interfaz de selección múltiple interactiva.
*   **`InjectionFlow.js`**: Renderiza spinners y progreso en tiempo real de la inyección.
*   **`ModelSelector.js`**: Flujo de 3 pasos para asignar modelos.
*   **`Dashboard.js`**: Contenedor del sub-menú de herramientas.
*   **`MissionMonitor.js`**: Visualizador dinámico del estado de la DB.
*   **`Summary.js`**: Tabla final con el resultado (Éxito/Error) de cada inyección.

### 📂 `bin/helpers/` (Utilidades Atómicas)
*   **`assembleADN.js`**: Constructor modular de las instrucciones del Maestro.
*   **`injectEnvVars.js`**: Inyector de variables de entorno y alias de shell (`.bashrc` / `.zshrc`).
*   **`getMCPConfigPath.js`**: Resuelve la ubicación del JSON de configuración según el agente.
*   **`pathExists.js`**: Wrapper async para validación de rutas.
*   **`readComponent.js`**: Utilidad para leer fragmentos de ADN con limpieza automática.
*   **`createBackup.js`**: Lógica de compresión ZIP.
*   **`purgeEnvironment.js`**: Lógica de borrado seguro.
