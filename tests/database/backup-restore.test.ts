import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { seed } from '../../prisma/seed.js';

const prisma = new PrismaClient();

test('Database Backup & Restore Smoke Test', async () => {
  await seed();
  const initialActorCount = await prisma.actor.count();
  assert.ok(initialActorCount > 0, 'Database should have actors before backup');

  // 1. Run backup script via PowerShell
  const backupCmd = 'powershell -ExecutionPolicy Bypass -File scripts/db_backup.ps1';
  assert.doesNotThrow(() => {
    execSync(backupCmd, { cwd: process.cwd() });
  }, 'Backup script should execute successfully');

  // 2. Run restore script via PowerShell
  const restoreCmd = 'powershell -ExecutionPolicy Bypass -File scripts/db_restore.ps1';
  assert.doesNotThrow(() => {
    execSync(restoreCmd, { cwd: process.cwd() });
  }, 'Restore script should execute successfully');

  // 3. Verify counts after restore
  const postRestoreActorCount = await prisma.actor.count();
  assert.equal(postRestoreActorCount, initialActorCount, 'Actor count must match post-restore');
});
