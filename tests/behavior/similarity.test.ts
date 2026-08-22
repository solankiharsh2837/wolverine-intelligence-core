import test from 'node:test';
import assert from 'node:assert/strict';
import {
  jensenShannonDivergence,
  jensenShannonSimilarity,
  cosineSimilarityMap,
  logRatioSimilarity,
  ratioSimilarity,
} from '../../src/behavior/similarity.js';

test('7. Mathematical Properties of Similarity Functions', async (t) => {
  await t.test('Identity: S(A, A) === 1.0', () => {
    const p = [0.1, 0.2, 0.3, 0.4];
    assert.equal(jensenShannonDivergence(p, p), 0.0);
    assert.equal(jensenShannonSimilarity(p, p), 1.0);

    const cat = { 'Drugs': 0.8, 'Digital': 0.2 };
    assert.equal(cosineSimilarityMap(cat, cat), 1.0);

    assert.equal(logRatioSimilarity(24.5, 24.5), 1.0);
    assert.equal(ratioSimilarity(10, 10), 1.0);
  });

  await t.test('Symmetry: S(A, B) === S(B, A)', () => {
    const p = [0.4, 0.3, 0.2, 0.1];
    const q = [0.1, 0.2, 0.3, 0.4];
    assert.equal(jensenShannonSimilarity(p, q), jensenShannonSimilarity(q, p));

    const catA = { 'Drugs': 0.7, 'Services': 0.3 };
    const catB = { 'Drugs': 0.2, 'Digital': 0.8 };
    assert.equal(cosineSimilarityMap(catA, catB), cosineSimilarityMap(catB, catA));

    assert.equal(logRatioSimilarity(10, 50), logRatioSimilarity(50, 10));
    assert.equal(ratioSimilarity(5, 20), ratioSimilarity(20, 5));
  });

  await t.test('Boundedness: S(A, B) in [0.0, 1.0]', () => {
    const p = [1, 0, 0, 0];
    const q = [0, 0, 0, 1];
    const sim = jensenShannonSimilarity(p, q);
    assert.ok(sim >= 0.0 && sim <= 1.0);

    const cos = cosineSimilarityMap({ 'A': 1 }, { 'B': 1 });
    assert.equal(cos, 0.0);
  });
});
