import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCadenceStats } from '../../src/behavior/extractor.js';

test('4. Active Weeks & Cadence Calculations', async (t) => {
  await t.test('Computes events per active week and active days per active week', () => {
    const timestamps = [
      new Date('2014-01-05T12:00:00Z'), // Week 1, Day 1
      new Date('2014-01-06T14:00:00Z'), // Week 2, Day 1
      new Date('2014-01-07T16:00:00Z'), // Week 2, Day 2
      new Date('2014-01-08T18:00:00Z'), // Week 2, Day 3
      new Date('2014-01-20T10:00:00Z'), // Week 4, Day 1
    ];

    const cadence = computeCadenceStats(timestamps);
    assert.equal(cadence.totalEvents, 5);
    assert.equal(cadence.activeDaysCount, 5);
    assert.equal(cadence.activeWeeksCount, 3);
    assert.equal(cadence.eventsPerActiveWeek, parseFloat((5 / 3).toFixed(2)));
    assert.ok(cadence.inactivityGapMaxDays >= 10, 'Should measure inactive period gap');
  });
});
