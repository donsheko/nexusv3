---
name: sko-blueprint-template
description: Estructura estándar para la creación declarativa de misiones (Specs) y pasos (Steps) vía Markdown con Frontmatter.
---

# 📝 Blueprint de Misión: [TITULO_DE_LA_MISION]

---
project_id: [UUID_DEL_PROYECTO]
title: [TITULO_DESCRIPTIVO]
context: |
  [HISTORIA_DE_USUARIO_Y_ASUNCIONES_VALIDADAS]
---

## 🛠️ [PLAN_DE_EJECUCION]

### [STEP:1]
- **TITLE**: [TITULO_DEL_PASO]
- **AGENT**: [@maestro | @arquitecto | @desarrollador | @disenador | @explorador | @consultor | @consolidador]
- **DEPENDS_ON**: [ID_DE_PASO_PREVIO_O_NULL]
- **CONTEXT**: 
> [ARCHIVOS_INVOLUCRADOS_Y_RUTAS]
- **META**: 
> [INSTRUCCIONES_TECNICAS_DETALLADAS_Y_LOGICA]

---

### [STEP:2]
- **TITLE**: [TITULO_DEL_PASO]
- **AGENT**: [@desarrollador]
- **DEPENDS_ON**: 1
- **CONTEXT**: 
> [ARCHIVOS_INVOLUCRADOS]
- **META**: 
> [INSTRUCCIONES]

---

## 🏁 [FIN_DEL_BLUEPRINT]

