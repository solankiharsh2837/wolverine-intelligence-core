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

  await t.test('Evolution dataset reflects acquired open Zenodo archive', () => {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    const evo = registry.datasets.find((d: any) => d.id === 'evolution-2014-2015');
    assert.ok(evo, 'Evolution dataset must exist');
    assert.equal(evo.status, 'ACQUIRED_RAW_ARCHIVE');
    assert.equal(evo.license, 'CC-BY-4.0');
    assert.ok(evo.officialSource.includes('Zenodo DOI: 10.5281/zenodo.10156522'));
  });

  await t.test('NICT dataset schema strictly matches official 2022 specification without invented fields', () => {
    const metaPath = path.join(baseDir, 'nict-darknet-2022', 'metadata.json');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

    assert.equal(meta.status, 'ACCESS_RESTRICTED');
    assert.equal(meta.rawStatus, 'UNAVAILABLE_NDA_RESTRICTED');

    const schemaKeys = Object.keys(meta.officialSchema);
    assert.deepEqual(schemaKeys, [
      'timestamp',
      'hash[ip.src.upper16]',
      'hash[ip.src.32]',
      'ip.dst.lower16',
      'tcp.dstport'
    ], 'NICT schema must contain exactly the 5 official fields');

    // Ensure NO invented fields exist
    assert.equal(schemaKeys.includes('protocol'), false, 'protocol must NOT be in NICT 2022 schema');
    assert.equal(schemaKeys.includes('packet_count'), false, 'packet_count must NOT be in NICT 2022 schema');
    assert.equal(schemaKeys.includes('byte_count'), false, 'byte_count must NOT be in NICT 2022 schema');
    assert.equal(schemaKeys.includes('scan_signature'), false, 'scan_signature must NOT be in NICT 2022 schema');
  });

  await t.test('VeriDark dataset reflects restricted Zenodo 6998371 status', () => {
    const metaPath = path.join(baseDir, 'veridark', 'metadata.json');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    assert.equal(meta.status, 'ACCESS_RESTRICTED');
    assert.equal(meta.rawStatus, 'UNAVAILABLE_RESTRICTED');
    assert.ok(meta.doi.includes('zenodo.6998371'));
  });
});
