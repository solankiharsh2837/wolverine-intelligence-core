import fs from 'node:fs';
import path from 'node:path';

function main() {
  const modelDir = path.resolve('models/behavior');
  const manifestPath = path.join(modelDir, 'manifest.json');
  const benchPath = path.join(modelDir, 'benchmark-report.json');

  console.log('============================================================');
  console.log('WOLVERINE INTELLIGENCE — BEHAVIOR MODEL STATUS');
  console.log('============================================================\n');

  console.log('• Model ID       : wolverine-behavior-profiler');
  console.log('• Version Tag    : 1.0.0-behavior');
  console.log('• Modality       : Temporal, Cadence, Category, and Graph Rhythms');
  console.log('• Source Dataset : Evolution Marketplace (Zenodo 10156522)');
  console.log('• Status         : ACTIVE_DESCRIPTIVE_BASELINE');
  console.log('• Manifest Exist : ' + fs.existsSync(manifestPath));
  console.log('• Benchmark Exist: ' + fs.existsSync(benchPath));
  console.log('');
  console.log('Available Commands:');
  console.log('  npm run behavior:profile -- <actor>');
  console.log('  npm run behavior:compare -- <actorA> <actorB>');
  console.log('  npm run behavior:benchmark');
  console.log('  npm run behavior:status');
  console.log('============================================================');
}

main();
