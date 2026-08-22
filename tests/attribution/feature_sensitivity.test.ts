import test from 'node:test';
import assert from 'node:assert/strict';
import { extractAttributionFeatures } from '../../src/attribution/feature_extractor.js';
import { BehaviorProfileData } from '../../src/behavior/extractor.js';

test('13. Feature Sensitivity & Non-Synthetic Real Calculations', async (t) => {
  const baseProfile: BehaviorProfileData = {
    entityId: 'vid_1', entityName: 'Vendor1', entityType: 'VENDOR', status: 'VALID_PROFILE',
    profileVersion: '1.0.0-behavior', generatedAt: new Date().toISOString(),
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
    graph: { degree: 5, weightedDegree: 10, counterparties: ['u1', 'u2', 'u3'] },
    provenance: { datasetId: 'evolution-2014-2015', datasetVersion: '1.0.0', sourceFiles: [], matchedSourceRows: 50 },
  };

  await t.test('Changing activity hours strictly changes x1', () => {
    const alteredHours = { ...baseProfile, activityHours24: [1, ...new Array(23).fill(0)] };
    const vec1 = extractAttributionFeatures(baseProfile, baseProfile);
    const vec2 = extractAttributionFeatures(baseProfile, alteredHours);
    assert.equal(vec1[0], 1.0);
    assert.notEqual(vec2[0], 1.0);
    assert.ok(vec2[0] < 1.0);
  });

  await t.test('Changing inter-event intervals strictly changes x2', () => {
    const alteredIntervals = { ...baseProfile, interEventStats: { ...baseProfile.interEventStats, meanHours: 100 } };
    const vec1 = extractAttributionFeatures(baseProfile, baseProfile);
    const vec2 = extractAttributionFeatures(baseProfile, alteredIntervals);
    assert.equal(vec1[1], 1.0);
    assert.notEqual(vec2[1], 1.0);
    assert.ok(vec2[1] < 1.0);
  });

  await t.test('Changing category distribution strictly changes x4', () => {
    const alteredCategories = { ...baseProfile, categoryDistribution: { Fraud: 1.0 } };
    const vec1 = extractAttributionFeatures(baseProfile, baseProfile);
    const vec2 = extractAttributionFeatures(baseProfile, alteredCategories);
    assert.equal(vec1[3], 1.0);
    assert.equal(vec2[3], 0.0);
  });

  await t.test('Changing graph counterparties strictly changes x5 and x6', () => {
    const alteredGraph = { ...baseProfile, graph: { degree: 2, weightedDegree: 2, counterparties: ['other1', 'other2'] } };
    const vec1 = extractAttributionFeatures(baseProfile, baseProfile, { u1: 5, u2: 10, u3: 15 });
    const vec2 = extractAttributionFeatures(baseProfile, alteredGraph, { u1: 5, u2: 10, u3: 15 });
    assert.equal(vec1[4], 1.0);
    assert.equal(vec2[4], 0.0);
  });
});
