import test from 'node:test';
import assert from 'node:assert/strict';
import { AttributionPairGenerator } from '../../src/attribution/pair_generator.js';

test('1. Attribution Pair Construction & Ground Truth Labels', async (t) => {
  const generator = new AttributionPairGenerator();

  await t.test('Loads verified ground-truth matches and constructs positive and hard negative pairs', async () => {
    const pairs = await generator.generatePairsDataset(60);
    assert.ok(pairs.length > 0, 'Must generate pairs');

    const posPairs = pairs.filter((p) => p.label === 'SAME_ACTOR');
    const hardNegPairs = pairs.filter((p) => p.pairType === 'NEGATIVE_HARD_CATEGORY_OVERLAP');
    const rndNegPairs = pairs.filter((p) => p.pairType === 'NEGATIVE_RANDOM');

    assert.ok(posPairs.length > 0, 'Must include positive ground truth pairs');
    assert.ok(hardNegPairs.length > 0, 'Must include hard negative category overlap pairs');
    assert.ok(rndNegPairs.length > 0, 'Must include random negative pairs');

    // Validate pair structure
    const p = posPairs[0];
    assert.ok(p.pairId);
    assert.equal(p.label, 'SAME_ACTOR');
    assert.equal(p.numericLabel, 1);
    assert.equal(p.datasetId, 'evolution-2014-2015');
    assert.equal(p.features.length, 6);
  });
});
