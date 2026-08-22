import test from 'node:test';
import assert from 'node:assert/strict';
import { adamicAdarIndexSets } from '../../src/behavior/similarity.js';

test('11. Adamic-Adar Missing Degree Policy', async (t) => {
  await t.test('Common neighbor with missing degree in degreesMap is strictly skipped (no assumed degree=2)', () => {
    const setA = ['node_a', 'node_b', 'node_c'];
    const setB = ['node_b', 'node_c', 'node_d'];

    // node_b has degree 10, node_c is MISSING from degreesMap
    const degreesMap: Record<string, number> = {
      'node_b': 10,
    };

    const aa = adamicAdarIndexSets(setA, setB, degreesMap);
    // Expected: ONLY node_b contributes (1/ln(10) = 0.4343). node_c is strictly skipped!
    const expected = parseFloat((1 / Math.log(10)).toFixed(4));

    assert.equal(aa, expected, `Adamic-Adar must strictly equal 1/ln(10) = ${expected}, got ${aa}`);
  });
});
