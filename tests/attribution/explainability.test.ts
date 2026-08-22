import test from 'node:test';
import assert from 'node:assert/strict';
import { LogisticAttributionModel } from '../../src/attribution/logistic_model.js';

test('9. Mathematical Explainability & Feature Contribution Decomposition', async (t) => {
  await t.test('Feature contributions sum exactly to raw linear logit z', () => {
    const weights = [1.2, 1.4, 1.0, -0.3, 0.8, 0.9];
    const bias = -2.0;
    const model = new LogisticAttributionModel(weights, bias);

    const x = [0.8, 0.7, 0.6, 0.9, 0.4, 0.5];
    const exp = model.explain(x, 'ActorX', 'ActorY');

    let sumContributions = bias;
    for (const d of exp.decomposition) {
      sumContributions += d.contribution;
    }

    assert.ok(Math.abs(sumContributions - exp.rawLogit) < 0.001, 'Sum of contributions + bias must equal raw logit z');
    assert.equal(exp.decomposition.length, 6);
  });
});
