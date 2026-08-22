import test from 'node:test';
import assert from 'node:assert/strict';
import { trainLogisticAttributionModel } from '../../src/attribution/logistic_model.js';
import { AttributionPair } from '../../src/attribution/types.js';

test('12. Deterministic Repeatability with Fixed Random Seed', async (t) => {
  await t.test('Training twice with identical seed produces bit-for-bit identical weights and bias', () => {
    const mockPairs: AttributionPair[] = [
      {
        pairId: 'p1', entityA: { id: '1', name: 'A', type: 'VENDOR' }, entityB: { id: '2', name: 'B', type: 'USER' },
        label: 'SAME_ACTOR', numericLabel: 1, pairType: 'POSITIVE_GROUND_TRUTH_MATCH', labelSource: '',
        datasetId: 'evolution-2014-2015', datasetVersion: '1.0.0', split: 'TRAIN', featureVersion: '1.0.0',
        features: [0.8, 0.7, 0.6, 0.9, 0.0, 0.0],
        featureNames: ['x1', 'x2', 'x3', 'x4', 'x5', 'x6'],
        featureMask: [true, true, true, true, false, false],
        provenance: { sourceFiles: [], createdAt: '' },
        notes: '',
      },
      {
        pairId: 'p2', entityA: { id: '3', name: 'C', type: 'VENDOR' }, entityB: { id: '4', name: 'D', type: 'VENDOR' },
        label: 'DIFFERENT_ACTOR', numericLabel: 0, pairType: 'NEGATIVE_RANDOM', labelSource: '',
        datasetId: 'evolution-2014-2015', datasetVersion: '1.0.0', split: 'TRAIN', featureVersion: '1.0.0',
        features: [0.1, 0.2, 0.1, 0.05, 0.0, 0.0],
        featureNames: ['x1', 'x2', 'x3', 'x4', 'x5', 'x6'],
        featureMask: [true, true, true, true, false, false],
        provenance: { sourceFiles: [], createdAt: '' },
        notes: '',
      },
    ];

    const run1 = trainLogisticAttributionModel(mockPairs, mockPairs, { randomSeed: 42 });
    const run2 = trainLogisticAttributionModel(mockPairs, mockPairs, { randomSeed: 42 });

    assert.deepEqual(run1.config.weights, run2.config.weights);
    assert.equal(run1.config.bias, run2.config.bias);
    assert.deepEqual(run1.config.plattScaling, run2.config.plattScaling);
  });
});
