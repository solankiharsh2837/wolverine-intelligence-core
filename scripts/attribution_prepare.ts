import fs from 'node:fs';
import path from 'node:path';
import { AttributionPairGenerator } from '../src/attribution/pair_generator.js';

async function main() {
  console.log('============================================================');
  console.log('WOLVERINE INTELLIGENCE — ATTRIBUTION PAIR PREPARATION');
  console.log('============================================================\n');

  try {
    const generator = new AttributionPairGenerator();
    console.log('[1/2] Loading ground-truth matches from forum-market/user-matching.tsv...');
    const pairs = await generator.generatePairsDataset(120);

    const trainCount = pairs.filter((p) => p.split === 'TRAIN').length;
    const valCount = pairs.filter((p) => p.split === 'VALIDATION').length;
    const testCount = pairs.filter((p) => p.split === 'TEST').length;
    const posCount = pairs.filter((p) => p.label === 'SAME_ACTOR').length;
    const hardNegCount = pairs.filter((p) => p.pairType === 'NEGATIVE_HARD_CATEGORY_OVERLAP').length;
    const rndNegCount = pairs.filter((p) => p.pairType === 'NEGATIVE_RANDOM').length;

    console.log(`[2/2] Generated ${pairs.length} canonical labeled pairs:`);
    console.log(`  • Positive Pairs (Ground-Truth Same Actor) : ${posCount}`);
    console.log(`  • Hard Negatives (Same Category Overlap)   : ${hardNegCount}`);
    console.log(`  • Random Negatives (Distinct Clusters)     : ${rndNegCount}`);
    console.log('  ----------------------------------------------------------');
    console.log(`  • Disjoint Cluster Splits: TRAIN=${trainCount}, VAL=${valCount}, TEST=${testCount}`);

    const outPath = path.resolve('models/attribution/labeled-pairs.json');
    fs.writeFileSync(outPath, JSON.stringify(pairs, null, 2) + '\n', 'utf8');
    console.log(`\n✔ Saved labeled pairs dataset to ${outPath}`);
    console.log('============================================================');
  } catch (err: any) {
    console.error('Error preparing attribution pairs:', err.message);
    process.exit(1);
  }
}

main();
