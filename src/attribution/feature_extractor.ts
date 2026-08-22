import { BehaviorProfileData } from '../behavior/extractor.js';
import {
  jensenShannonSimilarity,
  cosineSimilarityMap,
  logRatioSimilarity,
  ratioSimilarity,
  jaccardSimilaritySets,
  adamicAdarIndexSets,
} from '../behavior/similarity.js';

export const ATTRIBUTION_FEATURE_ORDER = [
  'behavior_activity_js',
  'behavior_inter_event_log_ratio',
  'behavior_cadence_weekly_ratio',
  'behavior_category_cosine',
  'graph_jaccard',
  'graph_adamic_adar_norm',
];

export interface ExtractedFeatureResult {
  features: number[];
  featureMask: boolean[];
  activeFeatures: { name: string; value: number }[];
}

/**
 * Extracts the canonical 6-dimensional attribution feature vector and its semantic availability mask.
 */
export function extractAttributionFeaturesWithMask(
  profileA: BehaviorProfileData,
  profileB: BehaviorProfileData,
  degreesMap: Record<string, number> = {}
): ExtractedFeatureResult {
  // 1. Activity Hour JSD Similarity [0, 1]
  const x1 = jensenShannonSimilarity(profileA.activityHours24, profileB.activityHours24);

  // 2. Inter-Event Log-Ratio Similarity [0, 1]
  const x2 = logRatioSimilarity(profileA.interEventStats.meanHours, profileB.interEventStats.meanHours);

  // 3. Cadence Weekly Ratio [0, 1]
  const x3 = ratioSimilarity(profileA.cadence.eventsPerActiveWeek, profileB.cadence.eventsPerActiveWeek);

  // 4. Category Cosine Similarity [0, 1] (across canonical 6-bin category vectors)
  const x4 = cosineSimilarityMap(profileA.categoryDistribution, profileB.categoryDistribution);

  // Cross-subsystem graph check: If comparing Forum Persona (USER) with Marketplace Vendor (VENDOR),
  // graph namespaces are disjoint ('thread_<tid>' vs vendor VID). We mark x5 and x6 as UNAVAILABLE (false).
  const isCrossSubsystem = profileA.entityType !== profileB.entityType;
  const isGraphAvailable = !isCrossSubsystem;

  let x5 = 0.0;
  let x6 = 0.0;

  if (isGraphAvailable) {
    x5 = jaccardSimilaritySets(profileA.graph.counterparties, profileB.graph.counterparties);
    const rawAA = adamicAdarIndexSets(profileA.graph.counterparties, profileB.graph.counterparties, degreesMap);
    x6 = parseFloat(Math.tanh(rawAA / 2.0).toFixed(4));
  }

  const featureMask = [true, true, true, true, isGraphAvailable, isGraphAvailable];
  const features = [x1, x2, x3, x4, x5, x6];

  const activeFeatures = ATTRIBUTION_FEATURE_ORDER.map((name, idx) => ({
    name,
    value: features[idx],
  })).filter((_, idx) => featureMask[idx]);

  return { features, featureMask, activeFeatures };
}

/**
 * Extracts the canonical 6-dimensional normalized attribution feature vector x \in [0, 1]^6.
 */
export function extractAttributionFeatures(
  profileA: BehaviorProfileData,
  profileB: BehaviorProfileData,
  degreesMap: Record<string, number> = {}
): number[] {
  return extractAttributionFeaturesWithMask(profileA, profileB, degreesMap).features;
}

/**
 * Normalizes an arbitrary raw feature array according to the documented feature constraints.
 */
export function normalizeAttributionVector(rawVec: number[]): number[] {
  if (rawVec.length !== 6) {
    throw new Error(`Attribution feature vector must have length 6, received ${rawVec.length}`);
  }
  return rawVec.map((val) => {
    if (isNaN(val) || !isFinite(val)) return 0.0;
    return parseFloat(Math.min(1.0, Math.max(0.0, val)).toFixed(4));
  });
}

