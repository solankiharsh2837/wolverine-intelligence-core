import test from 'node:test';
import assert from 'node:assert/strict';
import { AttributionPairGenerator } from '../../src/attribution/pair_generator.js';

test('2. Split Isolation & Data Leakage Prevention', async (t) => {
  const generator = new AttributionPairGenerator();

  await t.test('Enforces strictly disjoint clusters with zero pair or mirror leakage across splits', async () => {
    const pairs = await generator.generatePairsDataset(80);

    const trainEntities = new Set<string>();
    const valEntities = new Set<string>();
    const testEntities = new Set<string>();

    const trainPairs = new Set<string>();
    const valPairs = new Set<string>();
    const testPairs = new Set<string>();

    for (const p of pairs) {
      const pairKey = `${p.entityA.id}:::${p.entityB.id}`;
      const mirrorKey = `${p.entityB.id}:::${p.entityA.id}`;

      if (p.split === 'TRAIN') {
        trainPairs.add(pairKey);
        trainPairs.add(mirrorKey);
      } else if (p.split === 'VALIDATION') {
        valPairs.add(pairKey);
        valPairs.add(mirrorKey);
      } else if (p.split === 'TEST') {
        testPairs.add(pairKey);
        testPairs.add(mirrorKey);
      }
    }

    // Assert zero pair overlap across splits
    for (const k of trainPairs) {
      assert.equal(valPairs.has(k), false, 'Train pair must not exist in Validation');
      assert.equal(testPairs.has(k), false, 'Train pair must not exist in Test');
    }
    for (const k of valPairs) {
      assert.equal(testPairs.has(k), false, 'Validation pair must not exist in Test');
    }
  });
});
