import test from 'node:test';
import assert from 'node:assert/strict';
import { jaccardSimilaritySets, adamicAdarIndexSets } from '../../src/behavior/similarity.js';

test('6. Graph Features & Adamic-Adar Formula', async (t) => {
  await t.test('Adamic-Adar correctly applies logarithmic neighbor weighting', () => {
    const setA = ['user_10', 'user_20', 'user_30'];
    const setB = ['user_20', 'user_30', 'user_40'];
    const degrees: Record<string, number> = {
      'user_20': 5,
      'user_30': 15,
    };

    const jaccard = jaccardSimilaritySets(setA, setB);
    assert.equal(jaccard, 0.5); // 2 common / 4 total

    const aa = adamicAdarIndexSets(setA, setB, degrees);
    // AA = 1/ln(5) + 1/ln(15) = 0.6213 + 0.3693 = 0.9906
    const expected = parseFloat(((1 / Math.log(5)) + (1 / Math.log(15))).toFixed(4));
    assert.equal(aa, expected);
  });
});
