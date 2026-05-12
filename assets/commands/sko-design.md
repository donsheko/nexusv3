---
description: Delega una tarea de interfaz de usuario y estética al @Diseñador.
agent: disenador
---

Carga el protocolo desde `~/.config/opencode/skills/sko-protocol-step-run/SKILL.md` para ejecutar el paso asignado.

$1 - listado de IDs de pasos asignados (ej: `[12, 13, 14]`)

Tu misión es ejecutar el lote de pasos **$1** asignados en el DAG siguiendo estrictamente el protocolo sko-protocol-step-run. Mantén la continuidad visual entre pasos.

## Restricción Crítica
- **Prohibición de comandos destructivos**: Queda estrictamente prohibido el uso de `php artisan migrate:fresh`, `npx prisma migrate reset` o cualquier comando equivalente que destruya datos o tablas. Se debe utilizar exclusivamente la creación de migraciones incrementales para cualquier cambio en el esquema de la base de datos.
