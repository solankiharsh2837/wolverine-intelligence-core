import { EvolutionBehaviorProfiler } from '../src/behavior/profiler.js';

async function main() {
  const actorA = process.argv[2] || 'Verto';
  const actorB = process.argv[3] || '363';
  const profiler = new EvolutionBehaviorProfiler();

  console.log('============================================================');
  console.log('WOLVERINE INTELLIGENCE — BEHAVIORAL SIMILARITY COMPARATOR');
  console.log('============================================================\n');

  try {
    console.log(`[1/2] Profiling ${actorA}...`);
    const profA = await profiler.profileVendor(actorA);

    console.log(`[2/2] Profiling ${actorB}...`);
    const profB = await profiler.profileVendor(actorB);

    console.log('\n============================================================');
    console.log(`BEHAVIORAL SIMILARITY MATRIX: ${profA.entityName} vs ${profB.entityName}`);
    console.log('============================================================');

    const comp = profiler.compareProfiles(profA, profB);

    console.log(`• Entity A                   : ${comp.entityA} (${profA.cadence.totalEvents} events, ${profA.cadence.activeDaysCount} active days)`);
    console.log(`• Entity B                   : ${comp.entityB} (${profB.cadence.totalEvents} events, ${profB.cadence.activeDaysCount} active days)`);
    console.log(`• Sparse Comparison Warning  : ${comp.isSparseComparison}`);
    console.log('------------------------------------------------------------');
    console.log('COMPONENT-LEVEL SIMILARITY SCORES:');
    console.log(`  1. Activity-Hour Similarity (S_JS) : ${comp.activityHourSimilarity} (JSD: ${comp.activityHourJSD})`);
    console.log(`  2. Category Cosine Similarity      : ${comp.categoryCosineSimilarity}`);
    console.log(`  3. Inter-Event Log-Ratio Sim       : ${comp.interEventLogRatioSimilarity}`);
    console.log(`  4. Cadence Weekly Ratio Sim        : ${comp.cadenceWeeklyRatioSimilarity}`);
    console.log(`  5. Graph Counterparty Jaccard Sim  : ${comp.graphCounterpartyJaccard}`);
    console.log(`  6. Graph Adamic-Adar Index         : ${comp.graphAdamicAdarIndex}`);
    console.log('------------------------------------------------------------');
    console.log('TAXONOMY CLASSIFICATION:');
    console.log('  -> Result: BEHAVIORAL SIMILARITY (NOT "same actor" proof)');
    console.log('  -> Note  : Behavioral telemetry is an unweighted input to attribution fusion.');
    console.log('============================================================');
  } catch (err: any) {
    console.error('Error during behavioral comparison:', err.message);
    process.exit(1);
  }
}

main();
