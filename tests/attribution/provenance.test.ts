import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('10. Attribution Provenance & Dataset Traceability', async (t) => {
  await t.test('Ground truth pairs trace back to Evolution user-matching.tsv', () => {
    const pairsPath = path.resolve('models/attribution/labeled-pairs.json');
    assert.ok(fs.existsSync(pairsPath), 'labeled-pairs.json must exist');

    const pairs = JSON.parse(fs.readFileSync(pairsPath, 'utf8'));
    for (const p of pairs) {
      assert.equal(p.datasetId, 'evolution-2014-2015');
      assert.ok(p.provenance.sourceFiles.includes('forum-market/user-matching.tsv'));
      assert.ok(typeof p.provenance.matchId === 'number');
    }
  });
});
