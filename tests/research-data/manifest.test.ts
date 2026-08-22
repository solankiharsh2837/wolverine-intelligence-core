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
});
