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

/**
 * Extracts the canonical 6-dimensional normalized attribution feature vector x \in [0, 1]^6.
 */
export function extractAttributionFeatures(
  profileA: BehaviorProfileData,
  profileB: BehaviorProfileData,
  degreesMap: Record<string, number> = {}
): number[] {
  // 1. Activity Hour JSD Similarity [0, 1]
  const x1 = jensenShannonSimilarity(profileA.activityHours24, profileB.activityHours24);

  // 2. Inter-Event Log-Ratio Similarity [0, 1]
  const x2 = logRatioSimilarity(profileA.interEventStats.meanHours, profileB.interEventStats.meanHours);

  // 3. Cadence Weekly Ratio [0, 1]
  const x3 = ratioSimilarity(profileA.cadence.eventsPerActiveWeek, profileB.cadence.eventsPerActiveWeek);

  // 4. Category Cosine Similarity [0, 1]
  const x4 = cosineSimilarityMap(profileA.categoryDistribution, profileB.categoryDistribution);

  // 5. Graph Counterparty Jaccard [0, 1]
  const x5 = jaccardSimilaritySets(profileA.graph.counterparties, profileB.graph.counterparties);

  // 6. Graph Adamic-Adar Normalized via tanh(AA / 2.0) [0, 1]
  const rawAA = adamicAdarIndexSets(profileA.graph.counterparties, profileB.graph.counterparties, degreesMap);
  const x6 = parseFloat(Math.tanh(rawAA / 2.0).toFixed(4));

  return [x1, x2, x3, x4, x5, x6];
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
