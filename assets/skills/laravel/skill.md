# ESTÁNDARES DE LARAVEL

Este documento define la manera de trabajar con Laravel.

## 1. Modelos Eloquent

- **Asignación Masiva**: Preferir `protected $guarded = [];` sobre `$fillable`.
- **Relaciones**: Definir relaciones explícitas (e.g., `belongsTo`, `hasMany`).
- **Nomenclatura**: Tablas en `snake_case`.

## 2. Controladores

- **Renderizado**: Usar `Inertia::render('Path/To/Page', $props)` en el método `index()`, evitar pasar props desde el metodo render en medida de lo posible, priorizar funciones initData() que se mandaran a traer desde axios por medio de la api.
- **API de Datos**: Crear un método `list()` que devuelva una respuesta JSON con los datos filtrados para ser consumidos por Axios.
- **Upsert**: Se recomienda usar `updateOrCreate` en el método `store` si la lógica de crear y editar es compartida, incluso upsert si se manejaran volúmenes grandes de datos en el modulo.
- **Optimización**: Siempre usar `with()` y `withCount()` para evitar el problema de N+1.
- **Documentación**: Incluir un comentario inicial con el esquema de la tabla sql.

## 3. Rutas

- **Modularidad**: Dividir las rutas en archivos temáticos dentro de `routes/` para modulos con muchas rutas, para modulos simples usar `routes/web.php` bajo un comentario con el nombre del modulo para mantener las rutas organizadas.

## 4. Pruebas y Debugging (Agent Controller)

- **Ubicación**: `app/Http/Controllers/AgentController.php` (método `run()`).
- **Ejecución**: `php artisan agent:run`.
- **Regla**: Nunca dejar código de pruebas permanente. Limpiar el método `run()` tras el uso.
