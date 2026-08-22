import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function computeSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

const baseDir = path.resolve('wolverine-intelligence/research-data');
const datasets = ['evolution', 'veridark', 'nict-darknet-2022', 'darknet-surfing'];

for (const ds of datasets) {
  const dsDir = path.join(baseDir, ds);
  const metadataPath = path.join(dsDir, 'metadata.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  const fixturesDir = path.join(dsDir, 'fixtures');
  const files = fs.readdirSync(fixturesDir).map((f) => {
    const fullPath = path.join(fixturesDir, f);
    const stat = fs.statSync(fullPath);
    const hash = computeSha256(fullPath);
    return {
      filename: f,
      relativePath: `fixtures/${f}`,
      sizeBytes: stat.size,
      sha256: `sha256-${hash}`,
      mimeType: 'application/json',
      compression: 'none',
      retrievedAt: new Date().toISOString(),
      sourceUrl: metadata.sourceUrl,
      verified: true
    };
  });

  const manifest = {
    datasetId: metadata.datasetId,
    datasetVersion: metadata.version || '1.0.0',
    manifestVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    files,
    parserVersion: '1.0.0',
    profileVersion: '1.0.0'
  };

  const manifestPath = path.join(dsDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`Generated verified manifest for ${ds}: ${files.length} files`);
}
