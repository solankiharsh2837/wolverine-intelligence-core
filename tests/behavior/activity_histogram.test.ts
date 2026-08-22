import test from 'node:test';
import assert from 'node:assert/strict';
import { computeActivityHoursHistogram } from '../../src/behavior/extractor.js';

test('2. Activity-Hour 24-Bin Normalized Distribution', async (t) => {
  await t.test('Histogram strictly normalizes to sum = 1.0', () => {
    const timestamps = [
      new Date('2014-01-15T02:30:00Z'),
      new Date('2014-01-15T02:45:00Z'),
      new Date('2014-01-16T14:10:00Z'),
      new Date('2014-01-17T18:00:00Z'),
      new Date('2014-01-18T18:30:00Z'),
      new Date('2014-01-19T23:15:00Z'),
    ];

    const hist = computeActivityHoursHistogram(timestamps);
    assert.equal(hist.length, 24, 'Must have exactly 24 bins');

    const sum = hist.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.0001, `Sum must equal 1.0 (got ${sum})`);
    assert.equal(hist[2], parseFloat((2 / 6).toFixed(4)));
    assert.equal(hist[18], parseFloat((2 / 6).toFixed(4)));
    assert.equal(hist[0], 0);
  });

  await t.test('All bin values are strictly non-negative probabilities', () => {
    const timestamps = [new Date('2014-05-10T12:00:00Z')];
    const hist = computeActivityHoursHistogram(timestamps);
    for (const bin of hist) {
      assert.ok(bin >= 0.0, 'Bin probability must be >= 0');
      assert.ok(bin <= 1.0, 'Bin probability must be <= 1');
    }
  });
});
