---
name: react-ts
description: Estándares maestros de React con TypeScript para Sko-Nexus. Arquitectura de módulos tipada, gestión de API con promesas y tipado estricto de UI/UX.
---

# ⚛️ ESTÁNDARES MAESTROS DE REACT + TYPESCRIPT (SKO-NEXUS)

Este documento es la única fuente de verdad para el desarrollo en React con TypeScript dentro del ecosistema Sko-Nexus. Garantiza consistencia absoluta, seguridad de tipos y mantenibilidad.

## 1. Arquitectura de Módulos Tipada (Aislamiento por Contexto)

Mantenemos el patrón de **Aislamiento por Contexto**, pero reforzado con interfaces de TypeScript para cada capa.

### Estructura Obligatoria de Archivos
Carpeta del módulo (ej: `GestionUsuarios/`):

1.  **`NombreDelComponente.tsx`**: Punto de entrada. Envuelve el componente `Main` con el `Provider`.
2.  **`NombreDelComponenteContext.tsx`**: 
    - Define la `interface` para el estado y las funciones del contexto.
    - Exporta el `Provider` y el hook `useModulo`.
    - **Toda la lógica y llamadas a API (tipadas)** residen aquí.
3.  **`NombreDelComponenteMain.tsx`**: Layout principal. Consume el contexto.
4.  **`Componentes/`**: Sub-componentes individuales.
    - Cada componente debe tener su interface de Props definida: `interface Props { ... }`.

---

## 2. Gestión de Datos y API (Tipado Estricto)

Usamos Axios con promesas y definimos interfaces para las respuestas de la API.

### Reglas Críticas:
1.  **Interfaces de API**: Siempre definir la estructura de lo que devuelve el backend.
2.  **NO usar el tag `<form>`**: Disparar envíos mediante `onClick` en botones para evitar comportamientos por defecto indeseados.
3.  **Patrón de Promesas (Axios)**: Uso de `.then()`, `.catch()` y `.finally()`.

### Ejemplo de Implementación:
```typescript
interface UserResponse {
    id: number;
    name: string;
    email: string;
}

const guardarDatos = (payload: Partial<UserResponse>) => {
    setLoading(true);
    axios.post<UserResponse>('/api/users', payload)
        .then(resp => {
            const nuevoUsuario = resp.data; // Tipado automáticamente
            Swal.fire('Éxito', 'Usuario guardado', 'success');
        })
        .catch((err: AxiosError<{message: string}>) => {
            const msg = err.response?.data?.message || 'Error en la petición';
            Swal.fire('Error', msg, 'error');
        })
        .finally(() => setLoading(false));
};
```

---

## 3. Estado y Tipado (Estándares de Limpieza)

-   **Context API**: El contexto debe inicializarse con su interface asociada para evitar errores de "undefined".
-   **Zustand**: Para estados globales persistentes. Definir claramente `State` y `Actions`.
-   **Nomenclatura**: 
    - Archivos: `PascalCase.tsx`
    - Variables/Funciones: `camelCase`
-   **Feedback al Usuario**: Manejo obligatorio de `loading` en el bloque `.finally()`.

---

## 4. Tipado de Eventos y Props
- **Prohibido el uso de `any`**.
- Tipar eventos de React correctamente (ej: `React.MouseEvent<HTMLButtonElement>`).
- Utilizar `React.ReactNode` para props que aceptan componentes hijos.
