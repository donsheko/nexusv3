# 📋 Lista de Pendientes para Producción (v3.3.4)
*Fecha de creación: 2024-05-10*

Esta lista detalla los ajustes técnicos y de seguridad necesarios antes de considerar el sistema Sko-Nexus v3 listo para despliegue final.

---

### 1. Blindaje del Parser (`parse_spec`)
- [ ] Validar si hay una mejor opcion para skill que carga el blueprint para facilitar la creacion global de la tarea.
- [x] **Robustez de Regex**: Mejorar el manejo de variaciones de formato en el Markdown (espacios, saltos de línea, indentación).
- [x] **Validación Pre-Inserción**: Verificar que el `projectId` exista y que los `stepNumber` sean coherentes antes de abrir la transacción en la DB.

### 2. Seguridad de Archivos (Path Traversal)
- [x] **Restricción de Directorio**: Validar en `sko_spec.js` que el `filePath` apunte exclusivamente a la carpeta `.sko-specs/`.

### 3. Gestión de Base de Datos
- [ ] **Script de Migración**: Preparar flujo de `prisma migrate deploy` para MariaDB remota.
- [x] **Template de Entorno**: Actualizar `.env.example` con todas las variables de conexión y secretos necesarios.

### 4. Integridad de Datos
- [x] **Validación de Transacciones**: Confirmar el comportamiento del rollback en `prisma.$transaction` ante fallos en inserciones masivas.


### 5. Verificación de Identidad
- [ ] **Prueba de Sincronización**: Validar la persistencia de la identidad en la ruta global de OpenCode (`auth.json`) migrada de v2.

### 6. Higiene del Proyecto
- [ ] **Depuración de Assets**: Eliminar archivos de comandos (`.md`) y skills obsoletas que no pertenecen al protocolo v3.3.

---

### 💡 Próximos Pasos (Post-Producción)
- Implementar comando de purga de misiones antiguas.
- Evolución del Dashboard interactivo en la CLI.
