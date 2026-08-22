import test from 'node:test';
import assert from 'node:assert/strict';
import { EvolutionBehaviorProfiler } from '../../src/behavior/profiler.js';

test('5. Category Profile Vector Normalization', async (t) => {
  const profiler = new EvolutionBehaviorProfiler();

  await t.test('Category distribution sums to 1.0', async () => {
    const profile = await profiler.profileVendor('363');
    const catMap = profile.categoryDistribution;
    const sum = Object.values(catMap).reduce((a, b) => a + b, 0);

    assert.ok(Math.abs(sum - 1.0) < 0.001, `Category distribution must sum to 1.0 (got ${sum})`);
    assert.ok(profile.primaryCategory.length > 0);
  });
});
