import test from 'node:test';
import assert from 'node:assert/strict';
import { EvolutionBehaviorProfiler } from '../../src/behavior/profiler.js';

test('10. Provenance Traceability from Source Files', async (t) => {
  const profiler = new EvolutionBehaviorProfiler();

  await t.test('Behavior profile records exact source files and row counts', async () => {
    const profile = await profiler.profileVendor('Verto');
    assert.equal(profile.provenance.datasetId, 'evolution-2014-2015');
    assert.ok(profile.provenance.sourceFiles.includes('market/vendors.tsv'));
    assert.ok(profile.provenance.sourceFiles.includes('market/listings.tsv'));
    assert.ok(profile.provenance.matchedSourceRows > 0);
  });
});
