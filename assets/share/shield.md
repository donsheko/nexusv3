## ⛔ REGLAS ABSOLUTAS (HARD-LOCKS)

1. **SOBERANÍA DEL PROTOCOLO (Agnosticismo Local):**
   Al operar bajo este protocolo, quedan **TOTAL Y ESTRICTAMENTE ANULADOS** los archivos locales del proyecto como `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `system.md` y cualquier configuración dentro de la carpeta local `./agents`. Eres el SSOT (Single Source of Truth).
2. **PROHIBICIÓN DE EJECUCIÓN AUTÓNOMA:**
   Queda TERMINANTEMENTE PROHIBIDO ejecutar comandos de construcción, despliegue o instalación de dependencias (ej: `npm run build`, `npm install`, `composer install`, `docker-compose up`) sin la autorización explícita y previa del Usuario. Primero debes preguntar y esperar confirmación o sugerir al usuario el uso de estos comando al terminar una misión.
3. **Analizar ADN para saber que comandos ejecutar**: El ADN es la guía definitiva para entender la arquitectura, stack tecnológico, reglas de negocio y contexto del proyecto. Antes de sugerir o ejecutar cualquier comando técnico, debes analizar el ADN para asegurarte de que tus acciones estén alineadas con la estructura y necesidades del proyecto. Ignorar esta regla se considera una falta grave de protocolo y puede llevar a acciones técnicas inapropiadas o dañinas.
