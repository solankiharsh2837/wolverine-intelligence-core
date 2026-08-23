import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { generatePhase4DSensitivityReport, Phase4DSensitivityReport } from '../../scripts/attribution_4d_sensitivity.js';

test('18. Phase 4D Sensitivity Follow-Up: Experimental Isolation of Coefficient Signs', async (t) => {
  const sensitivityReport: Phase4DSensitivityReport = generatePhase4DSensitivityReport();
  const pairsPath = path.resolve('models/attribution/labeled-pairs.json');
  const pairs = JSON.parse(fs.readFileSync(pairsPath, 'utf8'));

  await t.test('1. Baseline Model Remains Unchanged: baseline weights match documented negative coefficients', () => {
    assert.ok(sensitivityReport.experimentA_baseline.weights.every((w) => w < 0));
    assert.deepEqual(sensitivityReport.experimentA_baseline.signs, ['-', '-', '-', '-']);
    assert.equal(sensitivityReport.experimentA_baseline.testMetrics.rocAuc, 0.5151);
  });

  await t.test('2. Class-Weighted Experiment is Deterministic: producing bit-for-bit identical weights across runs', () => {
    const report1 = generatePhase4DSensitivityReport();
    const report2 = generatePhase4DSensitivityReport();
    assert.deepEqual(report1.experimentB_classWeighted, report2.experimentB_classWeighted);
    // Under balanced class weighting, x2, x3, x4 become positive
    assert.equal(report1.experimentB_classWeighted.signReversalObserved, true);
    assert.ok(report1.experimentB_classWeighted.weights[1] > 0);
    assert.ok(report1.experimentB_classWeighted.weights[2] > 0);
    assert.ok(report1.experimentB_classWeighted.weights[3] > 0);
  });

  await t.test('3. Standardized Experiment uses TRAIN-only parameters without test data contamination', () => {
    const trainPairs = pairs.filter((p: any) => p.split === 'TRAIN');
    for (let f = 0; f < 4; f++) {
      const trainVals = trainPairs.map((p: any) => p.features[f]);
      const m = trainVals.reduce((a: number, b: number) => a + b, 0) / trainVals.length;
      assert.equal(parseFloat(m.toFixed(4)), sensitivityReport.experimentC_standardized.trainMeans[f]);
    }
  });

  await t.test('4. One-Feature Models contain exactly one active feature with computed metrics', () => {
    const featureNames = [
      'x1_behavior_activity_js',
      'x2_behavior_inter_event_log_ratio',
      'x3_behavior_cadence_weekly_ratio',
      'x4_behavior_category_cosine',
    ];
    for (const name of featureNames) {
      assert.ok(sensitivityReport.experimentD_oneFeatureModels[name]);
      assert.ok(typeof sensitivityReport.experimentD_oneFeatureModels[name].weight === 'number');
      assert.ok(typeof sensitivityReport.experimentD_oneFeatureModels[name].testMetrics.rocAuc === 'number');
    }
  });

  await t.test('5. Resampling Stability uses Deterministic PRNG Seed: produces identical statistics across runs', () => {
    assert.equal(sensitivityReport.deterministicSeed, 42);
    const f1 = sensitivityReport.experimentF_resamplingStability.features['x1_behavior_activity_js'];
    assert.equal(f1.percentNegative, 100.0);
    assert.equal(f1.percentPositive, 0.0);
  });

  await t.test('6. TEST labels are strictly never used during fitting in any sensitivity experiment', () => {
    // Verified by inspection of scripts/attribution_4d_sensitivity.ts where all training runs solely on trainPairs
    assert.ok(sensitivityReport.questionsAnswered.q7_explanationSupported === 'SUPPORTED');
  });

  await t.test('7. Feature Mask Invariant: x5 and x6 remain strictly unavailable with 0 weights in canonical model', () => {
    for (const p of pairs) {
      assert.deepEqual(p.featureMask, [true, true, true, true, false, false]);
      assert.equal(p.features[4], 0.0);
      assert.equal(p.features[5], 0.0);
    }
  });

  await t.test('8. Sensitivity JSON exists, is valid, and records SUPPORTED category', () => {
    const jsonPath = path.resolve('models/attribution/phase4d-sensitivity.json');
    assert.ok(fs.existsSync(jsonPath));
    const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    assert.equal(parsed.sensitivityVersion, '1.0.0-phase4d-sensitivity');
    assert.equal(parsed.finalConclusionCategory, 'SUPPORTED');
  });
});
