import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('9. Synthetic Calibration Distributions', async (t) => {
  const baseDir = path.resolve('research-data/calibration');

  await t.test('Marketplace calibration parameters exist and are valid', () => {
    const filePath = path.join(baseDir, 'marketplace-calibration.json');
    assert.ok(fs.existsSync(filePath), 'marketplace-calibration.json must exist');

    const cal = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    assert.equal(cal.datasetId, 'evolution-2014-2015');
    assert.equal(cal.distributions.activityHoursUtc24.length, 24);

    const sumProb = cal.distributions.activityHoursUtc24.reduce((a: number, b: number) => a + b, 0);
    assert.ok(Math.abs(sumProb - 1.0) < 0.05, '24-hour activity distribution must sum to ~1.0');
  });

  await t.test('Stylometry calibration parameters exist and are valid', () => {
    const filePath = path.join(baseDir, 'stylometry-calibration.json');
    assert.ok(fs.existsSync(filePath), 'stylometry-calibration.json must exist');

    const cal = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    assert.equal(cal.datasetId, 'veridark-authorship');
    assert.ok(cal.distributions.wordsPerPost.mean > 0);
  });

  await t.test('Network telemetry calibration parameters exist and are valid', () => {
    const filePath = path.join(baseDir, 'network-scan-calibration.json');
    assert.ok(fs.existsSync(filePath), 'network-scan-calibration.json must exist');

    const cal = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    assert.equal(cal.datasetId, 'nict-darknet-2022');
    assert.ok(cal.distributions.targetedPortDistribution['443'] > 0);
  });
});
