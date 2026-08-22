import { runBehaviorBenchmark } from '../src/behavior/benchmark.js';

async function main() {
  console.log('============================================================');
  console.log('WOLVERINE INTELLIGENCE — BEHAVIOR MODEL BENCHMARK SUITE');
  console.log('============================================================\n');

  try {
    await runBehaviorBenchmark(['1', '363', '448', '3194', '5230']);
    console.log('\n============================================================');
    console.log('BENCHMARK COMPLETE: Report saved to models/behavior/benchmark-report.json');
    console.log('============================================================');
  } catch (err: any) {
    console.error('Benchmark execution failed:', err.message);
    process.exit(1);
  }
}

main();
