import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapMarketCategoryToCanonical,
  CANONICAL_CATEGORIES,
} from '../../src/behavior/extractor.js';
import {
  extractAttributionFeaturesWithMask,
  ATTRIBUTION_FEATURE_ORDER,
} from '../../src/attribution/feature_extractor.js';
import { BehaviorProfileData } from '../../src/behavior/extractor.js';
import { AttributionPairGenerator } from '../../src/attribution/pair_generator.js';

test('16. Attribution Feature Validity Audit & Semantic Alignment (Phase 4C)', async (t) => {
  await t.test('1. Canonical Category Ontology maps diverse marketplace CIDs into 6 canonical bins', () => {
    assert.equal(mapMarketCategoryToCanonical(2, 'Drugs'), 'Drugs');
    assert.equal(mapMarketCategoryToCanonical(19, 'Weed'), 'Drugs');
    assert.equal(mapMarketCategoryToCanonical(29, 'MDMA'), 'Drugs');
    assert.equal(mapMarketCategoryToCanonical(99, 'Carding & Fullz'), 'Fraud_Financial');
    assert.equal(mapMarketCategoryToCanonical(100, 'Bulletproof Hosting'), 'Services_Escrow');
    assert.equal(mapMarketCategoryToCanonical(3, 'Guides & Tutorials'), 'Digital_Goods');
    assert.equal(mapMarketCategoryToCanonical(101, 'PGP & Encryption Tools'), 'Security_PGP');
    assert.equal(mapMarketCategoryToCanonical(500, 'Miscellaneous'), 'General_Other');

    assert.equal(CANONICAL_CATEGORIES.length, 6);
  });

  await t.test('2. Cross-Subsystem Feature Availability Mask correctly marks x5 and x6 as UNAVAILABLE', () => {
    const forumProf: BehaviorProfileData = {
      entityId: 'forum_user_2', entityName: 'Kimble', entityType: 'USER', status: 'VALID_PROFILE',
      profileVersion: '1.0.0-behavior', generatedAt: new Date().toISOString(),
      activityHours24: new Array(24).fill(1 / 24),
      interEventStats: { meanHours: 12, stdHours: 2, medianHours: 12, minHours: 1, maxHours: 24, p25Hours: 6, p75Hours: 18, p95Hours: 22, logNormalMu: 2.4, logNormalSigma: 0.3, intervalsCount: 10 },
      cadence: { totalEvents: 50, activeDaysCount: 10, activeWeeksCount: 4, eventsPerActiveWeek: 12.5, activeDaysPerActiveWeek: 2.5, inactivityGapMaxDays: 3, inactivityGapMeanDays: 1.2 },
      categoryDistribution: { Drugs: 0.8, Security_PGP: 0.2 }, primaryCategory: 'Drugs',
      reputation: { approvalRating: 100, positiveFeedback: 50, neutralFeedback: 0, negativeFeedback: 0, sales: 0, pgpPresent: true },
      graph: { degree: 5, weightedDegree: 50, counterparties: ['thread_10', 'thread_12'] },
      provenance: { datasetId: 'evolution-2014-2015', datasetVersion: '1.0.0', sourceFiles: ['forum/post.tsv'], matchedSourceRows: 50 },
    };

    const vendorProf: BehaviorProfileData = {
      entityId: 'evo_vendor_5', entityName: 'Kimble', entityType: 'VENDOR', status: 'VALID_PROFILE',
      profileVersion: '1.0.0-behavior', generatedAt: new Date().toISOString(),
      activityHours24: new Array(24).fill(1 / 24),
      interEventStats: { meanHours: 14, stdHours: 3, medianHours: 14, minHours: 2, maxHours: 30, p25Hours: 8, p75Hours: 20, p95Hours: 25, logNormalMu: 2.6, logNormalSigma: 0.4, intervalsCount: 20 },
      cadence: { totalEvents: 100, activeDaysCount: 12, activeWeeksCount: 4, eventsPerActiveWeek: 25, activeDaysPerActiveWeek: 3, inactivityGapMaxDays: 4, inactivityGapMeanDays: 1.5 },
      categoryDistribution: { Drugs: 0.9, General_Other: 0.1 }, primaryCategory: 'Drugs',
      reputation: { approvalRating: 100, positiveFeedback: 100, neutralFeedback: 0, negativeFeedback: 0, sales: 100, pgpPresent: true },
      graph: { degree: 3, weightedDegree: 3, counterparties: ['vid_1', 'vid_10'] },
      provenance: { datasetId: 'evolution-2014-2015', datasetVersion: '1.0.0', sourceFiles: ['market/vendors.tsv'], matchedSourceRows: 100 },
    };

    const result = extractAttributionFeaturesWithMask(forumProf, vendorProf);
    assert.deepEqual(result.featureMask, [true, true, true, true, false, false]);
    assert.equal(result.features[4], 0.0, 'x5 graph_jaccard must be 0 when masked');
    assert.equal(result.features[5], 0.0, 'x6 graph_adamic_adar must be 0 when masked');
    assert.equal(result.activeFeatures.length, 4);
  });

  await t.test('3. No synthetic constants in attribution pair generator', async () => {
    const generator = new AttributionPairGenerator();
    const { pairs } = await generator.generatePairsDataset(5);
    for (const p of pairs) {
      assert.ok(p.featureMask, 'Must have featureMask');
      assert.deepEqual(p.featureMask, [true, true, true, true, false, false]);
      assert.notEqual(p.entityA.id, p.entityB.id);
      assert.ok(p.features.every((v) => typeof v === 'number' && !isNaN(v) && v >= 0 && v <= 1));
    }
  });
});
