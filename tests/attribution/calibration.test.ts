import test from 'node:test';
import assert from 'node:assert/strict';
import { LogisticAttributionModel } from '../../src/attribution/logistic_model.js';

test('7. Probability Calibration via Platt Scaling', async (t) => {
  await t.test('Calibrated probabilities are monotonic with raw logits and strictly bounded in [0, 1]', () => {
    const model = new LogisticAttributionModel([1.5, 1.2, 1.0, 0.8, 0.5, 0.4], -2.0, 1.8, -0.1);

    const pLow = model.predictCalibrated([0.1, 0.1, 0.1, 0.1, 0.0, 0.0]);
    const pMid = model.predictCalibrated([0.5, 0.5, 0.5, 0.5, 0.2, 0.2]);
    const pHigh = model.predictCalibrated([0.9, 0.9, 0.9, 0.9, 0.8, 0.8]);

    assert.ok(pLow < pMid && pMid < pHigh, 'Calibrated probabilities must be strictly monotonic');
    assert.ok(pLow >= 0.0 && pLow <= 1.0);
    assert.ok(pHigh >= 0.0 && pHigh <= 1.0);
  });
});
