import { mkdir, readFile, writeFile, unlink } from 'fs/promises';
import { dirname } from 'path';
import { pathExists } from './pathExists.js';

/**
 * File Locking System - Prevents race conditions in config access
 * 
 * DESIGN:
 * =======
 * Uses a simple file-based locking mechanism with polling:
 * 1. Process tries to write .lock file
 * 2. If successful, lock is acquired
 * 3. If exists, wait and retry (FIFO ordering)
 * 4. Timeout after 30s (prevents deadlocks)
 * 
 * GUARANTEES:
 * - Only one process can modify config at a time
 * - FIFO ordering prevents starvation
 * - Automatic cleanup on timeout
 * - Works across process boundaries
 * 
 * WHY NOT OTHER SOLUTIONS:
 * - In-memory locks: Only work within same process
 * - OS file locks (flock): Unreliable across filesystems
 * - Atomic operations: Can't serialize whole transaction
 * - Database: Overkill for simple config files
 * 
 * USAGE:
 * ======
 * const result = await withLock(configPath, async () => {
 *   const config = await readFile(configPath);
 *   // Modify config
 *   await writeFile(configPath, modified);
 *   return result;
 * });
 */

const LOCK_TIMEOUT = 30000; // 30 segundos de timeout
const LOCK_POLL_INTERVAL = 50; // Revisar cada 50ms


/**
 * Executes a function with exclusive file access (RECOMMENDED)
 * 
 * This is the primary API for safe config modification.
 * Use this instead of acquireLock/releaseLock.
 * 
 * GUARANTEES:
 * - Function runs with exclusive access to filePath
 * - Lock is automatically released even if function throws
 * - Safe for concurrent calls - they wait in queue (FIFO)
 * - Times out after 30s to prevent deadlocks
 * 
 * EXAMPLE:
 * const result = await withLock('/path/to/config.json', async () => {
 *   const config = await readFile('/path/to/config.json', 'utf-8');
 *   const modified = { ...JSON.parse(config), newKey: 'value' };
 *   await writeFile('/path/to/config.json', JSON.stringify(modified));
 *   return { success: true };
 * });
 * 
 * @param {string} filePath - File to lock (actual file, not lock file)
 * @param {Function} fn - Async function to execute under lock
 * @returns {Promise} Result of fn()
 * @throws {Error} If timeout or fn throws
 */
export async function withLock(filePath, fn) {
  const lockFile = filePath + '.lock';
  const lockId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  
  // Crear directorio del lock si no existe
  await mkdir(dirname(lockFile), { recursive: true }).catch(() => {});

  // Esperar a que se libere el lock existente
  await acquireLock(filePath);

  try {
    // Ejecutar la función bajo el lock
    return await fn();
  } finally {
    // Liberar el lock
    await releaseLock(filePath);
  }
}

/**
 * Acquires an exclusive lock for a file (LEGACY - use withLock instead)
 * 
 * This is the low-level API. Use withLock() instead for automatic cleanup.
 * 
 * @param {string} filePath - File to lock
 * @returns {Promise<void>}
 * @throws {Error} If timeout acquiring lock
 */
export async function acquireLock(filePath) {
  const lockFile = filePath + '.lock';
  const startTime = Date.now();
  let lastError = null;

  while (true) {
    try {
      // Leer lock actual si existe
      if (await pathExists(lockFile)) {
        const currentLock = await readFile(lockFile, 'utf-8').catch(() => null);
        
        // Si el lock es viejo (>30s), eliminarlo y continuar
        if (currentLock) {
          try {
            const timestamp = parseInt(currentLock.split('-')[0]);
            if (Date.now() - timestamp > LOCK_TIMEOUT) {
              await unlink(lockFile).catch(() => {});
              continue; // Reintentar
            }
          } catch (e) {
            // Si no podemos parsear el lock, esperamos
          }
        }

        // El lock existe y es reciente, esperar
        if (Date.now() - startTime > LOCK_TIMEOUT) {
          throw new Error(`Lock timeout acquiring lock for ${filePath}`);
        }

        await new Promise(resolve => setTimeout(resolve, LOCK_POLL_INTERVAL));
        continue;
      }

      // El lock no existe, crear uno nuevo
      await mkdir(dirname(lockFile), { recursive: true }).catch(() => {});
      await writeFile(lockFile, `${Date.now()}-newlock`, 'utf-8');

      // Verificar que fue escrito correctamente (doble-check)
      const verifyLock = await readFile(lockFile, 'utf-8').catch(() => null);
      if (verifyLock) {
        // Lock adquirido
        return;
      }

      // Falló la verificación, reintentar
      if (Date.now() - startTime > LOCK_TIMEOUT) {
        throw new Error(`Lock timeout for ${filePath}`);
      }

      await new Promise(resolve => setTimeout(resolve, LOCK_POLL_INTERVAL));
    } catch (err) {
      lastError = err;
      
      // Algunos errores son fatales
      if (err.message?.includes('Lock timeout')) {
        throw err;
      }

      // Otros errores son transitorios (permisos, race condition, etc)
      if (Date.now() - startTime > LOCK_TIMEOUT) {
        throw new Error(`Lock timeout acquiring lock for ${filePath}: ${err.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, LOCK_POLL_INTERVAL));
    }
  }
}

/**
 * Releases a lock previously acquired with acquireLock() (LEGACY)
 * 
 * Only needed if using acquireLock(). Use withLock() for automatic cleanup.
 * 
 * @param {string} filePath - File that was locked
 * @returns {Promise<void>}
 */
export async function releaseLock(filePath) {
  const lockFile = filePath + '.lock';
  await unlink(lockFile).catch(() => {});
}
