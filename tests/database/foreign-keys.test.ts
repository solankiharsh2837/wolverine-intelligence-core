import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient, NetworkType, ObservationType } from '@prisma/client';

const prisma = new PrismaClient();

test('Foreign Key Integrity & Cascades', async (t) => {
  const TEST_TAG = 'TEST_FK_FIXTURE';

  await t.test('Cascade deletion of Network cascades to Portal and Persona', async () => {
    // 1. Create a temporary network
    const net = await prisma.network.create({
      data: {
        name: 'Temp Test Network for Cascade',
        type: NetworkType.TOR,
        createdBy: TEST_TAG,
        sourceVersion: '0.1.0',
      },
    });

    // 2. Create Portal on that network
    const portal = await prisma.portal.create({
      data: {
        networkId: net.id,
        address: 'tempcascade.onion',
        status: 'TEST',
        discoveredAt: new Date(),
        createdBy: TEST_TAG,
        sourceVersion: '0.1.0',
      },
    });

    // 3. Create Persona on that portal
    const persona = await prisma.persona.create({
      data: {
        portalId: portal.id,
        name: 'CascadeTestPersona',
        createdBy: TEST_TAG,
        sourceVersion: '0.1.0',
      },
    });

    assert.ok(portal.id);
    assert.ok(persona.id);

    // 4. Delete Network -> Portal & Persona should be cascaded
    await prisma.network.delete({ where: { id: net.id } });

    const portalCheck = await prisma.portal.findUnique({ where: { id: portal.id } });
    const personaCheck = await prisma.persona.findUnique({ where: { id: persona.id } });

    assert.equal(portalCheck, null, 'Portal should be cascade-deleted');
    assert.equal(personaCheck, null, 'Persona should be cascade-deleted');
  });

  await t.test('Invalid Foreign Key reference is rejected by PostgreSQL', async () => {
    const fakeUuid = '99999999-9999-4999-a999-999999999999';
    await assert.rejects(
      async () => {
        await prisma.portal.create({
          data: {
            networkId: fakeUuid,
            address: 'invalid-fk.onion',
            status: 'ONLINE',
            discoveredAt: new Date(),
            createdBy: TEST_TAG,
            sourceVersion: '0.1.0',
          },
        });
      },
      /foreign key constraint/i,
      'Should reject invalid foreign key'
    );
  });
});
