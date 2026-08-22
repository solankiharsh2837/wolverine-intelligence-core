import test from 'node:test';
import assert from 'node:assert/strict';
import { extractStylometricFeatures, extractBehaviorFeatures, extractGraphFeatures } from '../../scripts/features/extract_features.js';

test('6. Feature Extraction Determinism & Exact Adamic-Adar Formula', async (t) => {
  await t.test('Stylometric feature extraction produces identical output on repeated runs', () => {
    const text = 'Bulletproof proxy services with 99.9% uptime. Contact via PGP 0x98A172BC9B78EF12.';
    const run1 = extractStylometricFeatures(text);
    const run2 = extractStylometricFeatures(text);

    assert.deepEqual(run1, run2, 'Stylometric features must be strictly deterministic');
    assert.ok(run1.sentenceStats.sentenceCount > 0);
    assert.ok(Object.keys(run1.charNgrams2).length > 0);
  });

  await t.test('Behavioral feature extraction produces identical output on repeated runs', () => {
    const timestamps = [
      '2026-01-10T12:00:00Z',
      '2026-01-11T14:30:00Z',
      '2026-01-15T18:00:00Z',
    ];
    const run1 = extractBehaviorFeatures(timestamps);
    const run2 = extractBehaviorFeatures(timestamps);

    assert.deepEqual(run1, run2, 'Behavioral features must be strictly deterministic');
    assert.equal(run1.timeOfDayHistogram24.length, 24);
  });

  await t.test('Graph feature extraction implements exact Adamic-Adar formula using neighbor degrees', () => {
    const neighborsA = ['node_x', 'node_y', 'node_z'];
    const neighborsB = ['node_y', 'node_z', 'node_w'];
    // Degrees of common neighbors: node_y deg=10, node_z deg=5
    const degreesMap: Record<string, number> = {
      'node_y': 10,
      'node_z': 5
    };

    const run = extractGraphFeatures(neighborsA, neighborsB, degreesMap);

    assert.equal(run.commonNeighborsCount, 2);
    assert.equal(run.jaccardSimilarity, 0.5);

    // Expected AA = 1/ln(10) + 1/ln(5) = 0.43429 + 0.62133 = 1.0556
    const expectedAA = parseFloat(((1 / Math.log(10)) + (1 / Math.log(5))).toFixed(4));
    assert.equal(run.adamicAdarIndex, expectedAA, 'Adamic-Adar must strictly match mathematical formula');
  });
});
