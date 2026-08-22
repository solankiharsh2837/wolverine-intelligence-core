import test from 'node:test';
import assert from 'node:assert/strict';
import { EvolutionBehaviorProfiler } from '../../src/behavior/profiler.js';

test('1. Behavior Profile Features & Taxonomy', async (t) => {
  const profiler = new EvolutionBehaviorProfiler();

  await t.test('Extracts complete 10-feature behavioral profile for active vendor', async () => {
    const profile = await profiler.profileVendor('Verto');
    assert.equal(profile.entityType, 'VENDOR');
    assert.equal(profile.profileVersion, '1.0.0-behavior');
    assert.equal(profile.status, 'VALID_PROFILE');

    // 1. Activity Hours (24 bins)
    assert.equal(profile.activityHours24.length, 24);
    // 2. Inter-Event Stats
    assert.ok(profile.interEventStats.meanHours >= 0);
    assert.ok(profile.interEventStats.stdHours >= 0);
    // 3. Cadence
    assert.ok(profile.cadence.totalEvents >= 5);
    assert.ok(profile.cadence.activeDaysCount >= 2);
    assert.ok(profile.cadence.eventsPerActiveWeek > 0);
    // 4. Categories
    assert.ok(profile.primaryCategory);
    // 5. Graph
    assert.ok(profile.graph.degree >= 0);
    // 6. Provenance
    assert.equal(profile.provenance.datasetId, 'evolution-2014-2015');
    assert.ok(profile.provenance.matchedSourceRows > 0);
  });
});
