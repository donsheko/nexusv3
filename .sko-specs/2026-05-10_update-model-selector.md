# 📝 Blueprint de Misión: Refactor Model Selector & Persistence

---
project_id: nexusv3
title: Refactor Model Selector & Persistence
context: |
  El usuario requiere que la Opción 6 del CLI (`bin/sko.js`) sea rediseñada para permitir una gestión persistente y por lotes de la asignación de modelos a agentes.
  
  Historia de Usuario:
  Como desarrollador de Sko-Nexus, quiero seleccionar modelos para mis agentes y guardar esos cambios en un archivo de estado intermedio (`opencode_selection.json`) antes de aplicarlos físicamente a los archivos de configuración local, para tener control total sobre la inyección de modelos.

  Asunciones Validadas:
  - Estructura JSON: `{ "agente": "proveedor/model" }`.
  - Detección Dinámica: Escaneo de `~/.config/opencode/agents/*.md`.
  - UI: `visibleOptionCount` aumentado a 20.
  - Flujo: Selección -> Persistencia en JSON -> Aplicación Manual ("Aplicar Agentes").
  ---
  Estrategia Técnica:
  1. Modificar `bin/core/models.js` para añadir `loadSelection()`, `saveSelection()` y actualizar `applyModels()` para operar desde el JSON.
  2. Rediseñar `bin/ui/ModelSelector.js` para manejar el estado de "Pendiente" y añadir el botón de acción global.
  3. Ajustar `bin/sko.js` si es necesario para asegurar que la navegación sea fluida.
---

## 🛠️ PLAN_DE_EJECUCION

### [STEP:1]
- **TITLE**: Core logic for opencode_selection.json
- **AGENT**: @desarrollador
- **DEPENDS_ON**: null
- **CONTEXT**: 
> bin/core/models.js
- **META**: 
> Implementar funciones loadSelection() y saveSelection(). 
> Asegurar que getLocalAgents() sea puramente dinámico leyendo la carpeta local.
> Modificar applyModels() para que pueda recibir el objeto de selección completo.

---

### [STEP:2]
- **TITLE**: Refactor ModelSelector UI
- **AGENT**: @desarrollador
- **DEPENDS_ON**: 1
- **CONTEXT**: 
> bin/ui/ModelSelector.js
- **META**: 
> Integrar el estado cargado desde opencode_selection.json.
> Actualizar el renderizado para mostrar estados: (Actual: X), (Nuevo: Y).
> Aumentar visibleOptionCount a 20.
> Añadir opción "🚀 Aplicar Cambios a Agentes" en el menú principal del selector.

---

### [STEP:3]
- **TITLE**: Final testing and verification
- **AGENT**: @explorador
- **DEPENDS_ON**: 2
- **CONTEXT**: 
> bin/sko.js
- **META**: 
> Verificar que los cambios se guarden en el JSON.
> Verificar que la inyección en los archivos .md sea correcta tras "Aplicar".
> Validar que la UI no se rompa con listas largas.

---

## 🏁 FIN_DEL_BLUEPRINT
