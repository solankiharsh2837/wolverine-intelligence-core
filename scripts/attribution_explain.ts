import fs from 'node:fs';
import path from 'node:path';
import { TrainingConfig } from '../src/attribution/types.js';
import { LogisticAttributionModel } from '../src/attribution/logistic_model.js';
import { EvolutionBehaviorProfiler } from '../src/behavior/profiler.js';
import { extractAttributionFeatures } from '../src/attribution/feature_extractor.js';

async function main() {
  const actorA = process.argv[2] || 'Verto';
  const actorB = process.argv[3] || '363';

  console.log('============================================================');
  console.log('WOLVERINE INTELLIGENCE — ATTRIBUTION PREDICTION & EXPLANATION');
  console.log('============================================================\n');

  try {
    const configPath = path.resolve('models/attribution/training-config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error('Training configuration not found. Run "npm run attribution:train" first.');
    }

    const config: TrainingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const model = new LogisticAttributionModel(
      config.weights,
      config.bias,
      config.plattScaling.paramA,
      config.plattScaling.paramB
    );

    const profiler = new EvolutionBehaviorProfiler();
    console.log(`[1/3] Extracting behavioral telemetry for "${actorA}" and "${actorB}"...`);
    const profA = await profiler.profileVendor(actorA);
    const profB = await profiler.profileVendor(actorB);

    console.log('[2/3] Extracting 6-dimensional normalized feature vector...');
    const features = extractAttributionFeatures(profA, profB);

    console.log('[3/3] Computing probabilistic attribution and feature contributions...\n');
    const explanation = model.explain(features, profA.entityName, profB.entityName);

    console.log('============================================================');
    console.log(`ATTRIBUTION CANDIDATE: ${explanation.entityA} vs ${explanation.entityB}`);
    console.log('============================================================');
    console.log(`Candidate ID           : ${explanation.candidateId}`);
    console.log(`Classification         : ${explanation.classification}`);
    console.log(`Confidence Tier        : ${explanation.confidenceTier}`);
    console.log(`Evidence Class         : ${explanation.evidenceClass}`);
    console.log(`Raw Linear Logit (z)   : ${explanation.rawLogit}`);
    console.log(`Raw Sigmoid Prob       : ${(explanation.rawProbability * 100).toFixed(2)}%`);
    console.log(`Calibrated Probability : ${(explanation.calibratedProbability * 100).toFixed(2)}%`);
    console.log('------------------------------------------------------------');
    console.log('STEP-BY-STEP MATHEMATICAL FEATURE DECOMPOSITION:');
    console.log('Formula: z = beta_0 + sum(beta_i * x_i)');
    console.log(`  Intercept (beta_0)   : ${config.bias.toFixed(4)}`);
    explanation.decomposition.forEach((d) => {
      console.log(`  • ${d.name.padEnd(32)}: x=${d.normalizedValue.toFixed(4)} * beta=${d.coefficient.toFixed(4)} => contrib = ${d.contribution >= 0 ? '+' : ''}${d.contribution.toFixed(4)} (${d.relativeImportancePct}% pos imp)`);
    });
    console.log('------------------------------------------------------------');
    console.log('SUPPORTING EVIDENCE & PROVENANCE:');
    explanation.supportingObservations.forEach((obs) => console.log(`  - ${obs}`));
    console.log(`  - Source Dataset: Evolution Zenodo 10156522`);
    console.log('============================================================');
  } catch (err: any) {
    console.error('Error explaining attribution:', err.message);
    process.exit(1);
  }
}

main();
