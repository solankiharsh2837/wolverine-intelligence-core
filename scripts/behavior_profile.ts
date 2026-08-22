import { EvolutionBehaviorProfiler } from '../src/behavior/profiler.js';

async function main() {
  const actor = process.argv[2] || 'Verto';
  const profiler = new EvolutionBehaviorProfiler();

  console.log('============================================================');
  console.log('WOLVERINE INTELLIGENCE — BEHAVIOR PROFILE INSPECTOR');
  console.log('============================================================\n');

  try {
    const profile = await profiler.profileVendor(actor);

    console.log(`BEHAVIOR PROFILE: ${profile.entityName} (${profile.entityId})`);
    console.log(`Status         : ${profile.status}`);
    console.log(`Profile Version: ${profile.profileVersion}`);
    console.log(`Generated At   : ${profile.generatedAt}`);
    console.log('------------------------------------------------------------');
    console.log('VOLUME & CADENCE:');
    console.log(`  • Total Events Observed : ${profile.cadence.totalEvents}`);
    console.log(`  • Active Days           : ${profile.cadence.activeDaysCount}`);
    console.log(`  • Active Weeks          : ${profile.cadence.activeWeeksCount}`);
    console.log(`  • Events / Active Week  : ${profile.cadence.eventsPerActiveWeek}`);
    console.log(`  • Active Days / Week    : ${profile.cadence.activeDaysPerActiveWeek}`);
    console.log(`  • Max Inactivity Gap    : ${profile.cadence.inactivityGapMaxDays} days`);
    console.log('------------------------------------------------------------');
    console.log('TEMPORAL ACTIVITY (24-Hour UTC Distribution):');
    const peakHour = profile.activityHours24.indexOf(Math.max(...profile.activityHours24));
    console.log(`  • Peak Activity Hour    : ${peakHour}:00 UTC (${(profile.activityHours24[peakHour] * 100).toFixed(1)}% of events)`);
    console.log(`  • 24-hr Histogram Vector: [${profile.activityHours24.join(', ')}]`);
    console.log('------------------------------------------------------------');
    console.log('INTER-EVENT TIMING (Hours):');
    console.log(`  • Mean Interval         : ${profile.interEventStats.meanHours} hrs`);
    console.log(`  • Std Dev               : ${profile.interEventStats.stdHours} hrs`);
    console.log(`  • Median Interval       : ${profile.interEventStats.medianHours} hrs`);
    console.log(`  • Min / Max Interval    : ${profile.interEventStats.minHours} / ${profile.interEventStats.maxHours} hrs`);
    console.log(`  • 25th / 75th / 95th Pct: ${profile.interEventStats.p25Hours} / ${profile.interEventStats.p75Hours} / ${profile.interEventStats.p95Hours} hrs`);
    console.log('------------------------------------------------------------');
    console.log('CATEGORY BEHAVIOR:');
    console.log(`  • Primary Category      : ${profile.primaryCategory}`);
    console.log(`  • Category Distribution :`, profile.categoryDistribution);
    console.log('------------------------------------------------------------');
    console.log('GRAPH TELEMETRY:');
    console.log(`  • Interaction Degree    : ${profile.graph.degree} counterparties`);
    console.log(`  • Weighted Degree       : ${profile.graph.weightedDegree}`);
    console.log('------------------------------------------------------------');
    console.log('PROVENANCE:');
    console.log(`  • Source Dataset        : ${profile.provenance.datasetId} (v${profile.provenance.datasetVersion})`);
    console.log(`  • Source Files Cited    : ${profile.provenance.sourceFiles.join(', ')}`);
    console.log(`  • Matched Source Rows   : ${profile.provenance.matchedSourceRows}`);
    console.log('============================================================');
  } catch (err: any) {
    console.error(`Error profiling actor "${actor}":`, err.message);
    process.exit(1);
  }
}

main();
