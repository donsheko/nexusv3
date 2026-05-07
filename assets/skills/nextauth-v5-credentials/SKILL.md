---
name: NextAuth v5 - Credentials con Server Actions
description: Patrón correcto para login con Credentials Provider en Next.js Server Actions detrás de un reverse proxy. Evita el error "unexpected response from server".
---

# NextAuth v5 — Credentials + Server Actions

## El Problema

Usar `signIn("credentials", { redirectTo: "/" })` dentro de un Server Action causa el error:

```
Uncaught Error: An unexpected response was received from the server.
```

Esto ocurre porque next-auth v5 genera su propio HTTP redirect interno que es incompatible con el mecanismo de redirección de Next.js Server Actions. El síntoma típico: la sesión SÍ se crea correctamente, pero el navegador no navega — queda en la página de login con error.

## La Solución

Usar `redirect: false` en `signIn` y manejar la navegación manualmente con `redirect()` de `next/navigation`.

```js
// app/login/page.js
import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

export default async function LoginPage({ searchParams }) {
  const { error } = await searchParams;

  return (
    <form
      action={async (formData) => {
        "use server";
        try {
          await signIn("credentials", {
            ...Object.fromEntries(formData),
            redirect: false, // ← clave: deshabilitar redirect interno de next-auth
          });
        } catch (err) {
          if (err instanceof AuthError) {
            redirect("/login?error=CredentialsSignin");
          }
          throw err; // re-lanzar errores no relacionados con auth
        }
        redirect("/dashboard"); // ← Next.js maneja el redirect nativamente
      }}
    >
      {/* inputs */}
    </form>
  );
}
```

## Por qué funciona

- `redirect: false` → next-auth no intenta hacer un HTTP redirect propio.
- `AuthError` → cubre credenciales inválidas (`CredentialsSignin`) y otros errores de auth.
- `throw err` fuera del `if` → re-lanza errores inesperados para no silenciarlos.
- `redirect()` de `next/navigation` → lanza `NEXT_REDIRECT` internamente, que Next.js captura y convierte en navegación del lado del cliente correctamente.

## Configuración de entorno requerida (docker-compose)

```yaml
environment:
  AUTH_SECRET: ${AUTH_SECRET}
  AUTH_TRUST_HOST: "true"   # obligatorio detrás de Nginx Proxy Manager u otro reverse proxy
  NEXTAUTH_URL: ${NEXTAUTH_URL}
```

## Notas

- `AUTH_TRUST_HOST: "true"` es obligatorio cuando la app corre detrás de un proxy (NPM, Traefik, Caddy). Sin esto, next-auth puede rechazar requests por host no confiable.
- En next-auth v5, el env var primario es `AUTH_URL`. `NEXTAUTH_URL` se mantiene por compatibilidad con v4.
- Este patrón aplica solo a Credentials Provider. OAuth providers (GitHub, Google, etc.) tienen su propio flujo y no requieren este workaround.
