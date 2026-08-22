import fs from 'node:fs';
import path from 'node:path';
import { EvolutionBehaviorProfiler } from './profiler.js';
import { BehaviorProfileData } from './extractor.js';
import { ComponentSimilarityResult } from './similarity.js';

export interface BenchmarkReport {
  benchmarkVersion: '1.0.0-behavior';
  generatedAt: string;
  sourceDataset: {
    id: string;
    version: string;
    doi: string;
  };
  profiledEntities: {
    id: string;
    name: string;
    eventsCount: number;
    activeDays: number;
    activeWeeks: number;
    primaryCategory: string;
    status: string;
  }[];
  pairwiseComparisons: ComponentSimilarityResult[];
}

export async function runBehaviorBenchmark(vids: string[] = ['1', '363', '448', '3194', '5230']): Promise<BenchmarkReport> {
  const profiler = new EvolutionBehaviorProfiler();
  const profiles: BehaviorProfileData[] = [];

  console.log(`[Benchmark] Profiling ${vids.length} active Evolution entities...`);
  for (const vid of vids) {
    try {
      console.log(`  • Profiling entity VID: ${vid}...`);
      const p = await profiler.profileVendor(vid);
      profiles.push(p);
      console.log(`    -> Name: ${p.entityName} | Events: ${p.cadence.totalEvents} | Status: ${p.status}`);
    } catch (err: any) {
      console.warn(`    -> Skipping VID ${vid}: ${err.message}`);
    }
  }

  console.log(`\n[Benchmark] Computing pairwise component similarities across ${profiles.length} profiles...`);
  const comparisons: ComponentSimilarityResult[] = [];

  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const comp = profiler.compareProfiles(profiles[i], profiles[j]);
      comparisons.push(comp);
      console.log(`  • [${comp.entityA} vs ${comp.entityB}]: Activity S_JS=${comp.activityHourSimilarity}, Cat Cos=${comp.categoryCosineSimilarity}, Cadence Ratio=${comp.cadenceWeeklyRatioSimilarity}`);
    }
  }

  const report: BenchmarkReport = {
    benchmarkVersion: '1.0.0-behavior',
    generatedAt: new Date().toISOString(),
    sourceDataset: {
      id: 'evolution-2014-2015',
      version: '1.0.0',
      doi: '10.5281/zenodo.10156522',
    },
    profiledEntities: profiles.map((p) => ({
      id: p.entityId,
      name: p.entityName,
      eventsCount: p.cadence.totalEvents,
      activeDays: p.cadence.activeDaysCount,
      activeWeeks: p.cadence.activeWeeksCount,
      primaryCategory: p.primaryCategory,
      status: p.status,
    })),
    pairwiseComparisons: comparisons,
  };

  const outPath = path.resolve('models/behavior/benchmark-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`\n[Benchmark] Benchmark report successfully written to ${outPath}`);

  return report;
}
