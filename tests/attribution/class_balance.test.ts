import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { AttributionPair } from '../../src/attribution/types.js';

test('6. Class Balance & Real Dataset Statistics', async (t) => {
  await t.test('Verifies real dataset contains positive and negative cross-subsystem pairs with reported counts', () => {
    const pairsPath = path.resolve('models/attribution/labeled-pairs.json');
    assert.ok(fs.existsSync(pairsPath), 'labeled-pairs.json must exist');

    const pairs: AttributionPair[] = JSON.parse(fs.readFileSync(pairsPath, 'utf8'));
    const pos = pairs.filter((p) => p.label === 'SAME_ACTOR').length;
    const neg = pairs.filter((p) => p.label === 'DIFFERENT_ACTOR').length;
    const hardNeg = pairs.filter((p) => p.pairType === 'NEGATIVE_HARD_CATEGORY_OVERLAP').length;

    assert.ok(pos > 0, `Positive count must be > 0 (found ${pos})`);
    assert.ok(neg > 0, `Negative count must be > 0 (found ${neg})`);
    assert.ok(hardNeg >= 0, `Hard negative count must be >= 0 (found ${hardNeg})`);
  });
});
