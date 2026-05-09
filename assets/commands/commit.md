---
description: Genera un commit automático con los cambios actuales siguiendo las convenciones del proyecto y Conventional Commits.
---

# Generar Commit

Tu tarea es generar un commit para los cambios actuales.


## Lineamientos ##
1. Los commits deben ser en español.
2. Deben seguir el formato Conventional Commits: `<type>(<scope>): <subject>`.
3. Ejemplos de tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`, `revert`.
4. Ejemplos de scopes: `feat(core): add new feature` o `fix(auth): resolve login issue`.


## Tareas ##
1. Analiza el estado del repositorio (`git status` y `git diff`).
2. Genera un mensaje de commit conciso y descriptivo (máximo 72 caracteres para la primera línea).
3. Asegúrate de que no haya secretos en los archivos a commitear.
4. Ejecuta el commit.
