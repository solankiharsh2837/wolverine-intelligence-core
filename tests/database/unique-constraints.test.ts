import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient, NetworkType } from '@prisma/client';

const prisma = new PrismaClient();

test('Unique Constraints Enforcement', async (t) => {
  const TEST_TAG = 'TEST_UNIQUE_FIXTURE';

  await t.test('Duplicate Network Name is rejected', async () => {
    const netName = 'UniqueTestNetwork_' + Date.now();
    const net1 = await prisma.network.create({
      data: {
        name: netName,
        type: NetworkType.TOR,
        createdBy: TEST_TAG,
        sourceVersion: '0.1.0',
      },
    });

    await assert.rejects(
      async () => {
        await prisma.network.create({
          data: {
            name: netName,
            type: NetworkType.I2P,
            createdBy: TEST_TAG,
            sourceVersion: '0.1.0',
          },
        });
      },
      /Unique constraint failed on the fields: \(`name`\)/i,
      'Duplicate network name must be rejected'
    );

    await prisma.network.delete({ where: { id: net1.id } });
  });

  await t.test('Duplicate Artifact Hash is rejected', async () => {
    const rawData = Buffer.from('Duplicate Artifact Test Content ' + Date.now());
    const hash = 'hash_' + Date.now();

    const art1 = await prisma.artifact.create({
      data: {
        rawData,
        hash,
        collectedAt: new Date(),
        mimeType: 'text/plain',
        createdBy: TEST_TAG,
        sourceVersion: '0.1.0',
      },
    });

    await assert.rejects(
      async () => {
        await prisma.artifact.create({
          data: {
            rawData,
            hash,
            collectedAt: new Date(),
            mimeType: 'text/plain',
            createdBy: TEST_TAG,
            sourceVersion: '0.1.0',
          },
        });
      },
      /Unique constraint failed on the fields: \(`hash`\)/i,
      'Duplicate artifact hash must be rejected'
    );

    await prisma.artifact.delete({ where: { id: art1.id } });
  });
});
