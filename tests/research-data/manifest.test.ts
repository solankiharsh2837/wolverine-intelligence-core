import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('2. Manifest Structure & Tracking', async (t) => {
  const baseDir = path.resolve('research-data');
  const datasets = ['evolution', 'veridark', 'nict-darknet-2022', 'darknet-surfing'];

  for (const ds of datasets) {
    await t.test(`Manifest exists and validates for ${ds}`, () => {
      const manifestPath = path.join(baseDir, ds, 'manifest.json');
      assert.ok(fs.existsSync(manifestPath), `manifest.json must exist for ${ds}`);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      assert.ok(manifest.datasetId, 'Manifest must have datasetId');
      assert.ok(manifest.datasetVersion, 'Manifest must have datasetVersion');
      assert.ok(Array.isArray(manifest.files), 'Manifest must contain files array');
      assert.ok(manifest.files.length > 0, `Manifest must track at least 1 file for ${ds}`);

      for (const f of manifest.files) {
        assert.ok(f.filename, 'Tracked file must have filename');
        assert.ok(f.sizeBytes > 0, 'Tracked file size must be > 0');
        assert.ok(f.sha256.startsWith('sha256-'), 'Tracked file must have sha256 prefix');
        assert.equal(f.verified, true, 'File must be marked verified');
      }
    });
  }

  await t.test('Evolution manifest tracks actual raw archive and its SHA-256', () => {
    const manifestPath = path.join(baseDir, 'evolution', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const rawEntry = manifest.files.find((f: any) => f.fileType === 'RAW_ARCHIVE');

    assert.ok(rawEntry, 'Evolution manifest must track RAW_ARCHIVE');
    assert.equal(rawEntry.filename, 'evolution_zenodo_10156522.zip');
    assert.equal(rawEntry.sizeBytes, 300565000);
    assert.equal(rawEntry.sha256, 'sha256-70d6cacc6a04792213b6ff3d1586be248bc26e9b31d796a6b443e9e177ccc42a');
  });
});
