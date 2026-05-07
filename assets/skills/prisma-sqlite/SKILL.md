---
name: Prisma SQLite
description: Guía oficial de Prisma 7 (ESM-first) para configuración con SQLite y LibSQL
---

# Prisma 7 con SQLite (ESM-First) - Estándar Oficial

Configuración optimizada para desarrollo local y despliegues en el Edge usando el nuevo estándar de configuración de Prisma v7.

## 1. Configuración del Proyecto (`prisma.config.ts`)

**IMPORTANTE:** En Prisma 7, las rutas relativas de SQLite se resuelven respecto a la ubicación de `prisma.config.ts`, no del archivo `.prisma`.

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Tipado para variables de entorno
type Env = {
  DATABASE_URL: string;
  TURSO_AUTH_TOKEN?: string; // Solo si se usa LibSQL/Turso
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Uso de genéricos para validación de tipos
    url: env<Env>("DATABASE_URL"),
  },
});
```

## 2. Definición del Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider        = "prisma-client"
  output          = "../generated/prisma"
  // Requerido para usar adaptadores como LibSQL (Turso)
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite" // O "postgresql" / "mysql" si se usa el adaptador correspondiente
}
```

## 3. Soporte para Entornos Node.js (better-sqlite3)

Para desarrollo local en Node.js, se recomienda el uso del adaptador `better-sqlite3`:

```bash
npm install better-sqlite3 @prisma/adapter-better-sqlite3
```

Instanciación del cliente:

```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db'
})
const prisma = new PrismaClient({ adapter })
```

## 4. Soporte para LibSQL / Turso (SQLite en el Edge)

Para usar SQLite en entornos WASM (Cloudflare Workers, etc.), se recomienda LibSQL:

```bash
npm install @libsql/client @prisma/adapter-libsql
```

Instanciación del cliente:

```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const libsql = createClient({ 
  url: process.env.DATABASE_URL as string, 
  authToken: process.env.TURSO_AUTH_TOKEN 
})
const adapter = new PrismaLibSQL(libsql)
const prisma = new PrismaClient({ adapter })
```

## 4. Variables de Entorno `.env`

```env
# Local SQLite (Relativo a prisma.config.ts)
DATABASE_URL="file:./dev.db"

# Turso / LibSQL (Cloud)
# DATABASE_URL="libsql://your-db-name.turso.io"
# TURSO_AUTH_TOKEN="your-auth-token"
```

## 5. Diferencias Clave en Prisma v7
- **Path Resolution**: Las rutas de archivos SQLite ahora son relativas al archivo `prisma.config.ts`.
- **Centralized Management**: Mayor control sobre la conexión sin depender exclusivamente de variables de entorno globales no tipadas.
- **WASM Native**: Preparado para ejecutarse en runtimes de baja latencia mediante Driver Adapters.
- **Full Type Safety**: Validación estricta de variables de entorno mediante genéricos en el config.
