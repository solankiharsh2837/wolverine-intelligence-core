import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('10. Provenance Auditing: Real vs Synthetic Fixtures', async (t) => {
  const baseDir = path.resolve('research-data');

  await t.test('Evolution fixtures are strictly REAL_DATASET_DERIVED_FIXTURE with valid source provenance', () => {
    const listingsPath = path.join(baseDir, 'evolution', 'fixtures', 'sample-listings.json');
    const vendorsPath = path.join(baseDir, 'evolution', 'fixtures', 'sample-vendors.json');

    const listings = JSON.parse(fs.readFileSync(listingsPath, 'utf8'));
    const vendors = JSON.parse(fs.readFileSync(vendorsPath, 'utf8'));

    for (const item of listings) {
      assert.equal(item.fixture_type, 'REAL_DATASET_DERIVED_FIXTURE');
      assert.equal(item.sourceFile, 'market/listings.tsv');
      assert.ok(item.sourceFileSha256.startsWith('sha256-'), 'Must cite source file SHA-256');
      assert.ok(typeof item.sourceRow === 'number' && item.sourceRow > 0, 'Must cite source row index');
      assert.ok(item.lid > 0, 'Must contain real listing ID');
    }

    for (const item of vendors) {
      assert.equal(item.fixture_type, 'REAL_DATASET_DERIVED_FIXTURE');
      assert.equal(item.sourceFile, 'market/vendors.tsv');
      assert.ok(item.sourceFileSha256.startsWith('sha256-'));
      assert.ok(typeof item.sourceRow === 'number' && item.sourceRow > 0);
    }
  });

  await t.test('Restricted datasets (VeriDark, NICT, Surfing) are explicitly classified as SYNTHETIC_TEST_FIXTURE', () => {
    const vdPath = path.join(baseDir, 'veridark', 'fixtures', 'sample-authorship-pairs.json');
    const nictPath = path.join(baseDir, 'nict-darknet-2022', 'fixtures', 'sample-flow-telemetry.json');
    const surfPath = path.join(baseDir, 'darknet-surfing', 'fixtures', 'sample-crawl-graph.json');

    const vd = JSON.parse(fs.readFileSync(vdPath, 'utf8'));
    const nict = JSON.parse(fs.readFileSync(nictPath, 'utf8'));
    const surf = JSON.parse(fs.readFileSync(surfPath, 'utf8'));

    assert.equal(vd[0].fixture_type, 'SYNTHETIC_TEST_FIXTURE');
    assert.equal(nict[0].fixture_type, 'SYNTHETIC_TEST_FIXTURE');
    assert.equal(surf[0].fixture_type, 'SYNTHETIC_TEST_FIXTURE');
  });
});
