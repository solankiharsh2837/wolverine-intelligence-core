import {
  AttributionPair,
  AttributionCandidateResult,
  AttributionFeatureDecomposition,
  TrainingConfig,
} from './types.js';
import { ATTRIBUTION_FEATURE_ORDER } from './feature_extractor.js';

export interface TrainHyperparameters {
  learningRate?: number;
  regularizationLambda?: number;
  maxEpochs?: number;
  randomSeed?: number;
}

export class LogisticAttributionModel {
  public weights: number[];
  public bias: number;
  public plattA: number;
  public plattB: number;
  public readonly featureOrder: string[];

  constructor(
    weights: number[] = [1.2, 0.9, 0.8, 1.1, 0.5, 0.4],
    bias: number = -2.5,
    plattA: number = 1.0,
    plattB: number = 0.0
  ) {
    this.weights = weights;
    this.bias = bias;
    this.plattA = plattA;
    this.plattB = plattB;
    this.featureOrder = ATTRIBUTION_FEATURE_ORDER;
  }

  public static sigmoid(z: number): number {
    return 1.0 / (1.0 + Math.exp(-Math.max(-50, Math.min(50, z))));
  }

  /**
   * Computes raw logit: z = beta_0 + sum(beta_i * x_i).
   */
  public computeLogit(features: number[]): number {
    let z = this.bias;
    for (let i = 0; i < features.length; i++) {
      z += (this.weights[i] || 0) * (features[i] || 0);
    }
    return parseFloat(z.toFixed(4));
  }

  /**
   * Computes raw sigmoid probability: sigma(z).
   */
  public predictRaw(features: number[]): number {
    const z = this.computeLogit(features);
    return parseFloat(LogisticAttributionModel.sigmoid(z).toFixed(4));
  }

  /**
   * Computes calibrated probability via Platt scaling: sigma(A * z + B).
   */
  public predictCalibrated(features: number[]): number {
    const z = this.computeLogit(features);
    const calibratedZ = this.plattA * z + this.plattB;
    const prob = LogisticAttributionModel.sigmoid(calibratedZ);
    return parseFloat(prob.toFixed(4));
  }

  /**
   * Explains the attribution decision with exact feature contributions: beta_i * x_i.
   */
  public explain(
    features: number[],
    entityAName: string = 'EntityA',
    entityBName: string = 'EntityB'
  ): AttributionCandidateResult {
    const z = this.computeLogit(features);
    const rawProb = this.predictRaw(features);
    const calProb = this.predictCalibrated(features);

    let totalPositiveContribution = 0;
    const contributions: number[] = [];

    for (let i = 0; i < features.length; i++) {
      const contrib = (this.weights[i] || 0) * (features[i] || 0);
      contributions.push(contrib);
      if (contrib > 0) totalPositiveContribution += contrib;
    }

    const decompositions: AttributionFeatureDecomposition[] = features.map((val, i) => {
      const coeff = this.weights[i] || 0;
      const contrib = contributions[i];
      const pct = totalPositiveContribution > 0 && contrib > 0 ? (contrib / totalPositiveContribution) * 100 : 0;

      return {
        name: this.featureOrder[i] || `feature_${i}`,
        rawValue: val,
        normalizedValue: val,
        coefficient: parseFloat(coeff.toFixed(4)),
        contribution: parseFloat(contrib.toFixed(4)),
        relativeImportancePct: parseFloat(pct.toFixed(2)),
      };
    });

    const isMatch = calProb >= 0.65;
    let confidenceTier: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (calProb >= 0.85 || calProb <= 0.15) confidenceTier = 'HIGH';
    else if (calProb >= 0.70 || calProb <= 0.30) confidenceTier = 'MEDIUM';

    return {
      candidateId: `cand_attr_${Date.now()}`,
      entityA: entityAName,
      entityB: entityBName,
      rawLogit: z,
      rawProbability: rawProb,
      calibratedProbability: calProb,
      classification: isMatch ? 'POSSIBLE_SAME_AS' : 'DISTINCT_ENTITIES',
      confidenceTier,
      evidenceClass: 'STATISTICAL_MATCH',
      modelVersion: '1.0.0-attribution',
      featureVersion: '1.0.0',
      evaluatedAt: new Date().toISOString(),
      decomposition: decompositions,
      supportingObservations: [
        `Temporal Activity similarity: ${(features[0] * 100).toFixed(1)}%`,
        `Product Category alignment: ${(features[3] * 100).toFixed(1)}%`,
        `Cadence ratio correlation: ${(features[2] * 100).toFixed(1)}%`,
      ],
    };
  }
}

/**
 * Genuinely trains a Logistic Regression Classifier with L2 Regularization on TRAIN split,
 * and calibrates probability outputs using Platt scaling on VALIDATION split.
 */
export function trainLogisticAttributionModel(
  trainPairs: AttributionPair[],
  valPairs: AttributionPair[],
  hyperparams: TrainHyperparameters = {}
): { model: LogisticAttributionModel; config: TrainingConfig } {
  const lr = hyperparams.learningRate || 0.1;
  const lambda = hyperparams.regularizationLambda || 0.01;
  const maxEpochs = hyperparams.maxEpochs || 300;
  const seed = hyperparams.randomSeed || 42;

  const numFeatures = 6;
  const weights: number[] = new Array(numFeatures).fill(0.0);
  let bias = 0.0;

  const N = trainPairs.length;
  let finalTrainLoss = 0;
  let finalValLoss = 0;

  // 1. Train weights using Gradient Descent with L2 regularization
  for (let epoch = 0; epoch < maxEpochs; epoch++) {
    const gradW = new Array(numFeatures).fill(0.0);
    let gradB = 0.0;
    let totalLoss = 0.0;

    for (const pair of trainPairs) {
      const x = pair.features;
      const y = pair.numericLabel;

      let z = bias;
      for (let j = 0; j < numFeatures; j++) {
        z += weights[j] * x[j];
      }
      const p = LogisticAttributionModel.sigmoid(z);

      const err = p - y;
      for (let j = 0; j < numFeatures; j++) {
        gradW[j] += err * x[j];
      }
      gradB += err;

      // Binary Cross-Entropy Loss
      const safeP = Math.max(1e-15, Math.min(1 - 1e-15, p));
      totalLoss += -(y * Math.log(safeP) + (1 - y) * Math.log(1 - safeP));
    }

    // Apply L2 regularization to gradients and weights
    for (let j = 0; j < numFeatures; j++) {
      const regGrad = (gradW[j] / N) + (lambda * weights[j]);
      weights[j] -= lr * regGrad;
    }
    bias -= lr * (gradB / N);

    finalTrainLoss = totalLoss / N;
  }

  // 2. Calibrate Platt scaling parameters on VALIDATION split
  let plattA = 1.0;
  let plattB = 0.0;

  if (valPairs.length > 0) {
    const rawValLogits: number[] = [];
    const valLabels: number[] = [];

    for (const pair of valPairs) {
      let z = bias;
      for (let j = 0; j < numFeatures; j++) {
        z += weights[j] * pair.features[j];
      }
      rawValLogits.push(z);
      valLabels.push(pair.numericLabel);
    }

    // Fit scalar A and B to min BCE on val logits
    let pA = 1.0;
    let pB = 0.0;
    const pLr = 0.05;
    const vN = valPairs.length;

    for (let ep = 0; ep < 150; ep++) {
      let gA = 0;
      let gB = 0;
      let vLoss = 0;

      for (let k = 0; k < vN; k++) {
        const z = rawValLogits[k];
        const y = valLabels[k];
        const p = LogisticAttributionModel.sigmoid(pA * z + pB);
        const err = p - y;
        gA += err * z;
        gB += err;

        const safeP = Math.max(1e-15, Math.min(1 - 1e-15, p));
        vLoss += -(y * Math.log(safeP) + (1 - y) * Math.log(1 - safeP));
      }

      pA -= pLr * (gA / vN);
      pB -= pLr * (gB / vN);
      finalValLoss = vLoss / vN;
    }

    plattA = parseFloat(Math.max(0.1, pA).toFixed(4));
    plattB = parseFloat(pB.toFixed(4));
  }

  // Compute accuracies
  const computeAccuracy = (pairs: AttributionPair[]) => {
    let correct = 0;
    for (const p of pairs) {
      let z = bias;
      for (let j = 0; j < numFeatures; j++) z += weights[j] * p.features[j];
      const prob = LogisticAttributionModel.sigmoid(plattA * z + plattB);
      if ((prob >= 0.5 ? 1 : 0) === p.numericLabel) correct++;
    }
    return parseFloat((correct / (pairs.length || 1)).toFixed(4));
  };

  const trainAcc = computeAccuracy(trainPairs);
  const valAcc = computeAccuracy(valPairs);

  const roundedWeights = weights.map((w) => parseFloat(w.toFixed(4)));
  const roundedBias = parseFloat(bias.toFixed(4));

  const model = new LogisticAttributionModel(roundedWeights, roundedBias, plattA, plattB);

  const config: TrainingConfig = {
    modelVersion: '1.0.0-attribution',
    featureVersion: '1.0.0',
    featureDimension: 6,
    featureOrder: ATTRIBUTION_FEATURE_ORDER,
    weights: roundedWeights,
    bias: roundedBias,
    plattScaling: {
      paramA: plattA,
      paramB: plattB,
      calibratedOn: 'VALIDATION_SPLIT',
    },
    hyperparameters: {
      regularizationLambda: lambda,
      learningRate: lr,
      maxEpochs,
      batchSize: N,
      randomSeed: seed,
    },
    trainingResults: {
      trainLoss: parseFloat(finalTrainLoss.toFixed(4)),
      trainAccuracy: trainAcc,
      valLoss: parseFloat(finalValLoss.toFixed(4)),
      valAccuracy: valAcc,
      convergedEpoch: maxEpochs,
    },
    trainedAt: new Date().toISOString(),
  };

  return { model, config };
}
