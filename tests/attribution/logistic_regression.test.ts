import test from 'node:test';
import assert from 'node:assert/strict';
import { LogisticAttributionModel, trainLogisticAttributionModel } from '../../src/attribution/logistic_model.js';
import { AttributionPair } from '../../src/attribution/types.js';

test('5. Logistic Regression Optimization & Mathematical Training', async (t) => {
  await t.test('Gradient descent converges with non-trivial learned weights', () => {
    const trainPairs: AttributionPair[] = [
      {
        pairId: 'p1', entityA: { id: '1', name: 'A', type: 'VENDOR' }, entityB: { id: '2', name: 'B', type: 'USER' },
        label: 'SAME_ACTOR', numericLabel: 1, pairType: 'POSITIVE_GROUND_TRUTH_MATCH', labelSource: '',
        datasetId: 'evolution-2014-2015', datasetVersion: '1.0.0', split: 'TRAIN', featureVersion: '1.0.0',
        features: [0.9, 0.85, 0.9, 0.95, 0.7, 0.6], featureNames: [], provenance: { sourceFiles: [], createdAt: '' }, notes: '',
      },
      {
        pairId: 'p2', entityA: { id: '3', name: 'C', type: 'VENDOR' }, entityB: { id: '4', name: 'D', type: 'VENDOR' },
        label: 'DIFFERENT_ACTOR', numericLabel: 0, pairType: 'NEGATIVE_RANDOM', labelSource: '',
        datasetId: 'evolution-2014-2015', datasetVersion: '1.0.0', split: 'TRAIN', featureVersion: '1.0.0',
        features: [0.1, 0.05, 0.1, 0.1, 0.0, 0.0], featureNames: [], provenance: { sourceFiles: [], createdAt: '' }, notes: '',
      },
    ];

    const { model, config } = trainLogisticAttributionModel(trainPairs, trainPairs, { maxEpochs: 100 });
    assert.equal(config.weights.length, 6);
    assert.ok(config.bias < 0, 'Bias should be negative to establish baseline prior');
    assert.ok(config.weights[0] > 0, 'Activity similarity should have positive weight');

    const probPos = model.predictRaw([0.9, 0.85, 0.9, 0.95, 0.7, 0.6]);
    const probNeg = model.predictRaw([0.1, 0.05, 0.1, 0.1, 0.0, 0.0]);
    assert.ok(probPos > probNeg, 'Positive pair probability must be significantly higher than negative pair');
  });
});
