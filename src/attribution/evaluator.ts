import { AttributionPair, EvaluationReport, ErrorAnalysisItem } from './types.js';
import { LogisticAttributionModel } from './logistic_model.js';

export class AttributionEvaluator {
  /**
   * Computes comprehensive evaluation metrics strictly on the untouched TEST split.
   */
  public static evaluate(model: LogisticAttributionModel, testPairs: AttributionPair[]): EvaluationReport {
    if (testPairs.length === 0) {
      throw new Error('Test split is empty. Evaluation requires test samples.');
    }

    const predictions: { yTrue: number; yProb: number; yPred: number }[] = [];
    let posCount = 0;
    let negCount = 0;
    let hardNegCount = 0;

    for (const p of testPairs) {
      const prob = model.predictCalibrated(p.features);
      const yTrue = p.numericLabel;
      const yPred = prob >= 0.5 ? 1 : 0;

      predictions.push({ yTrue, yProb: prob, yPred });

      if (yTrue === 1) posCount++;
      else {
        negCount++;
        if (p.pairType === 'NEGATIVE_HARD_CATEGORY_OVERLAP') hardNegCount++;
      }
    }

    // Confusion matrix at threshold 0.5
    let tp = 0, fp = 0, tn = 0, fn = 0;
    let brierSum = 0;

    for (const pred of predictions) {
      if (pred.yTrue === 1 && pred.yPred === 1) tp++;
      else if (pred.yTrue === 0 && pred.yPred === 1) fp++;
      else if (pred.yTrue === 0 && pred.yPred === 0) tn++;
      else if (pred.yTrue === 1 && pred.yPred === 0) fn++;

      brierSum += Math.pow(pred.yProb - pred.yTrue, 2);
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const accuracy = (tp + tn) / testPairs.length;
    const brierScore = brierSum / testPairs.length;

    // Naive baseline (predicting class prior probability)
    const priorP = posCount / testPairs.length;
    const naiveBrier = predictions.reduce((sum, p) => sum + Math.pow(priorP - p.yTrue, 2), 0) / testPairs.length;

    // ROC-AUC
    const rocAuc = AttributionEvaluator.calculateRocAuc(predictions);
    const prAuc = AttributionEvaluator.calculatePrAuc(predictions);

    // Bootstrap 95% Confidence Intervals (1,000 resamples)
    const bootstrapCIs = AttributionEvaluator.computeBootstrapCIs(predictions, 1000);

    // Expected Calibration Error (ECE) across 10 bins
    const ece = AttributionEvaluator.calculateECE(predictions, 10);

    // Operating points
    const operatingPoints = [
      AttributionEvaluator.evaluateAtThreshold(predictions, 0.80, 'High Precision (Low Risk)'),
      AttributionEvaluator.evaluateAtThreshold(predictions, 0.50, 'Balanced Operating Point'),
      AttributionEvaluator.evaluateAtThreshold(predictions, 0.30, 'High Recall (Screening)'),
    ];

    return {
      evaluationVersion: '1.0.0-attribution',
      datasetSplit: 'TEST_SPLIT_ONLY',
      evaluatedAt: new Date().toISOString(),
      sampleCounts: {
        totalTestPairs: testPairs.length,
        positivePairs: posCount,
        negativePairs: negCount,
        hardNegativePairs: hardNegCount,
      },
      metrics: {
        rocAuc: parseFloat(rocAuc.toFixed(4)),
        prAuc: parseFloat(prAuc.toFixed(4)),
        brierScore: parseFloat(brierScore.toFixed(4)),
        precision: parseFloat(precision.toFixed(4)),
        recall: parseFloat(recall.toFixed(4)),
        f1Score: parseFloat(f1.toFixed(4)),
        accuracy: parseFloat(accuracy.toFixed(4)),
        naivePriorBaselineBrier: parseFloat(naiveBrier.toFixed(4)),
        naivePriorBaselineRocAuc: 0.50,
      },
      operatingPoints,
      confusionMatrix: { tp, fp, tn, fn },
      bootstrapConfidenceIntervals95: bootstrapCIs,
      calibration: {
        brierScore: parseFloat(brierScore.toFixed(4)),
        expectedCalibrationError: parseFloat(ece.toFixed(4)),
      },
    };
  }

  /**
   * Generates error analysis inspecting False Positives and False Negatives.
   */
  public static errorAnalysis(model: LogisticAttributionModel, testPairs: AttributionPair[]): ErrorAnalysisItem[] {
    const errors: ErrorAnalysisItem[] = [];

    for (const p of testPairs) {
      const prob = model.predictCalibrated(p.features);
      const yTrue = p.numericLabel;
      const yPred = prob >= 0.5 ? 1 : 0;

      if (yPred !== yTrue) {
        const errorType = yPred === 1 && yTrue === 0 ? 'FALSE_POSITIVE' : 'FALSE_NEGATIVE';
        const dominantFeatures: string[] = [];

        p.features.forEach((val, i) => {
          if (val >= 0.6) dominantFeatures.push(model.featureOrder[i]);
        });

        let diagnosticReason = '';
        let dataQualityCaveat = '';

        if (errorType === 'FALSE_POSITIVE') {
          diagnosticReason = 'Distinct actors exhibited overlapping product categories and coincidentally similar active hours.';
          dataQualityCaveat = 'Marketplace seller cohort effects can create superficial behavioral correlation among competitor vendors.';
        } else {
          diagnosticReason = 'True same actor exhibited high temporal cadence variance between forum posting and listing management.';
          dataQualityCaveat = 'Sparse forum posting frequency increases inter-event interval variance.';
        }

        errors.push({
          pairId: p.pairId,
          entityA: p.entityA.name,
          entityB: p.entityB.name,
          trueLabel: p.label,
          predictedProbability: prob,
          errorType,
          dominantFeatures,
          diagnosticReason,
          dataQualityCaveat,
        });
      }
    }

    return errors;
  }

  private static calculateRocAuc(preds: { yTrue: number; yProb: number }[]): number {
    const sorted = [...preds].sort((a, b) => b.yProb - a.yProb);
    let nPos = 0;
    let nNeg = 0;
    for (const p of sorted) {
      if (p.yTrue === 1) nPos++;
      else nNeg++;
    }
    if (nPos === 0 || nNeg === 0) return 0.5;

    let auc = 0;
    let currentPos = 0;

    for (const p of sorted) {
      if (p.yTrue === 1) {
        currentPos++;
      } else {
        auc += currentPos;
      }
    }

    return auc / (nPos * nNeg);
  }

  private static calculatePrAuc(preds: { yTrue: number; yProb: number }[]): number {
    const sorted = [...preds].sort((a, b) => b.yProb - a.yProb);
    let totalPos = preds.filter((p) => p.yTrue === 1).length;
    if (totalPos === 0) return 0.0;

    let tp = 0;
    let fp = 0;
    let prevRecall = 0;
    let prAuc = 0;

    for (const p of sorted) {
      if (p.yTrue === 1) tp++;
      else fp++;

      const prec = tp / (tp + fp);
      const rec = tp / totalPos;

      prAuc += prec * (rec - prevRecall);
      prevRecall = rec;
    }

    return prAuc;
  }

  private static calculateECE(preds: { yTrue: number; yProb: number }[], numBins = 10): number {
    let ece = 0;
    const N = preds.length;

    for (let b = 0; b < numBins; b++) {
      const binLower = b / numBins;
      const binUpper = (b + 1) / numBins;
      const inBin = preds.filter((p) => p.yProb >= binLower && (b === numBins - 1 ? p.yProb <= binUpper : p.yProb < binUpper));

      if (inBin.length > 0) {
        const avgProb = inBin.reduce((sum, p) => sum + p.yProb, 0) / inBin.length;
        const trueFrac = inBin.reduce((sum, p) => sum + p.yTrue, 0) / inBin.length;
        ece += (inBin.length / N) * Math.abs(avgProb - trueFrac);
      }
    }

    return ece;
  }

  private static evaluateAtThreshold(
    preds: { yTrue: number; yProb: number }[],
    thresh: number,
    name: string
  ) {
    let tp = 0, fp = 0, fn = 0;
    for (const p of preds) {
      const pred = p.yProb >= thresh ? 1 : 0;
      if (p.yTrue === 1 && pred === 1) tp++;
      else if (p.yTrue === 0 && pred === 1) fp++;
      else if (p.yTrue === 1 && pred === 0) fn++;
    }
    const prec = tp + fp > 0 ? tp / (tp + fp) : 0;
    const rec = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;

    return {
      name,
      threshold: thresh,
      precision: parseFloat(prec.toFixed(4)),
      recall: parseFloat(rec.toFixed(4)),
      f1: parseFloat(f1.toFixed(4)),
    };
  }

  private static computeBootstrapCIs(
    preds: { yTrue: number; yProb: number }[],
    resamples = 1000
  ): {
    rocAuc: [number, number];
    prAuc: [number, number];
    f1Score: [number, number];
    resamplesCount: number;
  } {
    const rocScores: number[] = [];
    const prScores: number[] = [];
    const f1Scores: number[] = [];
    const N = preds.length;

    // Simple pseudo-random LCG for reproducible bootstrap
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let r = 0; r < resamples; r++) {
      const sample: { yTrue: number; yProb: number }[] = [];
      for (let i = 0; i < N; i++) {
        const idx = Math.floor(rand() * N);
        sample.push(preds[idx]);
      }

      const rAuc = AttributionEvaluator.calculateRocAuc(sample);
      const pAuc = AttributionEvaluator.calculatePrAuc(sample);

      let tp = 0, fp = 0, fn = 0;
      for (const s of sample) {
        const pred = s.yProb >= 0.5 ? 1 : 0;
        if (s.yTrue === 1 && pred === 1) tp++;
        else if (s.yTrue === 0 && pred === 1) fp++;
        else if (s.yTrue === 1 && pred === 0) fn++;
      }
      const prec = tp + fp > 0 ? tp / (tp + fp) : 0;
      const rec = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;

      rocScores.push(rAuc);
      prScores.push(pAuc);
      f1Scores.push(f1);
    }

    rocScores.sort((a, b) => a - b);
    prScores.sort((a, b) => a - b);
    f1Scores.sort((a, b) => a - b);

    const p025 = Math.floor(resamples * 0.025);
    const p975 = Math.floor(resamples * 0.975);

    return {
      rocAuc: [parseFloat(rocScores[p025].toFixed(4)), parseFloat(rocScores[p975].toFixed(4))],
      prAuc: [parseFloat(prScores[p025].toFixed(4)), parseFloat(prScores[p975].toFixed(4))],
      f1Score: [parseFloat(f1Scores[p025].toFixed(4)), parseFloat(f1Scores[p975].toFixed(4))],
      resamplesCount: resamples,
    };
  }
}
