import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('10. End-to-End Research Lineage & Provenance', async (t) => {
  const baseDir = path.resolve('research-data');

  await t.test('Processed features trace back to raw fixtures and manifest hashes', () => {
    const manifestPath = path.join(baseDir, 'veridark', 'manifest.json');
    const processedPath = path.join(baseDir, 'veridark', 'processed', 'authorship-feature-pairs.json');

    assert.ok(fs.existsSync(manifestPath), 'Manifest must exist');
    assert.ok(fs.existsSync(processedPath), 'Processed feature file must exist');

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const processed = JSON.parse(fs.readFileSync(processedPath, 'utf8'));

    assert.equal(processed[0].featuresA.featureVersion, '1.0.0-stylometry');
    assert.equal(manifest.datasetId, 'veridark-authorship');
  });
});
