import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

function computeSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

const rawZip = path.resolve('research-data/evolution/raw/evolution_zenodo_10156522.zip');
const extractedDir = path.resolve('research-data/evolution/extracted');

if (!fs.existsSync(rawZip)) {
  console.error('Raw zip does not exist yet at:', rawZip);
  process.exit(1);
}

const rawHash = computeSha256(rawZip);
const rawStat = fs.statSync(rawZip);
console.log('============================================================');
console.log('REAL DATASET ACQUIRED: Evolution Darknet Market (Zenodo 10156522)');
console.log(`• Raw Archive Size : ${rawStat.size} bytes`);
console.log(`• SHA-256 Checksum : sha256-${rawHash}`);
console.log('============================================================\n');

// Extract zip using PowerShell Expand-Archive
console.log('[1/4] Extracting raw archive...');
if (!fs.existsSync(extractedDir)) {
  fs.mkdirSync(extractedDir, { recursive: true });
}
execSync(`powershell -Command "Expand-Archive -Path '${rawZip}' -DestinationPath '${extractedDir}' -Force"`);

const extractedFiles = fs.readdirSync(extractedDir);
console.log(`[2/4] Extracted ${extractedFiles.length} files/directories:`, extractedFiles);

// Find CSV/tables in extracted
let targetCsv = '';
function findCsv(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(findCsv(full));
    } else if (item.endsWith('.csv') || item.endsWith('.tsv') || item.endsWith('.txt')) {
      results.push(full);
    }
  }
  return results;
}

const allDataFiles = findCsv(extractedDir);
console.log(`[3/4] Found ${allDataFiles.length} data files:`, allDataFiles.map(f => path.relative(extractedDir, f)));

// Let's inspect the files and extract real-derived sample fixtures with exact row provenance
console.log('[4/4] Generating REAL_DATASET_DERIVED_FIXTURE with actual provenance...');

// Let's read first data file (e.g. listings, feedback, or network)
for (const dataFile of allDataFiles) {
  const relPath = path.relative(extractedDir, dataFile);
  const hash = computeSha256(dataFile);
  const stat = fs.statSync(dataFile);
  console.log(`  • File: ${relPath} (${stat.size} bytes, sha256-${hash})`);
}

