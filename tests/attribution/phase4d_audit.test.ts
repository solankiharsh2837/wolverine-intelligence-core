import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { generatePhase4DAuditReport, Phase4DAuditReport } from '../../scripts/attribution_4d_audit.js';
import { LogisticAttributionModel, trainLogisticAttributionModel } from '../../src/attribution/logistic_model.js';
import { extractAttributionFeaturesWithMask, ATTRIBUTION_FEATURE_ORDER } from '../../src/attribution/feature_extractor.js';

test('17. Phase 4D Attribution Experiment, Label, Feature & Evaluation Audit', async (t) => {
  const pairsPath = path.resolve('models/attribution/labeled-pairs.json');
  const pairs = JSON.parse(fs.readFileSync(pairsPath, 'utf8'));
  const auditReport: Phase4DAuditReport = generatePhase4DAuditReport();

  await t.test('1. Ground-Truth Pair Uniqueness: all positive pairs are unique (100% uniqueness rate)', () => {
    assert.equal(auditReport.sampleCounts.duplicatePairsCount, 0);
    assert.equal(auditReport.sampleCounts.positivePairUniquenessRate, 1.0);
    const posKeys = new Set();
    for (const p of pairs.filter((x: any) => x.numericLabel === 1)) {
      const k = `${p.entityA.id}:::${p.entityB.id}`;
      assert.ok(!posKeys.has(k), `Duplicate positive pair found: ${k}`);
      posKeys.add(k);
    }
  });

  await t.test('2. No Positive/Negative Contradiction: no pair appears as both positive and negative', () => {
    const posKeys = new Set(pairs.filter((p: any) => p.numericLabel === 1).map((p: any) => `${p.entityA.id}:::${p.entityB.id}`));
    const negKeys = new Set(pairs.filter((p: any) => p.numericLabel === 0).map((p: any) => `${p.entityA.id}:::${p.entityB.id}`));

    for (const pk of posKeys) {
      assert.ok(!negKeys.has(pk), `Contradiction: pair ${pk} is marked as both positive and negative!`);
    }
  });

  await t.test('3. Zero Self-Pairs: all pairs satisfy entityA.id !== entityB.id and entityA.type !== entityB.type', () => {
    for (const p of pairs) {
      assert.notEqual(p.entityA.id, p.entityB.id, `Self-pairing detected: ${p.entityA.id}`);
      assert.notEqual(p.entityA.type, p.entityB.type, `Subsystem self-comparison detected: ${p.entityA.type}`);
    }
  });

  await t.test('4. Deterministic Negative Generation: audit report produces bit-for-bit identical stats across runs', () => {
    const report1 = generatePhase4DAuditReport();
    const report2 = generatePhase4DAuditReport();
    assert.deepEqual(report1.sampleCounts, report2.sampleCounts);
    assert.deepEqual(report1.featureDistributionSummaries, report2.featureDistributionSummaries);
    assert.deepEqual(report1.baselineMetrics, report2.baselineMetrics);
  });

  await t.test('5. Deterministic Evaluation: model scores and predictions are strictly deterministic', () => {
    const testPairs = pairs.filter((p: any) => p.split === 'TEST');
    const model = new LogisticAttributionModel(
      [-0.3867, -0.9341, -0.4527, -0.5018, 0, 0],
      -1.8679,
      1.077,
      -0.063
    );

    const scores1 = testPairs.map((p: any) => model.predictCalibrated(p.features));
    const scores2 = testPairs.map((p: any) => model.predictCalibrated(p.features));
    assert.deepEqual(scores1, scores2);
  });

  await t.test('6. Split Match Disjointness: Ground truth match IDs strictly do not cross splits', () => {
    assert.equal(auditReport.splitOverlapDiagnostics.trainValMatchIdOverlap, 0);
    assert.equal(auditReport.splitOverlapDiagnostics.trainTestMatchIdOverlap, 0);
    assert.equal(auditReport.splitOverlapDiagnostics.valTestMatchIdOverlap, 0);
  });

  await t.test('7. No Label Leakage Through Features: features are bounded in [0, 1] without label injection', () => {
    for (const p of pairs) {
      assert.ok(p.features.every((v: number) => typeof v === 'number' && !isNaN(v) && v >= 0 && v <= 1));
      // Verify features do not trivially equal the numeric label
      assert.ok(!p.features.every((v: number) => v === p.numericLabel));
    }
  });

  await t.test('8. Calibration is Validation-Only: Platt scaling params fit on validation split, never on test', () => {
    assert.equal(auditReport.calibrationDiagnostics.calibratedOnSplit, 'VALIDATION');
    assert.equal(auditReport.calibrationDiagnostics.evaluatedOnSplit, 'TEST');
  });

  await t.test('9. Baseline Calculations: all required baselines exist with calculated metrics', () => {
    assert.ok(auditReport.baselineMetrics.naivePriorBaseline);
    assert.ok(auditReport.baselineMetrics.singleFeatureBaselines['x1_behavior_activity_js']);
    assert.ok(auditReport.baselineMetrics.singleFeatureBaselines['x2_behavior_inter_event_log_ratio']);
    assert.ok(auditReport.baselineMetrics.singleFeatureBaselines['x3_behavior_cadence_weekly_ratio']);
    assert.ok(auditReport.baselineMetrics.singleFeatureBaselines['x4_behavior_category_cosine']);
    assert.ok(auditReport.baselineMetrics.unweightedFeatureAverageBaseline);
    assert.ok(auditReport.baselineMetrics.logisticRegressionPlattCalibrated);
  });

  await t.test('10. Audit JSON Schema & Content: phase4d-audit.json exists and is valid', () => {
    const jsonPath = path.resolve('models/attribution/phase4d-audit.json');
    assert.ok(fs.existsSync(jsonPath), 'phase4d-audit.json must exist');
    const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    assert.equal(parsed.auditVersion, '1.0.0-phase4d');
    assert.equal(parsed.scientificConclusionCategory, 'WEAK EVIDENCE');
  });

  await t.test('11. Feature Mask Invariant: feature mask is [true, true, true, true, false, false]', () => {
    assert.deepEqual(auditReport.featureAvailabilityMask.mask, [true, true, true, true, false, false]);
    for (const p of pairs) {
      assert.deepEqual(p.featureMask, [true, true, true, true, false, false]);
    }
  });

  await t.test('12. Incompatible Graph Features (x5, x6) remain UNAVAILABLE with zero weights', () => {
    assert.equal(auditReport.featureDirectionAnalysis.multivariateCoefficients.x5_graph_jaccard, 0);
    assert.equal(auditReport.featureDirectionAnalysis.multivariateCoefficients.x6_graph_adamic_adar_norm, 0);
    for (const p of pairs) {
      assert.equal(p.features[4], 0.0);
      assert.equal(p.features[5], 0.0);
    }
  });
});
