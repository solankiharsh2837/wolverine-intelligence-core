import test from 'node:test';
import assert from 'node:assert/strict';
import { ATTRIBUTION_FEATURE_ORDER, extractAttributionFeatures } from '../../src/attribution/feature_extractor.js';
import { BehaviorProfileData } from '../../src/behavior/extractor.js';

test('3. Feature Vector Specification & Dimension Ordering', async (t) => {
  await t.test('Extracts canonical 6-dimensional feature vector in exact documented order', () => {
    assert.equal(ATTRIBUTION_FEATURE_ORDER.length, 6);
    assert.deepEqual(ATTRIBUTION_FEATURE_ORDER, [
      'behavior_activity_js',
      'behavior_inter_event_log_ratio',
      'behavior_cadence_weekly_ratio',
      'behavior_category_cosine',
      'graph_jaccard',
      'graph_adamic_adar_norm',
    ]);

    const mockProfile: BehaviorProfileData = {
      entityId: 'test_1',
      entityName: 'Test1',
      entityType: 'VENDOR',
      status: 'VALID_PROFILE',
      profileVersion: '1.0.0-behavior',
      generatedAt: new Date().toISOString(),
      activityHours24: new Array(24).fill(1 / 24),
      interEventStats: {
        meanHours: 10, stdHours: 2, medianHours: 10, minHours: 1, maxHours: 20,
        p25Hours: 5, p75Hours: 15, p95Hours: 18, logNormalMu: 2.3, logNormalSigma: 0.4, intervalsCount: 10,
      },
      cadence: {
        totalEvents: 50, activeDaysCount: 10, activeWeeksCount: 5,
        eventsPerActiveWeek: 10, activeDaysPerActiveWeek: 2, inactivityGapMaxDays: 3, inactivityGapMeanDays: 1.5,
      },
      categoryDistribution: { Drugs: 0.8, Services: 0.2 },
      primaryCategory: 'Drugs',
      reputation: { approvalRating: 100, positiveFeedback: 50, neutralFeedback: 0, negativeFeedback: 0, sales: 50, pgpPresent: true },
      graph: { degree: 5, weightedDegree: 10, counterparties: ['u1', 'u2'] },
      provenance: { datasetId: 'evolution-2014-2015', datasetVersion: '1.0.0', sourceFiles: [], matchedSourceRows: 50 },
    };

    const vec = extractAttributionFeatures(mockProfile, mockProfile);
    assert.equal(vec.length, 6);
    assert.equal(vec[0], 1.0); // JS similarity to self = 1.0
    assert.equal(vec[1], 1.0); // Log ratio to self = 1.0
    assert.equal(vec[2], 1.0); // Cadence ratio to self = 1.0
    assert.equal(vec[3], 1.0); // Cosine to self = 1.0
    assert.equal(vec[4], 1.0); // Jaccard to self = 1.0
  });
});
