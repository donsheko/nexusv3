---
name: Prisma SQL Server
description: Guía oficial de Prisma 7 (ESM-first) para configuración con Microsoft SQL Server
---

# Prisma 7 con SQL Server (ESM-First) - Estándar Oficial

Configuración recomendada para integrar Microsoft SQL Server (y Azure SQL) con Prisma v7, siguiendo los estándares de configuración centralizada.

## 1. Configuración del Proyecto (`prisma.config.ts`)

En la v7, gestionamos la conexión y el tipado de variables de entorno de forma centralizada.

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Tipado para variables de entorno de SQL Server
type Env = {
  DATABASE_URL: string;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: env<Env>("DATABASE_URL"),
  },
});
```

## 2. Definición del Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider        = "prisma-client"
  output          = "../generated/prisma"
  // Habilitar driver adapters para mayor compatibilidad
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlserver"
}
```

## 3. Uso de Driver Adapters (Opcional)

Si necesitas utilizar el driver `mssql` nativo de Node.js por compatibilidad con ciertos firewalls o configuraciones de red específicas:

```bash
npm install mssql @prisma/adapter-mssql
```

Instanciación del cliente:

```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaMSSQL } from '@prisma/adapter-mssql'
import sql from 'mssql'

const connectionString = process.env.DATABASE_URL
const pool = new sql.ConnectionPool(connectionString)
const adapter = new PrismaMSSQL(pool)
const prisma = new PrismaClient({ adapter })
```

## 4. Estructura de Variables de Entorno `.env`

SQL Server utiliza un formato de conexión específico basado en punto y coma para parámetros.

```env
# Ejemplo de conexión local
DATABASE_URL="sqlserver://localhost:1433;database=mydb;user=SA;password=YourPassword123;encrypt=true;trustServerCertificate=true"

# Ejemplo para Azure SQL
# DATABASE_URL="sqlserver://your-server.database.windows.net:1433;database=your-db;user=your-user;password=your-password;encrypt=true"
```

## 5. Consideraciones Técnicas en Prisma v7
- **Centralized Config**: Al igual que en otros conectores, la v7 prefiere `prisma.config.ts` sobre el hardcodeo de URLs en el `.prisma`.
- **Encrypt & Trust**: En entornos locales es común necesitar `trustServerCertificate=true`, mientras que en Azure `encrypt=true` es obligatorio.
- **WASM Support**: Aunque PostgreSQL y SQLite tienen mayor soporte WASM, SQL Server puede usar `driverAdapters` para entornos Node.js con mayor control sobre el pool de conexiones.
- **Migrations**: SQL Server genera scripts `.sql` compatibles con T-SQL, incluyendo el manejo de esquemas (dbo por defecto).
