import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function computeSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

const baseDir = path.resolve('research-data');
const targetDataset = process.argv[2]; // optional filter

const datasets = targetDataset ? [targetDataset] : ['evolution', 'veridark', 'nict-darknet-2022', 'darknet-surfing'];

console.log('============================================================');
console.log('WOLVERINE INTELLIGENCE — DATASET HASH & MANIFEST VERIFIER');
console.log('============================================================\n');

let allPassed = true;

for (const ds of datasets) {
  const dsDir = path.join(baseDir, ds);
  const manifestPath = path.join(dsDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.warn(`[WARN] No manifest found for dataset: ${ds}`);
    continue;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`--- Verifying ${manifest.datasetId} (v${manifest.datasetVersion}) ---`);

  for (const file of manifest.files) {
    const fullPath = path.join(dsDir, file.relativePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`  ✖ File missing: ${file.relativePath}`);
      allPassed = false;
      continue;
    }

    const actualHash = `sha256-${computeSha256(fullPath)}`;
    const stat = fs.statSync(fullPath);

    if (actualHash === file.sha256 && stat.size === file.sizeBytes) {
      console.log(`  ✔ [MATCH] ${file.filename} (${file.sizeBytes} bytes) -> ${actualHash}`);
    } else {
      console.error(`  ✖ [MISMATCH] ${file.filename}: Expected ${file.sha256}, Got ${actualHash}`);
      allPassed = false;
    }
  }
  console.log('');
}

if (!allPassed) {
  console.error('VERIFICATION FAILED: One or more file checksums do not match manifest.');
  process.exit(1);
} else {
  console.log('============================================================');
  console.log('VERIFICATION COMPLETE: 100% of tracked research files verified.');
  console.log('============================================================');
}
