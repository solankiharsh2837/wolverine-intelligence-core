import fs from 'node:fs';
import path from 'node:path';
import { AttributionPair, TrainingConfig } from '../src/attribution/types.js';
import { LogisticAttributionModel } from '../src/attribution/logistic_model.js';
import { AttributionEvaluator } from '../src/attribution/evaluator.js';

async function main() {
  console.log('============================================================');
  console.log('WOLVERINE INTELLIGENCE — ATTRIBUTION MODEL EVALUATOR (TEST SPLIT)');
  console.log('============================================================\n');

  try {
    const configPath = path.resolve('models/attribution/training-config.json');
    const pairsPath = path.resolve('models/attribution/labeled-pairs.json');

    if (!fs.existsSync(configPath) || !fs.existsSync(pairsPath)) {
      throw new Error('Required artifacts missing. Run prepare and train steps first.');
    }

    const config: TrainingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const pairs: AttributionPair[] = JSON.parse(fs.readFileSync(pairsPath, 'utf8'));
    const testPairs = pairs.filter((p) => p.split === 'TEST');

    console.log(`[1/3] Evaluating model on ${testPairs.length} UNTOUCHED TEST samples...`);
    const model = new LogisticAttributionModel(
      config.weights,
      config.bias,
      config.plattScaling.paramA,
      config.plattScaling.paramB
    );

    const report = AttributionEvaluator.evaluate(model, testPairs);
    const errors = AttributionEvaluator.errorAnalysis(model, testPairs);

    console.log('\n============================================================');
    console.log('TEST SPLIT EVALUATION METRICS:');
    console.log('============================================================');
    console.log(`  • ROC-AUC                   : ${report.metrics.rocAuc} (95% CI: [${report.bootstrapConfidenceIntervals95.rocAuc.join(', ')}])`);
    console.log(`  • PR-AUC                    : ${report.metrics.prAuc} (95% CI: [${report.bootstrapConfidenceIntervals95.prAuc.join(', ')}])`);
    console.log(`  • F1 Score                  : ${report.metrics.f1Score} (95% CI: [${report.bootstrapConfidenceIntervals95.f1Score.join(', ')}])`);
    console.log(`  • Precision / Recall        : ${report.metrics.precision} / ${report.metrics.recall}`);
    console.log(`  • Brier Calibration Score   : ${report.metrics.brierScore} (Naive Baseline: ${report.metrics.naivePriorBaselineBrier})`);
    console.log(`  • Expected Calibration Error: ${report.calibration.expectedCalibrationError}`);
    console.log('------------------------------------------------------------');
    console.log('CONFUSION MATRIX (Threshold = 0.50):');
    console.log(`  TP: ${report.confusionMatrix.tp} | FP: ${report.confusionMatrix.fp}`);
    console.log(`  FN: ${report.confusionMatrix.fn} | TN: ${report.confusionMatrix.tn}`);
    console.log('------------------------------------------------------------');
    console.log(`ERROR ANALYSIS: ${errors.length} classification errors identified.`);

    const reportOut = path.resolve('models/attribution/evaluation-report.json');
    const errorsOut = path.resolve('models/attribution/error-analysis.json');

    fs.writeFileSync(reportOut, JSON.stringify(report, null, 2) + '\n', 'utf8');
    fs.writeFileSync(errorsOut, JSON.stringify(errors, null, 2) + '\n', 'utf8');

    console.log(`\n✔ Saved evaluation report to ${reportOut}`);
    console.log(`✔ Saved error analysis to ${errorsOut}`);
    console.log('============================================================');
  } catch (err: any) {
    console.error('Error during attribution evaluation:', err.message);
    process.exit(1);
  }
}

main();
