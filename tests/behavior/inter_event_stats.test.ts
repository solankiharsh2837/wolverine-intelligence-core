import test from 'node:test';
import assert from 'node:assert/strict';
import { computeInterEventStats } from '../../src/behavior/extractor.js';

test('3. Inter-Event Intervals & Temporal Statistics', async (t) => {
  await t.test('Computes mean, std, median, min, max, and percentiles', () => {
    const timestamps = [
      new Date('2014-01-01T00:00:00Z'),
      new Date('2014-01-01T02:00:00Z'), // delta = 2h
      new Date('2014-01-01T06:00:00Z'), // delta = 4h
      new Date('2014-01-01T12:00:00Z'), // delta = 6h
      new Date('2014-01-01T20:00:00Z'), // delta = 8h
    ];

    const stats = computeInterEventStats(timestamps);
    assert.equal(stats.intervalsCount, 4);
    assert.equal(stats.minHours, 2);
    assert.equal(stats.maxHours, 8);
    assert.equal(stats.meanHours, 5); // (2+4+6+8)/4 = 5
    assert.equal(stats.medianHours, 6);
    assert.ok(stats.stdHours > 0);
    assert.ok(stats.logNormalMu > 0);
  });

  await t.test('Handles single event gracefully without dividing by zero', () => {
    const stats = computeInterEventStats([new Date()]);
    assert.equal(stats.intervalsCount, 0);
    assert.equal(stats.meanHours, 0);
    assert.equal(stats.stdHours, 0);
  });
});
