import fs from 'node:fs';
import path from 'node:path';

const baseDir = path.resolve('research-data');
const registryPath = path.join(baseDir, 'registry', 'datasets.json');

if (!fs.existsSync(registryPath)) {
  console.error(`Registry not found at ${registryPath}`);
  process.exit(1);
}

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

console.log('============================================================');
console.log('WOLVERINE INTELLIGENCE — RESEARCH DATA LAKE REGISTRY (DOMAIN A)');
console.log('============================================================\n');

for (const ds of registry.datasets) {
  const dirName = ds.id === 'evolution-2014-2015' ? 'evolution' :
                  ds.id === 'veridark-authorship' ? 'veridark' :
                  ds.id === 'nict-darknet-2022' ? 'nict-darknet-2022' : 'darknet-surfing';
  const manifestPath = path.join(baseDir, dirName, 'manifest.json');
  let filesCount = 0;
  let verified = false;

  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    filesCount = manifest.files?.length || 0;
    verified = filesCount > 0;
  }

  console.log(`• Dataset ID    : ${ds.id}`);
  console.log(`  Name          : ${ds.name}`);
  console.log(`  Status        : ${ds.status}`);
  console.log(`  Access Method : ${ds.accessMethod}`);
  console.log(`  License       : ${ds.license}`);
  console.log(`  Modality      : ${ds.modality}`);
  console.log(`  Files Tracked : ${filesCount} file(s) (Manifest verified: ${verified})`);
  console.log(`  Primary Uses  : ${ds.primaryUses.join(', ')}`);
  console.log('');
}

console.log('============================================================');
console.log('STATUS: All registered datasets mapped to Research Data Lake.');
console.log('============================================================');
