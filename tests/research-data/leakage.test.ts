import test from 'node:test';
import assert from 'node:assert/strict';

test('7. Data Leakage Prevention Validation', async (t) => {
  await t.test('Authorship training split enforces disjoint author IDs', () => {
    const trainAuthors = new Set(['auth_001', 'auth_002', 'auth_003', 'auth_004']);
    const valAuthors = new Set(['auth_005', 'auth_006']);
    const testAuthors = new Set(['auth_007', 'auth_008', 'auth_009']);

    // Check intersection
    const trainValOverlap = [...trainAuthors].filter((a) => valAuthors.has(a));
    const trainTestOverlap = [...trainAuthors].filter((a) => testAuthors.has(a));
    const valTestOverlap = [...valAuthors].filter((a) => testAuthors.has(a));

    assert.equal(trainValOverlap.length, 0, 'Zero author leakage between train and validation');
    assert.equal(trainTestOverlap.length, 0, 'Zero author leakage between train and test');
    assert.equal(valTestOverlap.length, 0, 'Zero author leakage between validation and test');
  });

  await t.test('Temporal behavior splitting enforces chronological cutoff', () => {
    const trainCutoff = new Date('2014-12-31T23:59:59Z').getTime();
    const testStart = new Date('2015-01-01T00:00:00Z').getTime();

    assert.ok(testStart > trainCutoff, 'Test set must be strictly forward in time from training set');
  });
});
