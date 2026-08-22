import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('4. Dataset Profiling & Quality Metrics', async (t) => {
  const baseDir = path.resolve('research-data');

  await t.test('Evolution listing profile metrics', () => {
    const reportPath = path.join(baseDir, 'evolution', 'reports', 'sample-listings.profile.json');
    assert.ok(fs.existsSync(reportPath), 'Evolution listing profile report must exist');

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    assert.equal(report.rowCount, 5, 'Should profile 5 real extracted listing records');
    assert.ok(report.fields.lid);
    assert.equal(report.fields.lid.nullRate, '0.0000');
    assert.ok(parseFloat(report.textMetrics.avgCharacters) > 0);
  });

  await t.test('VeriDark authorship profile metrics', () => {
    const reportPath = path.join(baseDir, 'veridark', 'reports', 'sample-authorship-pairs.profile.json');
    assert.ok(fs.existsSync(reportPath), 'VeriDark profile report must exist');

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    assert.equal(report.rowCount, 3);
    assert.ok(report.fields.same_author);
  });
});
