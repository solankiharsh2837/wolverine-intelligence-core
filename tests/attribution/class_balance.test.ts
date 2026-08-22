import test from 'node:test';
import assert from 'node:assert/strict';
import { AttributionPairGenerator } from '../../src/attribution/pair_generator.js';

test('6. Class Balance & Ratio Analysis', async (t) => {
  const generator = new AttributionPairGenerator();

  await t.test('Maintains balanced distribution between positive and negative classes', async () => {
    const pairs = await generator.generatePairsDataset(60);
    const pos = pairs.filter((p) => p.label === 'SAME_ACTOR').length;
    const neg = pairs.filter((p) => p.label === 'DIFFERENT_ACTOR').length;

    assert.ok(pos > 0 && neg > 0);
    const ratio = pos / (pos + neg);
    assert.ok(ratio >= 0.35 && ratio <= 0.65, `Class balance ratio must be between 35% and 65% (got ${(ratio * 100).toFixed(1)}%)`);
  });
});
