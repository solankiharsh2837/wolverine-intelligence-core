import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test('8. Model Registry & Metadata Foundation', async (t) => {
  await t.test('ModelVersion table stores trained baseline models and hyperparameters', async () => {
    const models = await prisma.modelVersion.findMany();
    assert.ok(models.length > 0, 'Should have registered model versions');

    const logisticModel = models.find((m) => m.versionTag.includes('logistic'));
    assert.ok(logisticModel, 'Logistic attribution model must be registered');
    assert.ok(typeof logisticModel.parameters === 'object', 'Parameters must be JSON metadata');
  });
});
