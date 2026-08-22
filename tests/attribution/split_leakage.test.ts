import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { AttributionPair } from '../../src/attribution/types.js';

test('2. Split Isolation & Data Leakage Prevention', async (t) => {
  await t.test('Enforces strictly disjoint clusters with zero pair or mirror leakage across splits', () => {
    const pairsPath = path.resolve('models/attribution/labeled-pairs.json');
    assert.ok(fs.existsSync(pairsPath), 'labeled-pairs.json must exist');

    const pairs: AttributionPair[] = JSON.parse(fs.readFileSync(pairsPath, 'utf8'));

    const trainClusters = new Set<number>();
    const valClusters = new Set<number>();
    const testClusters = new Set<number>();

    const trainPairs = new Set<string>();
    const valPairs = new Set<string>();
    const testPairs = new Set<string>();

    for (const p of pairs) {
      const matchId = p.provenance.matchId!;
      const key1 = `${p.entityA.id}:::${p.entityB.id}`;
      const key2 = `${p.entityB.id}:::${p.entityA.id}`;

      if (p.split === 'TRAIN') {
        trainClusters.add(matchId);
        trainPairs.add(key1);
        trainPairs.add(key2);
      } else if (p.split === 'VALIDATION') {
        valClusters.add(matchId);
        valPairs.add(key1);
        valPairs.add(key2);
      } else if (p.split === 'TEST') {
        testClusters.add(matchId);
        testPairs.add(key1);
        testPairs.add(key2);
      }
    }

    // Cluster disjointness check
    for (const c of trainClusters) {
      assert.equal(valClusters.has(c), false, `Cluster ${c} in TRAIN must not be in VAL`);
      assert.equal(testClusters.has(c), false, `Cluster ${c} in TRAIN must not be in TEST`);
    }
    for (const c of valClusters) {
      assert.equal(testClusters.has(c), false, `Cluster ${c} in VAL must not be in TEST`);
    }

    // Pair and mirror isolation check
    for (const k of trainPairs) {
      assert.equal(valPairs.has(k), false, 'Train pair must not exist in Validation');
      assert.equal(testPairs.has(k), false, 'Train pair must not exist in Test');
    }
    for (const k of valPairs) {
      assert.equal(testPairs.has(k), false, 'Validation pair must not exist in Test');
    }
  });
});
