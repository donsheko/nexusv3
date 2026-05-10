import { mkdir, readFile, writeFile, unlink, readdir } from 'fs/promises';
import { dirname, join } from 'path';
import { pathExists } from './pathExists.js';

/**
 * Sistema de bloqueo de archivos para prevenir race conditions
 * Usa archivos de lock en el filesystem
 */

const LOCK_TIMEOUT = 30000; // 30 segundos de timeout
const LOCK_POLL_INTERVAL = 100; // Revisar cada 100ms

/**
 * Adquiere un lock para un archivo
 * @param {string} filePath - Archivo a bloquear
 * @returns {Promise<string>} Lock ID para liberarlo después
 */
export async function acquireLock(filePath) {
  const lockPath = filePath + '.lock';
  const lockId = `${Date.now()}-${Math.random()}`;
  const lockFile = lockPath + `.${lockId}`;
  
  // Crear directorio de locks si no existe
  await mkdir(dirname(lockPath), { recursive: true });
  
  // Escribir archivo de lock con timestamp
  await writeFile(lockFile, JSON.stringify({
    timestamp: Date.now(),
    id: lockId,
    filePath
  }), 'utf-8');
  
  // Esperar a que se adquiera el lock
  const startTime = Date.now();
  while (true) {
    // Revisar si hay locks más antiguos
    const hasOlderLock = await checkForOlderLocks(lockPath, lockId);
    if (!hasOlderLock) {
      return lockId;
    }
    
    // Verificar timeout
    if (Date.now() - startTime > LOCK_TIMEOUT) {
      // Limpiar el archivo de lock y fallar
      await unlink(lockFile).catch(() => {});
      throw new Error(`Lock timeout acquiring lock for ${filePath}`);
    }
    
    // Esperar antes de revisar de nuevo
    await new Promise(resolve => setTimeout(resolve, LOCK_POLL_INTERVAL));
  }
}

/**
 * Verifica si hay locks más antiguos que el actual
 */
async function checkForOlderLocks(lockPath, currentLockId) {
  if (!(await pathExists(lockPath))) {
    return false;
  }
  
  try {
    const files = await readdir(lockPath);
    const lockFiles = files.filter(f => f.startsWith('.'));
    
    if (lockFiles.length === 0) {
      return false;
    }
    
    // Extraer timestamps de los archivos de lock
    const locks = [];
    for (const file of lockFiles) {
      try {
        const content = await readFile(join(lockPath, file), 'utf-8');
        const lock = JSON.parse(content);
        locks.push(lock);
      } catch {
        // Ignorar archivos de lock corruptos
      }
    }
    
    // Ordenar por timestamp
    locks.sort((a, b) => a.timestamp - b.timestamp);
    
    // Verificar si hay un lock más antiguo que el actual
    const currentIdx = locks.findIndex(l => l.id === currentLockId);
    if (currentIdx === 0) {
      // Este es el lock más antiguo, puede proceder
      return false;
    }
    
    // Verificar si el lock más antiguo está muerto (muy viejo)
    if (locks[0] && Date.now() - locks[0].timestamp > LOCK_TIMEOUT) {
      try {
        await unlink(join(lockPath, `.${locks[0].id}`)).catch(() => {});
      } catch {
        // Ignorar errores al limpiar locks muertos
      }
    }
    
    return currentIdx > 0;
  } catch {
    return false;
  }
}

/**
 * Libera un lock
 * @param {string} filePath - Archivo bloqueado
 * @param {string} lockId - ID del lock a liberar
 */
export async function releaseLock(filePath, lockId) {
  const lockPath = filePath + '.lock';
  const lockFile = lockPath + `.${lockId}`;
  
  try {
    await unlink(lockFile);
  } catch {
    // Ignorar errores al liberar el lock
  }
}

/**
 * Ejecuta una función bajo un lock
 * @param {string} filePath - Archivo a bloquear
 * @param {Function} fn - Función a ejecutar
 * @returns {Promise} Resultado de la función
 */
export async function withLock(filePath, fn) {
  const lockId = await acquireLock(filePath);
  try {
    return await fn();
  } finally {
    await releaseLock(filePath, lockId);
  }
}
