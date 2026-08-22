import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('5. Research Data Normalization Pipelines', async (t) => {
  const baseDir = path.resolve('research-data');

  await t.test('Evolution listing normalizes into canonical research format', () => {
    const fixturePath = path.join(baseDir, 'evolution', 'fixtures', 'sample-listings.json');
    const rawListings = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    const normalized = rawListings.map((l: any) => ({
      researchId: `res_evo_${l.item_id}`,
      vendor: l.vendor_name,
      priceBtc: l.price_btc,
      observedTimestamp: l.timestamp,
      isCleaned: true,
    }));

    assert.equal(normalized.length, 3);
    assert.equal(normalized[0].researchId, 'res_evo_evo_item_1042');
    assert.equal(normalized[0].vendor, 'DarkPhoenix');
  });

  await t.test('VeriDark pairs normalize into paired training examples', () => {
    const fixturePath = path.join(baseDir, 'veridark', 'fixtures', 'sample-authorship-pairs.json');
    const pairs = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    const normalized = pairs.map((p: any) => ({
      pairId: p.pair_id,
      label: p.same_author ? 1 : 0,
      lengthA: p.text_sample_a.length,
      lengthB: p.text_sample_b.length,
    }));

    assert.equal(normalized.length, 3);
    assert.equal(normalized[0].label, 1);
    assert.equal(normalized[1].label, 0);
  });
});
