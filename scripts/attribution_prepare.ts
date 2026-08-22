import fs from 'node:fs';
import path from 'node:path';
import { AttributionPairGenerator } from '../src/attribution/pair_generator.js';

async function main() {
  console.log('============================================================');
  console.log('WOLVERINE INTELLIGENCE — REAL DATA ATTRIBUTION PAIR PREPARATION');
  console.log('============================================================\n');

  try {
    const generator = new AttributionPairGenerator();
    console.log('[1/2] Profiling real entities and extracting real feature vectors from Evolution dataset...');
    const { pairs, insufficientDataCount } = await generator.generatePairsDataset(30);

    const trainCount = pairs.filter((p) => p.split === 'TRAIN').length;
    const valCount = pairs.filter((p) => p.split === 'VALIDATION').length;
    const testCount = pairs.filter((p) => p.split === 'TEST').length;
    const posCount = pairs.filter((p) => p.label === 'SAME_ACTOR').length;
    const hardNegCount = pairs.filter((p) => p.pairType === 'NEGATIVE_HARD_CATEGORY_OVERLAP').length;
    const rndNegCount = pairs.filter((p) => p.pairType === 'NEGATIVE_RANDOM').length;

    console.log(`\n[2/2] Real Data Summary:`);
    console.log(`  • Total Labeled Pairs Generated            : ${pairs.length}`);
    console.log(`  • Real Positive Pairs (Ground-Truth Same)  : ${posCount}`);
    console.log(`  • Real Hard Negatives (Measured Cat Overlap): ${hardNegCount}`);
    console.log(`  • Real Random Negatives (Distinct Clusters): ${rndNegCount}`);
    console.log(`  • Sparse / Insufficient Data Pairs Skipped : ${insufficientDataCount}`);
    console.log('  ----------------------------------------------------------');
    console.log(`  • Disjoint Cluster Splits: TRAIN=${trainCount}, VAL=${valCount}, TEST=${testCount}`);

    // Print feature distributions across positive and hard negative classes
    const calcMeanFeat = (subPairs: typeof pairs) => {
      const means = [0, 0, 0, 0, 0, 0];
      for (const p of subPairs) {
        p.features.forEach((f, i) => (means[i] += f));
      }
      return means.map((m) => parseFloat((m / (subPairs.length || 1)).toFixed(4)));
    };

    const posMeans = calcMeanFeat(pairs.filter((p) => p.label === 'SAME_ACTOR'));
    const hardNegMeans = calcMeanFeat(pairs.filter((p) => p.pairType === 'NEGATIVE_HARD_CATEGORY_OVERLAP'));
    const rndNegMeans = calcMeanFeat(pairs.filter((p) => p.pairType === 'NEGATIVE_RANDOM'));

    console.log('\nREAL MEASURED FEATURE DISTRIBUTIONS (Mean Values):');
    console.log('  Feature Order: [activity_js, inter_event_log, cadence_ratio, category_cosine, graph_jaccard, graph_adamic_adar]');
    console.log(`  • Positive Pairs (Self/Match) : [${posMeans.join(', ')}]`);
    console.log(`  • Hard Negatives (Category)   : [${hardNegMeans.join(', ')}]`);
    console.log(`  • Random Negatives (Distinct) : [${rndNegMeans.join(', ')}]`);

    const outPath = path.resolve('models/attribution/labeled-pairs.json');
    fs.writeFileSync(outPath, JSON.stringify(pairs, null, 2) + '\n', 'utf8');
    console.log(`\n✔ Saved real labeled pairs dataset to ${outPath}`);
    console.log('============================================================');
  } catch (err: any) {
    console.error('Error preparing attribution pairs:', err.message);
    process.exit(1);
  }
}

main();
