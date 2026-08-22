export type AttributionLabel = 'SAME_ACTOR' | 'DIFFERENT_ACTOR';
export type PairSplit = 'TRAIN' | 'VALIDATION' | 'TEST';
export type PairType =
  | 'POSITIVE_GROUND_TRUTH_MATCH'
  | 'POSITIVE_TEMPORAL_SPLIT'
  | 'NEGATIVE_RANDOM'
  | 'NEGATIVE_HARD_CATEGORY_OVERLAP';

export interface AttributionPair {
  pairId: string;
  entityA: {
    id: string;
    name: string;
    type: 'VENDOR' | 'USER';
  };
  entityB: {
    id: string;
    name: string;
    type: 'VENDOR' | 'USER';
  };
  label: AttributionLabel;
  numericLabel: 0 | 1; // 1 = SAME_ACTOR, 0 = DIFFERENT_ACTOR
  pairType: PairType;
  labelSource: string;
  datasetId: 'evolution-2014-2015';
  datasetVersion: '1.0.0';
  split: PairSplit;
  featureVersion: '1.0.0';
  features: number[]; // 6-dimensional vector [x1..x6]
  featureNames: string[];
  provenance: {
    matchId?: number;
    sourceFiles: string[];
    createdAt: string;
  };
  notes: string;
}

export interface AttributionFeatureDecomposition {
  name: string;
  rawValue: number;
  normalizedValue: number;
  coefficient: number;
  contribution: number;
  relativeImportancePct: number;
}

export interface AttributionCandidateResult {
  candidateId: string;
  entityA: string;
  entityB: string;
  rawLogit: number;
  rawProbability: number;
  calibratedProbability: number;
  classification: 'POSSIBLE_SAME_AS' | 'DISTINCT_ENTITIES';
  confidenceTier: 'LOW' | 'MEDIUM' | 'HIGH';
  evidenceClass: 'STATISTICAL_MATCH';
  modelVersion: '1.0.0-attribution';
  featureVersion: '1.0.0';
  evaluatedAt: string;
  decomposition: AttributionFeatureDecomposition[];
  supportingObservations: string[];
}

export interface TrainingConfig {
  modelVersion: '1.0.0-attribution';
  featureVersion: '1.0.0';
  featureDimension: 6;
  featureOrder: string[];
  weights: number[]; // beta_1 .. beta_6
  bias: number; // beta_0
  plattScaling: {
    paramA: number;
    paramB: number;
    calibratedOn: 'VALIDATION_SPLIT';
  };
  hyperparameters: {
    regularizationLambda: number;
    learningRate: number;
    maxEpochs: number;
    batchSize: number;
    randomSeed: number;
  };
  trainingResults: {
    trainLoss: number;
    trainAccuracy: number;
    valLoss: number;
    valAccuracy: number;
    convergedEpoch: number;
  };
  trainedAt: string;
}

export interface EvaluationReport {
  evaluationVersion: '1.0.0-attribution';
  datasetSplit: 'TEST_SPLIT_ONLY';
  evaluatedAt: string;
  sampleCounts: {
    totalTestPairs: number;
    positivePairs: number;
    negativePairs: number;
    hardNegativePairs: number;
  };
  metrics: {
    rocAuc: number;
    prAuc: number;
    brierScore: number;
    precision: number;
    recall: number;
    f1Score: number;
    accuracy: number;
    naivePriorBaselineBrier: number;
    naivePriorBaselineRocAuc: number;
  };
  operatingPoints: {
    name: string;
    threshold: number;
    precision: number;
    recall: number;
    f1: number;
  }[];
  confusionMatrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
  bootstrapConfidenceIntervals95: {
    rocAuc: [number, number];
    prAuc: [number, number];
    f1Score: [number, number];
    resamplesCount: number;
  };
  calibration: {
    brierScore: number;
    expectedCalibrationError: number;
  };
}

export interface ErrorAnalysisItem {
  pairId: string;
  entityA: string;
  entityB: string;
  trueLabel: AttributionLabel;
  predictedProbability: number;
  errorType: 'FALSE_POSITIVE' | 'FALSE_NEGATIVE';
  dominantFeatures: string[];
  diagnosticReason: string;
  dataQualityCaveat: string;
}
