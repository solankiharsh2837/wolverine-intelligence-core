import test from 'node:test';
import assert from 'node:assert/strict';
import { AttributionPairGenerator } from '../../src/attribution/pair_generator.js';

test('1. Real Data Attribution Pair Construction', async (t) => {
  const generator = new AttributionPairGenerator();

  await t.test('Constructs real labeled pairs directly from Evolution source records', async () => {
    const { pairs, insufficientDataCount } = await generator.generatePairsDataset(3);
    assert.ok(pairs.length >= 3, 'Must generate pairs from 3 profiled entities');

    const posPairs = pairs.filter((p) => p.label === 'SAME_ACTOR');
    const negPairs = pairs.filter((p) => p.label === 'DIFFERENT_ACTOR');

    assert.ok(posPairs.length > 0, 'Must include positive ground truth pairs');
    assert.ok(negPairs.length > 0, 'Must include negative pairs');

    const p = posPairs[0];
    assert.ok(p.pairId);
    assert.equal(p.label, 'SAME_ACTOR');
    assert.equal(p.datasetId, 'evolution-2014-2015');
    assert.equal(p.features.length, 6);
    assert.ok(p.features.every((val) => typeof val === 'number' && !isNaN(val) && val >= 0 && val <= 1));
  });
});
