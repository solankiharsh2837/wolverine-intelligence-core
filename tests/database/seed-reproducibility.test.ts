import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { seed } from '../../prisma/seed.js';

const prisma = new PrismaClient();

test('Deterministic Development Seed Idempotency & Reproducibility', async () => {
  // 1. Run seed once
  await seed();
  const netCount1 = await prisma.network.count();
  const personaCount1 = await prisma.persona.count();
  const candidateCount1 = await prisma.attributionCandidate.count();

  // 2. Run seed a second time (should cleanly reset and re-seed with exact counts)
  await seed();
  const netCount2 = await prisma.network.count();
  const personaCount2 = await prisma.persona.count();
  const candidateCount2 = await prisma.attributionCandidate.count();

  assert.equal(netCount1, netCount2, 'Network count must be identical across seed runs');
  assert.equal(personaCount1, personaCount2, 'Persona count must be identical across seed runs');
  assert.equal(candidateCount1, candidateCount2, 'AttributionCandidate count must be identical across seed runs');
});
