import test from 'node:test';
import assert from 'node:assert/strict';
import {
  jensenShannonSimilarity,
  klDivergence,
  cosineSimilarityMap,
  logRatioSimilarity,
} from '../../src/behavior/similarity.js';

test('9. Numerical Stability & Edge Cases', async (t) => {
  await t.test('Handles zero distributions and empty vectors gracefully', () => {
    assert.equal(klDivergence([0, 0], [0, 0]), 0);
    assert.equal(jensenShannonSimilarity([0, 0], [0, 0]), 1.0);
    assert.equal(cosineSimilarityMap({}, {}), 0.0);
    assert.equal(logRatioSimilarity(0, 0), 1.0);
  });

  await t.test('Extreme ratio does not produce NaN or Infinity', () => {
    const sim = logRatioSimilarity(0.0001, 1000000);
    assert.ok(!isNaN(sim));
    assert.ok(isFinite(sim));
    assert.ok(sim >= 0.0 && sim <= 1.0);
  });
});
