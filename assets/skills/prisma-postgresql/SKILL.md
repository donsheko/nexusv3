---
name: Prisma PostgreSQL
description: Guía oficial de Prisma 7 (ESM-first) para configuración con PostgreSQL y Prisma Postgres
---

# Prisma 7 con PostgreSQL (ESM-First) - Estándar Oficial

Configuración basada en los estándares de Prisma v7 para PostgreSQL, despliegues Serverless y el nuevo servicio Prisma Postgres.

## 1. Configuración del Proyecto (`prisma.config.ts`)

En Prisma 7, la configuración centralizada es obligatoria para una gestión robusta de entornos.

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Definición de tipos para variables de entorno
type Env = {
  DATABASE_URL: string;
  DIRECT_URL?: string;
  PRISMA_DIRECT_TCP_URL?: string; // Requerido para Prisma Postgres
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Uso de genéricos para validación de tipos en tiempo de compilación
    url: env<Env>("DATABASE_URL"),
    directUrl: env<Env>("DIRECT_URL"), // Recomendado para infraestructuras con Connection Pooling
  },
});
```

## 2. Definición del Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
  // Habilitar Driver Adapters para WASM y entornos de Edge
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  // La URL se gestiona ahora preferentemente desde prisma.config.ts
}
```

## 3. Soporte para Prisma Postgres (Managed)

Si utilizas el nuevo servicio managed de Prisma, instala el adaptador:

```bash
npm install @prisma/adapter-ppg
```

Instanciación del cliente con el adaptador:

```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaPostgresAdapter } from '@prisma/adapter-ppg'

const connectionString = process.env.PRISMA_DIRECT_TCP_URL
const adapter = new PrismaPostgresAdapter({ connectionString })
const prisma = new PrismaClient({ adapter })
```

## 4. Estructura de Variables de Entorno `.env`

```env
# URL principal con pooling (ej. Supabase, Prisma Postgres)
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true"

# URL directa para migraciones (obligatoria en serverless)
DIRECT_URL="postgresql://user:pass@host:5432/db"

# Específico para Prisma Postgres
PRISMA_DIRECT_TCP_URL="postgres://identifier:key@db.prisma.io:5432/postgres?sslmode=require"
```

## 5. Características Clave v7 en Postgres
- **Centralized Config**: Desplazamiento de la lógica de conexión del schema a `prisma.config.ts`.
- **Driver Adapters**: Soporte nativo para `@prisma/adapter-pg` y `@prisma/adapter-ppg`.
- **WASM Optimized**: Los drivers están optimizados para ejecutarse en Cloudflare Workers, Vercel Edge, etc.
- **Improved Type Safety**: Validación de `env()` mediante genéricos en el archivo de configuración.
