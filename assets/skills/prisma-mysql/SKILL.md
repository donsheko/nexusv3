---
name: Prisma MySQL
description: Guía oficial de Prisma 7 (ESM-first) para configuración con MySQL
---

# Prisma 7 con MySQL (ESM-First) - Estándar Oficial

Configuración basada en el Quickstart de Prisma v7 para MySQL.

## 1. Configuración del Proyecto (`prisma.config.ts`)
En Prisma 7, las credenciales se inyectan aquí.

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

## 2. Definición del Schema (`prisma/schema.prisma`)
El esquema es ahora declarativo y no contiene URLs.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "mysql"
}
```

## 3. Estructura de Variables de Entorno `.env`
Prisma 7 Quickstart recomienda un desglose total para mayor control:

```env
DATABASE_URL="mysql://username:password@localhost:3306/mydb"
DATABASE_USER="username"
DATABASE_PASSWORD="password"
DATABASE_NAME="mydb"
DATABASE_HOST="localhost"
DATABASE_PORT=3306
```

## 4. Notas de Migración (v7)
- **Engine**: Prisma 7 usa motores WASM por defecto para mayor ligereza.
- **CLI**: Comandos como `prisma db execute` ahora consumen el `prisma.config.ts` automáticamente sin necesidad de flags adicionales de URL.
