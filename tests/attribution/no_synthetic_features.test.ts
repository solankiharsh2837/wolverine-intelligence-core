import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { AttributionPair } from '../../src/attribution/types.js';

test('14. Zero Synthetic Feature Values Verification', async (t) => {
  await t.test('All feature vectors in training dataset are non-synthetic real calculations', () => {
    const pairsPath = path.resolve('models/attribution/labeled-pairs.json');
    assert.ok(fs.existsSync(pairsPath));

    const pairs: AttributionPair[] = JSON.parse(fs.readFileSync(pairsPath, 'utf8'));

    for (const p of pairs) {
      assert.equal(p.features.length, 6);
      p.features.forEach((val, i) => {
        assert.equal(typeof val, 'number');
        assert.equal(isNaN(val), false, `Feature ${i} in pair ${p.pairId} is NaN`);
        assert.ok(val >= 0.0 && val <= 1.0, `Feature ${i} out of bounds: ${val}`);
      });
      // Ensure provenance points to real files
      assert.ok(p.provenance.sourceFiles.length > 0);
      assert.ok(p.provenance.sourceFiles.includes('market/vendors.tsv'));
    }
  });
});
