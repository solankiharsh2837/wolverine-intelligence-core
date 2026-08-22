import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function computeSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

test('3. SHA-256 Cryptographic Hash Verification', async (t) => {
  const baseDir = path.resolve('research-data');
  const datasets = ['evolution', 'veridark', 'nict-darknet-2022', 'darknet-surfing'];

  for (const ds of datasets) {
    await t.test(`All tracked files in ${ds} match manifest SHA-256 exactly`, () => {
      const dsDir = path.join(baseDir, ds);
      const manifestPath = path.join(dsDir, 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

      for (const file of manifest.files) {
        const fullPath = path.join(dsDir, file.relativePath);
        assert.ok(fs.existsSync(fullPath), `Tracked file must exist: ${file.relativePath}`);

        const actualHash = `sha256-${computeSha256(fullPath)}`;
        assert.equal(actualHash, file.sha256, `SHA-256 hash must match manifest for ${file.filename}`);

        const stat = fs.statSync(fullPath);
        assert.equal(stat.size, file.sizeBytes, `Byte size must match manifest for ${file.filename}`);
      }
    });
  }
});
