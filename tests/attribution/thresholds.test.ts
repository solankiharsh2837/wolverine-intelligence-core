import test from 'node:test';
import assert from 'node:assert/strict';
import { LogisticAttributionModel } from '../../src/attribution/logistic_model.js';

test('8. Thresholds & Candidate Operating Points', async (t) => {
  await t.test('Classifies attribution candidates according to established probability tiers', () => {
    const model = new LogisticAttributionModel();

    const highMatch = model.explain([0.95, 0.90, 0.92, 0.95, 0.8, 0.8], 'VendorA', 'VendorB');
    assert.equal(highMatch.classification, 'POSSIBLE_SAME_AS');
    assert.equal(highMatch.confidenceTier, 'HIGH');

    const lowMatch = model.explain([0.05, 0.05, 0.05, 0.05, 0.0, 0.0], 'VendorC', 'VendorD');
    assert.equal(lowMatch.classification, 'DISTINCT_ENTITIES');
    assert.equal(lowMatch.confidenceTier, 'HIGH');
  });
});
