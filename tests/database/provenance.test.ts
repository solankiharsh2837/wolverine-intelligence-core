import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { seed } from '../../prisma/seed.js';

const prisma = new PrismaClient();

test('Provenance Metadata Completeness', async (t) => {
  before(async () => {
    await seed();
  });

  await t.test('Every observation retains full immutable provenance fields', async () => {
    const observations = await prisma.observation.findMany({
      take: 10,
    });

    assert.ok(observations.length > 0, 'Should have observations to inspect');
    for (const obs of observations) {
      assert.ok(obs.networkId, 'Observation must have networkId');
      assert.ok(obs.portalId, 'Observation must have portalId');
      assert.ok(obs.sourceLocator, 'Observation must have sourceLocator');
      assert.ok(obs.artifactId, 'Observation must have artifactId');
      assert.ok(obs.canonicalPayloadHash, 'Observation must have canonicalPayloadHash');
      assert.ok(obs.collectorVersion, 'Observation must have collectorVersion');
      assert.ok(obs.observedAt, 'Observation must have observedAt');
      assert.ok(obs.collectedAt, 'Observation must have collectedAt');
      assert.ok(obs.createdAt, 'Observation must have createdAt');
      assert.ok(obs.createdBy, 'Observation must have createdBy');
      assert.ok(obs.sourceVersion, 'Observation must have sourceVersion');
      assert.ok(typeof obs.provenance === 'object' && obs.provenance !== null, 'Observation must have JSON provenance');
    }
  });

  await t.test('Every identifier retains networkId, firstSeen, lastSeen, and source', async () => {
    const identifiers = await prisma.identifier.findMany();
    assert.ok(identifiers.length > 0, 'Should have identifiers');
    for (const iden of identifiers) {
      assert.ok(iden.networkId, 'Identifier must have networkId');
      assert.ok(iden.firstSeen, 'Identifier must have firstSeen');
      assert.ok(iden.lastSeen, 'Identifier must have lastSeen');
      assert.ok(iden.source, 'Identifier must have source');
      assert.ok(iden.createdBy, 'Identifier must have createdBy');
    }
  });
});
