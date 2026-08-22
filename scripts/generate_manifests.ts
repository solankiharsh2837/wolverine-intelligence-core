import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function computeSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

const baseDir = path.resolve('research-data');
const datasets = ['evolution', 'veridark', 'nict-darknet-2022', 'darknet-surfing'];

for (const ds of datasets) {
  const dsDir = path.join(baseDir, ds);
  const metadataPath = path.join(dsDir, 'metadata.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  const files: any[] = [];

  // Check raw folder
  const rawDir = path.join(dsDir, 'raw');
  if (fs.existsSync(rawDir)) {
    const rawFiles = fs.readdirSync(rawDir).filter(f => !f.startsWith('.'));
    for (const f of rawFiles) {
      const fullPath = path.join(rawDir, f);
      const stat = fs.statSync(fullPath);
      const hash = computeSha256(fullPath);
      files.push({
        filename: f,
        fileType: "RAW_ARCHIVE",
        relativePath: `raw/${f}`,
        sizeBytes: stat.size,
        sha256: `sha256-${hash}`,
        mimeType: f.endsWith('.zip') ? 'application/zip' : 'application/octet-stream',
        retrievedAt: stat.mtime.toISOString(),
        sourceUrl: metadata.downloadUrl || metadata.sourceUrl,
        verified: true
      });
    }
  }

  // Check fixtures folder
  const fixturesDir = path.join(dsDir, 'fixtures');
  if (fs.existsSync(fixturesDir)) {
    const fixFiles = fs.readdirSync(fixturesDir).filter(f => f.endsWith('.json'));
    for (const f of fixFiles) {
      const fullPath = path.join(fixturesDir, f);
      const stat = fs.statSync(fullPath);
      const hash = computeSha256(fullPath);
      const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const fixtureType = Array.isArray(content) && content[0]?.fixture_type ? content[0].fixture_type : "SYNTHETIC_TEST_FIXTURE";

      files.push({
        filename: f,
        fileType: fixtureType,
        relativePath: `fixtures/${f}`,
        sizeBytes: stat.size,
        sha256: `sha256-${hash}`,
        mimeType: 'application/json',
        retrievedAt: stat.mtime.toISOString(),
        sourceUrl: metadata.sourceUrl,
        verified: true
      });
    }
  }

  const manifest = {
    datasetId: metadata.datasetId,
    datasetVersion: metadata.version || '1.0.0',
    status: metadata.status,
    manifestVersion: '2.0.0',
    generatedAt: new Date().toISOString(),
    files,
    parserVersion: '2.0.0',
    profileVersion: '2.0.0'
  };

  const manifestPath = path.join(dsDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`Generated manifest for ${ds} (${metadata.status}): ${files.length} tracked items`);
}
