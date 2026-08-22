import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { seed } from '../../prisma/seed.js';

const prisma = new PrismaClient();

test('Master Trace Traversal: Dataset -> Record -> Artifact -> Observation -> Identifier -> Persona -> Actor -> Relationship -> Candidate', async () => {
  await seed();

  // Step 1: Query Dataset
  const dataset = await prisma.dataset.findUnique({
    where: { id: '55555555-5555-4555-a555-555555555555' },
    include: { records: true },
  });
  assert.ok(dataset, 'Step 1: Dataset must exist');
  assert.ok(dataset.records.length > 0, 'Step 2: DatasetRecord must exist');

  // Step 2: Query Observation derived from Dataset & Artifact
  const observation = await prisma.observation.findUnique({
    where: { id: '88888888-8888-4888-a888-888888888881' },
    include: { artifact: true, network: true, portal: true },
  });
  assert.ok(observation, 'Step 3: Observation must exist');
  assert.equal(observation.artifactId, '77777777-7777-4777-a777-777777777771', 'Step 4: Artifact ID must match');
  assert.ok(observation.artifact.rawData.length > 0, 'Raw data must be preserved');

  // Step 3: Query Identifier referenced in observation
  const identifier = await prisma.identifier.findUnique({
    where: { id: '99999999-9999-4999-a999-999999999993' }, // Shared PGP
  });
  assert.ok(identifier, 'Step 5: Identifier must exist');
  assert.ok(identifier.observationIds.includes(observation.id), 'Identifier must reference Observation');

  // Step 4: Query Persona and Actor
  const torPersona = await prisma.persona.findUnique({
    where: { id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' },
    include: { actor: true, behaviorProfiles: true, stylometricProfiles: true },
  });
  assert.ok(torPersona, 'Step 6: Tor Persona must exist');
  assert.equal(torPersona.name, 'DarkPhoenix');
  assert.ok(torPersona.actor, 'Step 7: Actor must be resolved');
  assert.equal(torPersona.actor.id, 'cccccccc-cccc-4ccc-accc-cccccccccccc');

  // Step 5: Query Relationship and Attribution Candidate
  const relationship = await prisma.relationship.findUnique({
    where: { id: 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee' },
    include: { evidences: true },
  });
  assert.ok(relationship, 'Step 8: Relationship must exist');
  assert.equal(relationship.confidence, 0.94);
  assert.ok(relationship.evidences.length > 0, 'Relationship must have evidence');

  const candidate = await prisma.attributionCandidate.findUnique({
    where: { id: 'ffffffff-ffff-4fff-afff-ffffffffffff' },
    include: { features: true },
  });
  assert.ok(candidate, 'Step 9: Attribution Candidate must exist');
  assert.equal(candidate.score, 0.94);
  assert.equal(candidate.features.length, 10, 'Feature vector must contain all 10 features');

  // Step 6: Query Wolverine Cryptographic Evidence & Besu Trust Receipt
  const wolverineEv = await prisma.wolverineEvidence.findUnique({
    where: { id: '30303030-3030-4030-a030-303030303030' },
    include: { trustReceipts: true },
  });
  assert.ok(wolverineEv, 'Step 10: Wolverine cryptographic evidence must exist');
  assert.ok(wolverineEv.trustReceipts.length > 0, 'Besu trust receipt must be linked');
  assert.ok(wolverineEv.trustReceipts[0].transactionId.startsWith('0x'), 'Transaction ID must be valid hex');
});
