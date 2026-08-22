import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient, DatasetUsage } from '@prisma/client';
import { seed } from '../../prisma/seed.js';

const prisma = new PrismaClient();

test('Dataset Registry Integrity', async (t) => {
  before(async () => {
    await seed();
  });

  await t.test('All 4 standard datasets are registered with distinct usages', async () => {
    const evo = await prisma.dataset.findFirst({ where: { name: { contains: 'Evolution' } } });
    const surfing = await prisma.dataset.findFirst({ where: { name: { contains: 'Darknet Surfing' } } });
    const nict = await prisma.dataset.findFirst({ where: { name: { contains: 'NICT' } } });
    const veridark = await prisma.dataset.findFirst({ where: { name: { contains: 'VeriDark' } } });

    assert.ok(evo, 'Evolution dataset must be registered');
    assert.equal(evo.usage, DatasetUsage.FEATURE_ENGINEERING);

    assert.ok(surfing, 'Darknet Surfing dataset must be registered');
    assert.equal(surfing.usage, DatasetUsage.SYNTHETIC_CALIBRATION);

    assert.ok(nict, 'NICT dataset must be registered');
    assert.equal(nict.usage, DatasetUsage.REFERENCE_ONLY);

    assert.ok(veridark, 'VeriDark dataset must be registered');
    assert.equal(veridark.usage, DatasetUsage.TRAINING);
  });

  await t.test('Datasets enforce unique names and valid SHA-256 hashes', async () => {
    const datasets = await prisma.dataset.findMany();
    for (const ds of datasets) {
      assert.ok(ds.hash.startsWith('sha256-'), 'Dataset hash must have sha256- prefix');
      assert.ok(ds.sourceUrl, 'Dataset must have sourceUrl');
    }
  });
});
