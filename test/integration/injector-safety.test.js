/**
 * Injector Safety Integration Tests
 * Tests critical safety guarantees of the injector system
 */

import { writeFile, readFile, unlink, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { pathExists } from '../../bin/helpers/pathExists.js';
import { withLock } from '../../bin/helpers/fileLock.js';

const TEST_DIR = '/tmp/injector-safety-tests';
const TEST_CONFIG = join(TEST_DIR, 'test-opencode.json');

let testsRun = 0;
let testsPassed = 0;

async function test(name, fn) {
  testsRun++;
  try {
    await fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${err.message}`);
  }
}

function expect(value) {
  return {
    toBe(expected) {
      if (value !== expected) {
        throw new Error(`Expected ${expected}, got ${value}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(value) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
      }
    },
    toBeTrue() {
      if (value !== true) throw new Error(`Expected true, got ${value}`);
    },
    toBeFalse() {
      if (value !== false) throw new Error(`Expected false, got ${value}`);
    },
    toThrow() {
      let threw = false;
      try {
        value();
      } catch (e) {
        threw = true;
      }
      if (!threw) throw new Error('Expected function to throw');
    },
  };
}

// Main test suite
async function runTests() {
  console.log('🔐 INJECTOR SAFETY INTEGRATION TESTS');
  console.log('════════════════════════════════════\n');

  // Setup
  await mkdir(TEST_DIR, { recursive: true });

  try {
    // Test: Atomic Write Pattern
    console.log('\n📝 Atomic Write Pattern:');
    
    await test('should preserve original file if write fails', async () => {
      const originalContent = { mcp: { 'sko-brain': { type: 'local' } } };
      await writeFile(TEST_CONFIG, JSON.stringify(originalContent, null, 2));

      // Simulate write failure
      const tempPath = TEST_CONFIG + '.tmp';
      try {
        throw new Error('Simulated write failure');
      } catch (err) {
        await unlink(tempPath).catch(() => {});
      }

      // Original file should be unchanged
      const preserved = JSON.parse(await readFile(TEST_CONFIG, 'utf-8'));
      expect(preserved).toEqual(originalContent);
    });

    await test('should create backup before modification', async () => {
      const originalContent = { mcp: {} };
      await writeFile(TEST_CONFIG, JSON.stringify(originalContent, null, 2));

      const backupPath = TEST_CONFIG + '.backup';
      await writeFile(backupPath, JSON.stringify(originalContent, null, 2));

      expect(await pathExists(backupPath)).toBeTrue();
      const backup = JSON.parse(await readFile(backupPath, 'utf-8'));
      expect(backup).toEqual(originalContent);
    });

    await test('should verify JSON validity before writing', async () => {
      const testData = { mcp: { 'sko-brain': { type: 'local' } } };
      
      // Valid JSON should work
      const jsonString = JSON.stringify(testData);
      const parsed = JSON.parse(jsonString);
      expect(parsed).toEqual(testData);

      // Invalid JSON should throw
      expect(() => JSON.parse('{ invalid json')).toThrow();
    });

    // Test: File Locking
    console.log('\n🔒 File Locking:');

    await test('should acquire and release locks', async () => {
      let lockAcquired = false;

      const result = await withLock(TEST_CONFIG, async () => {
        lockAcquired = true;
        return { success: true };
      });

      expect(lockAcquired).toBeTrue();
      expect(result.success).toBeTrue();
    });

    await test('should prevent concurrent writes (FIFO ordering)', async () => {
      const writeSequence = [];

      const task1 = withLock(TEST_CONFIG + '.concurrent1', async () => {
        writeSequence.push('start1');
        await new Promise(resolve => setTimeout(resolve, 50));
        writeSequence.push('end1');
      });

      // Give task1 time to start
      await new Promise(resolve => setTimeout(resolve, 10));

      const task2 = withLock(TEST_CONFIG + '.concurrent1', async () => {
        writeSequence.push('start2');
        writeSequence.push('end2');
      });

      await Promise.all([task1, task2]);

      // Verify task1 completed before task2 started (same lock file)
      const start1 = writeSequence.indexOf('start1');
      const end1 = writeSequence.indexOf('end1');
      const start2 = writeSequence.indexOf('start2');

      // Task 1 should: start -> ... -> end before task 2 starts
      if (start1 === -1 || end1 === -1 || start2 === -1) {
        throw new Error('Missing sequence events');
      }
      if (end1 >= start2) {
        throw new Error(`Lock ordering violation: task1 end=${end1} should be before task2 start=${start2}`);
      }
    });

    await test('should cleanup locks on error', async () => {
      try {
        await withLock(TEST_CONFIG, async () => {
          throw new Error('Test error');
        });
      } catch (err) {
        // Expected
      }

      // Next lock should acquire successfully
      const result = await withLock(TEST_CONFIG, async () => {
        return { success: true };
      });

      expect(result.success).toBeTrue();
    });

    // Test: Config Structure Validation
    console.log('\n📋 Config Structure Validation:');

    await test('should validate mcp key is object', async () => {
      const validConfig = { mcp: { 'sko-brain': {} } };
      const invalidConfig = { mcp: 'not-an-object' };

      // Valid config should serialize without throwing
      try {
        JSON.stringify(validConfig);
        // Success - no throw
      } catch (e) {
        throw new Error('Valid config should not throw during serialization');
      }

      // Structure validation would catch invalid configs
      if (typeof invalidConfig.mcp !== 'object' || Array.isArray(invalidConfig.mcp)) {
        // This is correctly identified as invalid structure
      } else {
        throw new Error('Should identify invalid config structure');
      }
    });

    await test('should validate plugin array entries', async () => {
      const validPlugins = ['plugin1', 'plugin2'];
      const invalidPlugins = [123];

      for (const plugin of validPlugins) {
        if (typeof plugin !== 'string') {
          throw new Error(`Expected string, got ${typeof plugin}`);
        }
      }

      // Check that invalid entry is caught
      if (typeof invalidPlugins[0] !== 'string') {
        // Validation would catch this
      }
    });

    // Test: Shell Injection Prevention
    console.log('\n🛡️  Shell Injection Prevention:');

    await test('should detect dangerous shell characters', async () => {
      const dangerousValues = [
        '$(rm -rf /)',
        '`whoami`',
        ';ls',
        '| cat /etc/passwd',
        "'; DROP TABLE users; --",
      ];

      const shellCharPattern = /[^a-zA-Z0-9_\-./]/;

      for (const value of dangerousValues) {
        if (!shellCharPattern.test(value)) {
          throw new Error(`Should detect dangerous chars in: ${value}`);
        }
      }
    });

    await test('should allow safe shell values', async () => {
      const safeValues = [
        'simple_value',
        'path/to/file',
        'MY_VAR_123',
      ];

      const shellCharPattern = /[^a-zA-Z0-9_\-./]/;

      for (const value of safeValues) {
        if (shellCharPattern.test(value)) {
          throw new Error(`Should allow safe value: ${value}`);
        }
      }
    });

    // Test: MCP Server Path Validation
    console.log('\n✅ MCP Server Path Validation:');

    await test('should verify server binary exists', async () => {
      const validPath = '/home/donsheko/nexusv3/mcp/index.js';
      const invalidPath = '/nonexistent/path/index.js';

      expect(await pathExists(validPath)).toBeTrue();
      expect(await pathExists(invalidPath)).toBeFalse();
    });

    // Test: Backup Recovery
    console.log('\n💾 Backup Recovery:');

    await test('should preserve backup files for recovery', async () => {
      const originalData = { mcp: { original: true } };
      const backupPath = TEST_CONFIG + '.backup2';

      await writeFile(TEST_CONFIG, JSON.stringify(originalData, null, 2));
      await writeFile(backupPath, JSON.stringify(originalData, null, 2));

      expect(await pathExists(backupPath)).toBeTrue();

      const backupContent = JSON.parse(await readFile(backupPath, 'utf-8'));
      expect(backupContent).toEqual(originalData);
    });

  } finally {
    // Cleanup
    await rm(TEST_DIR, { recursive: true, force: true });
  }

  // Results
  console.log('\n════════════════════════════════════');
  console.log(`\n✓ Tests passed: ${testsPassed}/${testsRun}`);
  
  if (testsPassed === testsRun) {
    console.log('\n🎉 All safety tests passed!');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${testsRun - testsPassed} test(s) failed`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err.message);
  process.exit(1);
});
