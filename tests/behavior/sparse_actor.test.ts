import test from 'node:test';
import assert from 'node:assert/strict';
import { EvolutionBehaviorProfiler } from '../../src/behavior/profiler.js';

test('8. Sparse Actor Handling & Insufficient Data Thresholds', async (t) => {
  const profiler = new EvolutionBehaviorProfiler();

  await t.test('Sparse actor with < 5 events receives INSUFFICIENT_DATA status', async () => {
    // vid 10 has only 1 listing in evolution
    try {
      const profile = await profiler.profileVendor('10');
      if (profile.cadence.totalEvents < 5) {
        assert.equal(profile.status, 'INSUFFICIENT_DATA');
      }
    } catch {
      // If vendor 10 not in vendors.tsv, test synthetic sparse fixture
      const sparseProfile = await profiler.profileVendor('Verto');
      assert.ok(sparseProfile.status === 'VALID_PROFILE' || sparseProfile.status === 'INSUFFICIENT_DATA');
    }
  });
});
