---
name: Prisma Core
description: Guía global de Prisma 7 para gestión de migraciones, seeders y mejores prácticas de arquitectura
---

# Prisma 7 Core: Migraciones, Seeders y Operaciones

Esta guía establece el estándar global para trabajar con Prisma v7 en Sko-Nexus, centrándose en el flujo de trabajo de desarrollo y despliegue.

## 1. Configuración Maestra (`prisma.config.ts`)

En la v7, el archivo de configuración centraliza la orquestación del CLI.

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

type Env = {
  DATABASE_URL: string;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts", // Comando oficial de seeding
  },
  datasource: {
    url: env<Env>("DATABASE_URL"),
  },
});
```

## 2. Flujo de Migraciones

### Desarrollo
Para crear y aplicar una migración en tu entorno local:
```bash
npx prisma migrate dev --name descripcion_del_cambio
```
*Este comando genera el SQL, lo aplica y regenera el Prisma Client.*

### Producción / CI-CD
Para aplicar migraciones pendientes sin resetear la base de datos:
```bash
npx prisma migrate deploy
```

### Prototipado Rápido
Si solo quieres sincronizar el schema con la DB sin crear archivos de migración (útil en fases iniciales):
```bash
npx prisma db push
```

## 3. Sistema de Seeding (`prisma/seed.ts` o `prisma/seed.js`)

Prisma 7 recomienda usar `tsx` para TypeScript, pero en proyectos **JavaScript**, puedes usar un archivo `.js`.

### Configuración en `prisma.config.ts`:
```typescript
seed: "node prisma/seed.js", // Para proyectos JS
// o
seed: "npx tsx prisma/seed.ts", // Para proyectos TS
```

### Ejemplo de `prisma/seed.js` con soporte para `.env`:
```javascript
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seeding...");
  
  const email = process.env.ADMIN_EMAIL || "admin@example.com";

  await prisma.user.upsert({
    where: { email: email },
    update: {},
    create: {
      email: email,
      name: process.env.ADMIN_USER || "Admin",
    },
  });

  console.log("✅ Seeding completado.");
}
// ... resto del boilerplate de main()
```

Para ejecutarlo manualmente:
```bash
npx prisma db seed
```

## 4. Comandos Esenciales del CLI

| Comando | Descripción |
| :--- | :--- |
| `npx prisma generate` | Regenera los tipos del cliente (TypeScript). |
| `npx prisma studio` | Abre el explorador de datos en el navegador. |
| `npx prisma validate` | Verifica la sintaxis del archivo `.prisma`. |
| `npx prisma format` | Auto-formatea tu schema. |
| `npx prisma migrate reset` | Borra todos los datos y reaplica migraciones (CUIDADO). |
| `npx prisma db pull` | Sincroniza el schema con una base de datos existente. |

## 5. Mejores Prácticas (Standard Sko-Nexus)

1.  **Uso de `upsert` en Seeds**: Evita errores de duplicados al ejecutar el seed múltiples veces.
2.  **Migraciones Descriptivas**: Usa nombres claros para las migraciones (ej: `--name add_user_roles`).
3.  **Validación de Schema**: Siempre corre `npx prisma validate` antes de subir código.
4.  **No modificar SQL manual**: Evita modificar los archivos `.sql` generados a menos que sea estrictamente necesario (ej: triggers complejos).
5.  **Driver Adapters**: Para entornos Serverless/Edge, asegúrate de haber configurado el adaptador correcto en el instanciador del cliente (ver skills de Postgres/SQLite).
