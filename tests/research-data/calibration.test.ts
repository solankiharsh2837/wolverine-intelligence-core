import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('9. Synthetic Calibration & Real Distribution Computation', async (t) => {
  const baseDir = path.resolve('research-data/calibration');

  await t.test('Evolution marketplace calibration is computed from real source listings', () => {
    const filePath = path.join(baseDir, 'marketplace-calibration.json');
    assert.ok(fs.existsSync(filePath), 'marketplace-calibration.json must exist');

    const cal = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    assert.equal(cal.calibrationType, 'MARKETPLACE_REAL_DATA_DISTRIBUTION');
    assert.equal(cal.datasetId, 'evolution-2014-2015');
    assert.equal(cal.sourceFile, 'market/listings.tsv');
    assert.ok(cal.sourceFileSha256.startsWith('sha256-'));
    assert.ok(cal.sampleSize >= 40000, 'Must sample real listing records for calibration');
    assert.ok(cal.distributions.priceBtc.mean > 0);
    assert.ok(cal.distributions.priceBtc.median > 0);
  });

  await t.test('Restricted datasets truthfully mark calibration as unavailable without fabrication', () => {
    const stylometryCalPath = path.join(baseDir, 'stylometry-calibration.json');
    const netCalPath = path.join(baseDir, 'network-scan-calibration.json');

    const styCal = JSON.parse(fs.readFileSync(stylometryCalPath, 'utf8'));
    assert.equal(styCal.status, 'CALIBRATION_UNAVAILABLE_RESTRICTED_DATASET');

    const netCal = JSON.parse(fs.readFileSync(netCalPath, 'utf8'));
    assert.equal(netCal.status, 'CALIBRATION_UNAVAILABLE_RESTRICTED_DATASET');
  });
});
