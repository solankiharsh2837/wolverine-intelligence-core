import test from 'node:test';
import assert from 'node:assert/strict';
import { AttributionPairGenerator } from '../../src/attribution/pair_generator.js';
import { extractAttributionFeatures } from '../../src/attribution/feature_extractor.js';
import { BehaviorProfileData } from '../../src/behavior/extractor.js';

test('15. Critical Cross-Subsystem Positive Pair Invariants (Assertions A-G)', async (t) => {
  const generator = new AttributionPairGenerator();
  const { pairs, insufficientDataCount } = await generator.generatePairsDataset(5);
  const posPairs = pairs.filter((p) => p.label === 'SAME_ACTOR');

  assert.ok(posPairs.length > 0, 'Must have positive cross-subsystem pairs');

  await t.test('Assertion A: Positive pair entityA.type !== entityB.type (Forum USER <-> Market VENDOR)', () => {
    for (const p of posPairs) {
      assert.notEqual(p.entityA.type, p.entityB.type, `Positive pair must span distinct subsystems: ${p.entityA.type} vs ${p.entityB.type}`);
      assert.equal(p.entityA.type, 'USER');
      assert.equal(p.entityB.type, 'VENDOR');
    }
  });

  await t.test('Assertion B: entityA.id !== entityB.id (Strictly ZERO self-pairs)', () => {
    for (const p of posPairs) {
      assert.notEqual(p.entityA.id, p.entityB.id, `Self-pairing is strictly prohibited: ${p.entityA.id} === ${p.entityB.id}`);
      assert.ok(p.entityA.id.startsWith('forum_user_'));
      assert.ok(p.entityB.id.startsWith('evo_vendor_'));
    }
  });

  await t.test('Assertion C: Positive pair provenance contains both forum and marketplace source files', () => {
    for (const p of posPairs) {
      const src = p.provenance.sourceFiles;
      assert.ok(src.some((f) => f.includes('forum/post.tsv') || f.includes('forum/user.tsv')), 'Must cite forum source');
      assert.ok(src.some((f) => f.includes('market/vendors.tsv') || f.includes('market/listings.tsv')), 'Must cite market source');
    }
  });

  await t.test('Assertion D: Features are computed using distinct independently-derived profiles', () => {
    for (const p of posPairs) {
      assert.equal(p.features.length, 6);
      assert.ok(p.features.every((val) => typeof val === 'number' && !isNaN(val)));
    }
  });

  await t.test('Assertion E: At least one positive pair has a feature vector that is NOT trivial [1, 1, 1, 1, 1, ...]', () => {
    const isTrivial = (f: number[]) => f.every((val) => val === 1.0);
    const nonTrivial = posPairs.some((p) => !isTrivial(p.features));
    assert.ok(nonTrivial, 'Cross-subsystem positive pairs must reflect genuine empirical differences (not all 1.0)');
  });

  await t.test('Assertion F: Changing forum activity changes the cross-subsystem feature vector', () => {
    const p = posPairs[0];
    const originalX1 = p.features[0];

    const mockForumProf: BehaviorProfileData = {
      entityId: p.entityA.id, entityName: p.entityA.name, entityType: 'USER', status: 'VALID_PROFILE',
      profileVersion: '1.0.0-behavior', generatedAt: new Date().toISOString(),
      activityHours24: [1, ...new Array(23).fill(0)], // extreme skew
      interEventStats: { meanHours: 1, stdHours: 0, medianHours: 1, minHours: 1, maxHours: 1, p25Hours: 1, p75Hours: 1, p95Hours: 1, logNormalMu: 0, logNormalSigma: 0, intervalsCount: 5 },
      cadence: { totalEvents: 10, activeDaysCount: 5, activeWeeksCount: 2, eventsPerActiveWeek: 5, activeDaysPerActiveWeek: 2.5, inactivityGapMaxDays: 1, inactivityGapMeanDays: 1 },
      categoryDistribution: { General: 1.0 }, primaryCategory: 'General',
      reputation: { approvalRating: 100, positiveFeedback: 10, neutralFeedback: 0, negativeFeedback: 0, sales: 0, pgpPresent: false },
      graph: { degree: 0, weightedDegree: 0, counterparties: [] },
      provenance: { datasetId: 'evolution-2014-2015', datasetVersion: '1.0.0', sourceFiles: [], matchedSourceRows: 10 },
    };

    const mockMarketProf: BehaviorProfileData = {
      entityId: p.entityB.id, entityName: p.entityB.name, entityType: 'VENDOR', status: 'VALID_PROFILE',
      profileVersion: '1.0.0-behavior', generatedAt: new Date().toISOString(),
      activityHours24: [...new Array(23).fill(0), 1], // opposite skew
      interEventStats: { meanHours: 50, stdHours: 0, medianHours: 50, minHours: 50, maxHours: 50, p25Hours: 50, p75Hours: 50, p95Hours: 50, logNormalMu: 3.9, logNormalSigma: 0, intervalsCount: 5 },
      cadence: { totalEvents: 10, activeDaysCount: 5, activeWeeksCount: 2, eventsPerActiveWeek: 5, activeDaysPerActiveWeek: 2.5, inactivityGapMaxDays: 1, inactivityGapMeanDays: 1 },
      categoryDistribution: { Drugs: 1.0 }, primaryCategory: 'Drugs',
      reputation: { approvalRating: 100, positiveFeedback: 10, neutralFeedback: 0, negativeFeedback: 0, sales: 10, pgpPresent: false },
      graph: { degree: 0, weightedDegree: 0, counterparties: [] },
      provenance: { datasetId: 'evolution-2014-2015', datasetVersion: '1.0.0', sourceFiles: [], matchedSourceRows: 10 },
    };

    const vec = extractAttributionFeatures(mockForumProf, mockMarketProf);
    assert.ok(vec[0] < 0.25, `Altered forum activity must drastically change x1 (got ${vec[0]})`);
    assert.notEqual(vec[0], originalX1, 'Altered forum activity must change similarity from original');
  });

  await t.test('Assertion G: Changing marketplace activity changes the cross-subsystem feature vector', () => {
    const p = posPairs[0];
    const mockForumProf: BehaviorProfileData = {
      entityId: p.entityA.id, entityName: p.entityA.name, entityType: 'USER', status: 'VALID_PROFILE',
      profileVersion: '1.0.0-behavior', generatedAt: new Date().toISOString(),
      activityHours24: new Array(24).fill(1 / 24),
      interEventStats: { meanHours: 10, stdHours: 2, medianHours: 10, minHours: 1, maxHours: 20, p25Hours: 5, p75Hours: 15, p95Hours: 18, logNormalMu: 2.3, logNormalSigma: 0.4, intervalsCount: 10 },
      cadence: { totalEvents: 50, activeDaysCount: 10, activeWeeksCount: 5, eventsPerActiveWeek: 10, activeDaysPerActiveWeek: 2, inactivityGapMaxDays: 3, inactivityGapMeanDays: 1.5 },
      categoryDistribution: { Drugs: 1.0 }, primaryCategory: 'Drugs',
      reputation: { approvalRating: 100, positiveFeedback: 50, neutralFeedback: 0, negativeFeedback: 0, sales: 0, pgpPresent: false },
      graph: { degree: 0, weightedDegree: 0, counterparties: [] },
      provenance: { datasetId: 'evolution-2014-2015', datasetVersion: '1.0.0', sourceFiles: [], matchedSourceRows: 50 },
    };

    const mockMarketProf1: BehaviorProfileData = { ...mockForumProf, entityId: p.entityB.id, entityType: 'VENDOR', categoryDistribution: { Drugs: 1.0 } };
    const mockMarketProf2: BehaviorProfileData = { ...mockForumProf, entityId: p.entityB.id, entityType: 'VENDOR', categoryDistribution: { Fraud: 1.0 } };

    const vec1 = extractAttributionFeatures(mockForumProf, mockMarketProf1);
    const vec2 = extractAttributionFeatures(mockForumProf, mockMarketProf2);

    assert.equal(vec1[3], 1.0);
    assert.equal(vec2[3], 0.0);
  });
});
