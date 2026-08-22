import fs from 'node:fs';
import path from 'node:path';

function main() {
  const modelDir = path.resolve('models/attribution');
  const manifestPath = path.join(modelDir, 'manifest.json');
  const trainPath = path.join(modelDir, 'training-config.json');
  const evalPath = path.join(modelDir, 'evaluation-report.json');

  console.log('============================================================');
  console.log('WOLVERINE INTELLIGENCE — ATTRIBUTION MODEL STATUS');
  console.log('============================================================\n');

  console.log('• Model ID           : wolverine-attribution-model');
  console.log('• Model Version      : 1.0.0-attribution');
  console.log('• Feature Version    : 1.0.0');
  console.log('• Classifier         : Logistic Regression (L2 Regularized) + Platt Calibration');
  console.log('• Ground-Truth Label : Evolution 2014-2015 forum-market/user-matching.tsv');
  console.log('• Manifest Exists    : ' + fs.existsSync(manifestPath));
  console.log('• Model Trained      : ' + fs.existsSync(trainPath));
  console.log('• Evaluated on Test  : ' + fs.existsSync(evalPath));

  if (fs.existsSync(evalPath)) {
    const report = JSON.parse(fs.readFileSync(evalPath, 'utf8'));
    console.log('------------------------------------------------------------');
    console.log('LATEST TEST METRICS:');
    console.log(`  ROC-AUC  : ${report.metrics.rocAuc} (95% CI: [${report.bootstrapConfidenceIntervals95.rocAuc.join(', ')}])`);
    console.log(`  PR-AUC   : ${report.metrics.prAuc} (95% CI: [${report.bootstrapConfidenceIntervals95.prAuc.join(', ')}])`);
    console.log(`  F1-Score : ${report.metrics.f1Score}`);
    console.log(`  Brier    : ${report.metrics.brierScore} (Naive Baseline: ${report.metrics.naivePriorBaselineBrier})`);
  }

  console.log('\nAvailable Commands:');
  console.log('  npm run attribution:prepare');
  console.log('  npm run attribution:train');
  console.log('  npm run attribution:evaluate');
  console.log('  npm run attribution:explain -- <actorA> <actorB>');
  console.log('  npm run attribution:status');
  console.log('============================================================');
}

main();
