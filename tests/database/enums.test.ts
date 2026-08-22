import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient, RelationshipType, RelationshipClass, RelationshipStatus, EvidenceClass, HypothesisType, HypothesisStatus, DatasetUsage } from '@prisma/client';

const prisma = new PrismaClient();

test('Enum Fidelity & Specification Compliance', async (t) => {
  await t.test('RelationshipType contains all 21 specification types', () => {
    const requiredTypes = [
      'AUTHORED', 'POSTED', 'REPLIED_TO', 'MESSAGED', 'LISTED',
      'BOUGHT_FROM', 'SOLD_TO', 'REPUTATION_FOR', 'VOUCHED_FOR',
      'USES_ACCOUNT', 'HAS_ALIAS', 'USES_WALLET', 'USES_PGP_KEY',
      'POSSIBLE_SAME_AS', 'MIGRATED_TO', 'SHARES_INFRASTRUCTURE',
      'SHARES_FINGERPRINT', 'SHARES_COUNTERPARTY', 'TEMPORALLY_CORRELATED',
      'COMMUNITY_OVERLAP', 'INSTRUMENTED_BY'
    ];

    for (const rType of requiredTypes) {
      assert.ok(rType in RelationshipType, `RelationshipType must include ${rType}`);
    }
  });

  await t.test('RelationshipStatus adheres to exact lifecycle', () => {
    const lifecycle = ['PROPOSED', 'VALIDATED', 'ACTIVE', 'SUPERSEDED', 'RETRACTED'];
    for (const st of lifecycle) {
      assert.ok(st in RelationshipStatus, `RelationshipStatus must include ${st}`);
    }
  });

  await t.test('EvidenceClass contains all 5 evidence classes', () => {
    const classes = ['OBSERVED', 'DETERMINISTIC_MATCH', 'STATISTICAL_MATCH', 'AI_HYPOTHESIS', 'CRYPTOGRAPHIC_PROOF'];
    for (const cl of classes) {
      assert.ok(cl in EvidenceClass, `EvidenceClass must include ${cl}`);
    }
  });

  await t.test('DatasetUsage contains all 6 usage designations', () => {
    const usages = ['TRAINING', 'VALIDATION', 'TEST', 'FEATURE_ENGINEERING', 'SYNTHETIC_CALIBRATION', 'REFERENCE_ONLY'];
    for (const u of usages) {
      assert.ok(u in DatasetUsage, `DatasetUsage must include ${u}`);
    }
  });
});
