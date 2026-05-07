---
name: react
description: Estándares definitivos de React para Sko-Nexus. Incluye arquitectura de módulos, gestión de API con promesas y estándares de UX/UI.
---

# ⚛️ ESTÁNDARES MAESTROS DE REACT (SKO-NEXUS)

Este documento es la única fuente de verdad para el desarrollo en React dentro del ecosistema Sko-Nexus. Su objetivo es garantizar la consistencia absoluta, la mantenibilidad y la portabilidad del código.

## 1. Arquitectura de Módulos (Aislamiento por Contexto)

Mantenemos un patrón de **Aislamiento por Contexto**. Cada funcionalidad compleja debe ser una unidad autónoma y auto-descriptiva.

### Estructura Obligatoria de Archivos
Para cada módulo de página completa, utilizar la siguiente estructura en una carpeta dedicada:

1.  **`NombreDelComponente.jsx`**: Punto de entrada. Su única responsabilidad es envolver el componente `Main` con el `Provider` del contexto.
2.  **`NombreDelComponenteContext.jsx`**: 
    - Contiene la creación del `Context`, el `Provider` y el hook personalizado (`useModulo`).
    - **Toda la lógica de estado y llamadas a API** reside aquí.
3.  **`NombreDelComponenteMain.jsx`**: El Layout principal del módulo. Consume el contexto y organiza los sub-componentes.
4.  **`Componentes/`**: Directorio para desglosar la interfaz.
    - **Regla de Oro**: Cada sub-componente debe ser un archivo **individual y descriptivo**.
    - **PROHIBIDO** el uso de archivos genéricos tipo `SubComponents.jsx` o `SubComponentes.jsx`.
    - Ejemplos: `TablaProductos.jsx`, `FiltrosBusqueda.jsx`, `ModalDetalle.jsx`.

---

## 2. Gestión de Datos y Formularios (React-API)

Control manual total sobre el envío y validación de datos para evitar el comportamiento por defecto de los navegadores y de frameworks que oculten el flujo de datos.

### Reglas Críticas:
1.  **NO usar el tag `<form>`**: Los envíos deben dispararse mediante eventos manuales (`onClick`) en botones para evitar recargas accidentales.
2.  **NO usar el hook `useForm` de Inertia**: Preferimos la gestión manual de estados para un control granular de la UI durante la carga.
3.  **Patrón de Promesas (Axios)**: Se prefiere el uso de `.then()` y `.catch()` sobre bloques `async/await` o `try/catch` para mantener una lectura lineal del flujo de datos y evitar el anidamiento innecesario.

### Ejemplo de Consumo de API:
```javascript
const guardarDatos = () => {
    setLoading(true);
    axios.post('/api/ruta', { data })
        .then(resp => {
            Swal.fire('Éxito', resp.data.message, 'success');
            // Lógica de éxito (limpiar estados, cerrar modales, etc.)
        })
        .catch(err => {
            const msg = err.response?.data?.message || 'Error en la petición';
            Swal.fire('Error', msg, 'error');
        })
        .finally(() => setLoading(false));
};
```

---

## 3. Estado y Código (Estándares de Limpieza)

-   **Estado Global**: Usar **Zustand** solo para datos que deban persistir entre cambios de página (ej: sesión de usuario, preferencias globales).
-   **Estado de Módulo**: Usar **Context API** para la lógica interna de la página. No contaminar el Contexto con estados que pueden ser locales a un sub-componente.
-   **Nomenclatura**: 
    - Archivos: `PascalCase.jsx`
    - Variables/Funciones: `camelCase`
-   **Feedback al Usuario**: Siempre manejar el estado de carga (`loading`) y proporcionar feedback visual (spinners, skeletons) en el bloque `.finally()`.

---

## 4. Diseño y UX (Agnostic Proyect)
Este documento define la lógica. El diseño visual (Bootstrap, Tailwind, shortcuts) se inyectará desde la memoria de cada proyecto particular, pero siempre respetando la estructura de componentes definida en la Sección 1.
