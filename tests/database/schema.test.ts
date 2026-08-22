import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test('Schema Validation: All 26 canonical tables exist and respond to queries', async (t) => {
  await t.test('Core Identity & Infrastructure Tables', async () => {
    assert.doesNotReject(async () => await prisma.network.count());
    assert.doesNotReject(async () => await prisma.portal.count());
    assert.doesNotReject(async () => await prisma.asset.count());
    assert.doesNotReject(async () => await prisma.actor.count());
    assert.doesNotReject(async () => await prisma.persona.count());
    assert.doesNotReject(async () => await prisma.account.count());
    assert.doesNotReject(async () => await prisma.identifier.count());
  });

  await t.test('Observation & Evidence Tables', async () => {
    assert.doesNotReject(async () => await prisma.artifact.count());
    assert.doesNotReject(async () => await prisma.observation.count());
    assert.doesNotReject(async () => await prisma.relationship.count());
    assert.doesNotReject(async () => await prisma.relationshipEvidence.count());
    assert.doesNotReject(async () => await prisma.infrastructureIndicator.count());
    assert.doesNotReject(async () => await prisma.scan.count());
    assert.doesNotReject(async () => await prisma.finding.count());
  });

  await t.test('Attribution & Behavioral Tables', async () => {
    assert.doesNotReject(async () => await prisma.attributionCandidate.count());
    assert.doesNotReject(async () => await prisma.attributionEvidence.count());
    assert.doesNotReject(async () => await prisma.attributionFeature.count());
    assert.doesNotReject(async () => await prisma.behaviorProfile.count());
    assert.doesNotReject(async () => await prisma.stylometricProfile.count());
    assert.doesNotReject(async () => await prisma.timelineEvent.count());
  });

  await t.test('Dataset, AI, & Trust Tables', async () => {
    assert.doesNotReject(async () => await prisma.dataset.count());
    assert.doesNotReject(async () => await prisma.datasetRecord.count());
    assert.doesNotReject(async () => await prisma.modelVersion.count());
    assert.doesNotReject(async () => await prisma.aIHypothesis.count());
    assert.doesNotReject(async () => await prisma.wolverineEvidence.count());
    assert.doesNotReject(async () => await prisma.trustReceipt.count());
  });
});
