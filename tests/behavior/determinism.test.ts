import test from 'node:test';
import assert from 'node:assert/strict';
import { EvolutionBehaviorProfiler } from '../../src/behavior/profiler.js';

test('11. Deterministic Repeatability', async (t) => {
  const profiler = new EvolutionBehaviorProfiler();

  await t.test('Profiling the same vendor twice produces identical output', async () => {
    const run1 = await profiler.profileVendor('Verto');
    const run2 = await profiler.profileVendor('Verto');

    assert.deepEqual(run1.activityHours24, run2.activityHours24);
    assert.deepEqual(run1.interEventStats, run2.interEventStats);
    assert.deepEqual(run1.cadence, run2.cadence);
    assert.deepEqual(run1.categoryDistribution, run2.categoryDistribution);
    assert.equal(run1.status, run2.status);
  });
});
