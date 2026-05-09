# ESTÁNDARES DE INERTIA.JS - SKO BRAIN

## 1. Implementación
- **Punto de Entrada**: `resources/js/app.jsx` con carga dinámica vía `import.meta.glob`.
- **Rutas**: Uso de **Ziggy** para acceder a rutas de Laravel desde el frontend.

## 2. Comunicación (Regla de Oro)
- **Carga Inicial**: Los datos para el renderizado inicial se pasan como props desde el controlador.
- **Acciones Posteriores**: Para guardar, actualizar o recargar datos de módulos dinámicos, **priorizar Axios sobre los métodos nativos de Inertia** (`Inertia.post`, `useForm`).
- **Navegación**: Usar componentes de Inertia solo para navegación entre páginas.
