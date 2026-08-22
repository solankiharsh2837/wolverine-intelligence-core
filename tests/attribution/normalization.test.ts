import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAttributionVector } from '../../src/attribution/feature_extractor.js';

test('4. Feature Normalization & Bounded Constraints', async (t) => {
  await t.test('Strictly constrains all feature dimensions to [0.0, 1.0]', () => {
    const raw = [1.5, -0.2, NaN, 0.85, Infinity, 0.3];
    const norm = normalizeAttributionVector(raw);

    assert.equal(norm[0], 1.0, 'Values > 1.0 must clamp to 1.0');
    assert.equal(norm[1], 0.0, 'Values < 0.0 must clamp to 0.0');
    assert.equal(norm[2], 0.0, 'NaN must normalize to 0.0');
    assert.equal(norm[3], 0.85);
    assert.equal(norm[4], 0.0, 'Infinity must normalize to 0.0');
    assert.equal(norm[5], 0.3);
  });
});
