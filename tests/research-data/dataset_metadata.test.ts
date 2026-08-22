import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('1. Dataset Registry & Metadata Compliance', async (t) => {
  const baseDir = path.resolve('research-data');
  const registryPath = path.join(baseDir, 'registry', 'datasets.json');

  await t.test('Master dataset registry exists and parses cleanly', () => {
    assert.ok(fs.existsSync(registryPath), 'datasets.json must exist in registry/');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    assert.equal(registry.domain, 'RESEARCH_DATA_LAKE');
    assert.ok(Array.isArray(registry.datasets), 'registry must contain datasets array');
    assert.equal(registry.datasets.length, 4, 'Must register 4 authoritative datasets');
  });

  await t.test('Every dataset has individual metadata.json and README.md', () => {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    for (const ds of registry.datasets) {
      const dirName = ds.id === 'evolution-2014-2015' ? 'evolution' :
                      ds.id === 'veridark-authorship' ? 'veridark' :
                      ds.id === 'nict-darknet-2022' ? 'nict-darknet-2022' : 'darknet-surfing';
      const dsDir = path.join(baseDir, dirName);
      const metaPath = path.join(dsDir, 'metadata.json');
      const readmePath = path.join(dsDir, 'README.md');

      assert.ok(fs.existsSync(metaPath), `metadata.json must exist for ${ds.id}`);
      assert.ok(fs.existsSync(readmePath), `README.md must exist for ${ds.id}`);

      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      assert.equal(meta.datasetId, ds.id);
      assert.ok(meta.license, 'Dataset must have license specified');
      assert.ok(meta.status, 'Dataset must have authoritative status');
    }
  });
});
