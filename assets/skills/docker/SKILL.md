# ESTÁNDARES DE DOCKER

Este documento define la configuración de contenedores.

## 1. Imagen de PHP

- **Base**: `php:8.3-fpm`.
- **Manejo de Permisos (CRÍTICO)**:
  - Usar `ARG UID` y `ARG GID` en el Dockerfile.
  - Crear un usuario `developer` dentro del contenedor que coincida con el UID/GID del host para evitar problemas de permisos en archivos compartidos (volúmenes).
  - Comando Dockerfile:
    ```dockerfile
    RUN groupadd -g ${GID} developer && useradd -u ${UID} -g developer -m -s /bin/bash developer
    USER developer
    ```
- **Node.js**: Incluir Node.js (v22+) en el mismo contenedor para simplificar ejecuciones de `npm` y `vite`.
- **Configuración PHP**:
  - `memory_limit`: 4096M.
  - `default_socket_timeout`: 300.
  - Extensiones: `pdo`, `pdo_mysql`, `gd`.

## 2. Orquestación (Docker Compose)

- **Servicios**:
  - `php`: Contexto `./docker/php`. Mapea puertos para PHP (9000) y Vite (5173).
  - `web`: Nginx (ej. `nginx:1.25.3-alpine`). Carga configuración dinámica vía variable `${NGINX_CONF_FILE}`.
  - `database`: MySQL 8.0.
- **Variables de Entorno**: Usar `.env` para parametrizar todos los puertos externos y evitar colisiones entre proyectos:
  - `${PHP_PORT}`, `${VITE_PORT}`, `${NGINX_PORT}`, `${MYSQL_PORT}`.
- **Vite**: Exponer explícitamente el puerto de Vite para proyectos de laravel para habilitar el Hot Module Replacement (HMR) o asignar el configurado por el .env para asegurar portabilidad entre instalaciones con diferentes puertos.
- **Redes**: Definir una red de puente (bridge) específica para el proyecto pero garantizar conectividad con la maquina principal.

## 3. Nginx

- **Modularidad**: Almacenar archivos `.conf` en `docker/nginx/conf.d/`, se debe crear un archivo .conf para desarollo y otro para produccion, el archivo .conf debe ser cargado dinámicamente vía variable `${NGINX_CONF_FILE}`, el archivo de produccion debe incluir https forzado.
- **Referencia**: El `fastcgi_pass` debe apuntar al `container_name` del servicio PHP (ej. `php_proyecto:9000`).

## 4. Persistencia de Datos

- Mapear volúmenes locales para datos de base de datos (ej. `./docker/mysql/data:/var/lib/mysql`) para mantener la persistencia entre reinicios.
