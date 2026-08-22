import fs from 'node:fs';
import path from 'node:path';
import { AttributionPair } from '../src/attribution/types.js';
import { trainLogisticAttributionModel } from '../src/attribution/logistic_model.js';

async function main() {
  console.log('============================================================');
  console.log('WOLVERINE INTELLIGENCE — LOGISTIC ATTRIBUTION MODEL TRAINER');
  console.log('============================================================\n');

  try {
    const pairsPath = path.resolve('models/attribution/labeled-pairs.json');
    if (!fs.existsSync(pairsPath)) {
      throw new Error(`Labeled pairs not found at ${pairsPath}. Run 'npm run attribution:prepare' first.`);
    }

    const pairs: AttributionPair[] = JSON.parse(fs.readFileSync(pairsPath, 'utf8'));
    const trainPairs = pairs.filter((p) => p.split === 'TRAIN');
    const valPairs = pairs.filter((p) => p.split === 'VALIDATION');

    console.log(`[1/3] Training Dataset: ${trainPairs.length} TRAIN samples, ${valPairs.length} VAL samples.`);
    console.log('[2/3] Executing Gradient Descent with L2 Regularization (lambda=0.01)...');

    const { model, config } = trainLogisticAttributionModel(trainPairs, valPairs, {
      learningRate: 0.1,
      regularizationLambda: 0.01,
      maxEpochs: 300,
      randomSeed: 42,
    });

    console.log(`[3/3] Training converged with Train Loss: ${config.trainingResults.trainLoss}, Val Loss: ${config.trainingResults.valLoss}`);
    console.log('------------------------------------------------------------');
    console.log('LEARNED LOGISTIC REGRESSION COEFFICIENTS:');
    console.log(`  • Intercept (beta_0)      : ${config.bias}`);
    config.featureOrder.forEach((name, i) => {
      console.log(`  • ${name.padEnd(32)} (beta_${i + 1}): ${config.weights[i]}`);
    });
    console.log('------------------------------------------------------------');
    console.log(`PLATT CALIBRATION PARAMETERS (on Validation Split): A=${config.plattScaling.paramA}, B=${config.plattScaling.paramB}`);

    const outPath = path.resolve('models/attribution/training-config.json');
    fs.writeFileSync(outPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
    console.log(`\n✔ Saved model training config to ${outPath}`);
    console.log('============================================================');
  } catch (err: any) {
    console.error('Error during attribution training:', err.message);
    process.exit(1);
  }
}

main();
