// ============================================================
// MATHEMATICAL BEHAVIORAL SIMILARITY FUNCTIONS (PHASE 3)
// ============================================================

export interface ComponentSimilarityResult {
  entityA: string;
  entityB: string;
  activityHourJSD: number;
  activityHourSimilarity: number; // 1 - sqrt(JSD)
  categoryCosineSimilarity: number;
  interEventLogRatioSimilarity: number;
  cadenceWeeklyRatioSimilarity: number;
  graphCounterpartyJaccard: number;
  graphAdamicAdarIndex: number;
  isSparseComparison: boolean;
  notes: string[];
}

/**
 * Computes Kullback-Leibler Divergence: D_KL(P || Q) = \sum P(i) * ln(P(i) / Q(i))
 * With boundary condition: 0 * ln(0 / Q(i)) = 0.
 */
export function klDivergence(p: number[], q: number[]): number {
  let dkl = 0;
  for (let i = 0; i < p.length; i++) {
    const pi = p[i];
    const qi = q[i];
    if (pi > 0 && qi > 0) {
      dkl += pi * Math.log(pi / qi);
    }
  }
  return Math.max(0, dkl);
}

/**
 * Computes Jensen-Shannon Divergence:
 * JSD(P, Q) = 1/2 * D_KL(P || M) + 1/2 * D_KL(Q || M) where M = 1/2 * (P + Q)
 */
export function jensenShannonDivergence(p: number[], q: number[]): number {
  if (p.length !== q.length || p.length === 0) return 1.0;

  const m: number[] = new Array(p.length);
  for (let i = 0; i < p.length; i++) {
    m[i] = 0.5 * (p[i] + q[i]);
  }

  const klPM = klDivergence(p, m);
  const klQM = klDivergence(q, m);

  const jsd = 0.5 * klPM + 0.5 * klQM;
  return Math.max(0, parseFloat(jsd.toFixed(6)));
}

/**
 * Computes Jensen-Shannon Similarity: S_JS(P, Q) = 1.0 - \sqrt{JSD(P, Q)}
 * Bounded strictly in [0.0, 1.0]. S_JS(P, P) = 1.0, S_JS(P, Q) = S_JS(Q, P).
 */
export function jensenShannonSimilarity(p: number[], q: number[]): number {
  const jsd = jensenShannonDivergence(p, q);
  const sim = Math.max(0, Math.min(1, 1.0 - Math.sqrt(jsd)));
  return parseFloat(sim.toFixed(4));
}

/**
 * Computes Cosine Similarity between two dictionary-based sparse vectors.
 * cos(A, B) = (A . B) / (||A||_2 * ||B||_2)
 */
export function cosineSimilarityMap(vecA: Record<string, number>, vecB: Record<string, number>): number {
  const keysA = Object.keys(vecA);
  const keysB = Object.keys(vecB);
  if (keysA.length === 0 || keysB.length === 0) return 0.0;

  const allKeys = new Set([...keysA, ...keysB]);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const k of allKeys) {
    const valA = vecA[k] || 0;
    const valB = vecB[k] || 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0.0;
  const sim = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return parseFloat(Math.min(1.0, Math.max(0.0, sim)).toFixed(4));
}

/**
 * Computes Log-Ratio Similarity between two positive scalar quantities (e.g. mean inter-event time).
 * S = exp(-|ln(a) - ln(b)| / sigma_ref)
 */
export function logRatioSimilarity(valA: number, valB: number, sigmaRef: number = 2.0): number {
  if (valA <= 0 || valB <= 0) return valA === valB ? 1.0 : 0.0;
  const deltaLog = Math.abs(Math.log(valA) - Math.log(valB));
  const sim = Math.exp(-deltaLog / sigmaRef);
  return parseFloat(sim.toFixed(4));
}

/**
 * Computes ratio similarity: min(A, B) / max(A, B) for positive rates.
 */
export function ratioSimilarity(valA: number, valB: number): number {
  if (valA === 0 && valB === 0) return 1.0;
  if (valA === 0 || valB === 0) return 0.0;
  const sim = Math.min(valA, valB) / Math.max(valA, valB);
  return parseFloat(sim.toFixed(4));
}

/**
 * Computes Jaccard Similarity between two sets of string tokens / counterparties.
 */
export function jaccardSimilaritySets(setA: string[], setB: string[]): number {
  const sA = new Set(setA);
  const sB = new Set(setB);
  if (sA.size === 0 && sB.size === 0) return 1.0;
  if (sA.size === 0 || sB.size === 0) return 0.0;

  const intersection = setA.filter((x) => sB.has(x));
  const union = new Set([...setA, ...setB]);

  return parseFloat((intersection.length / union.size).toFixed(4));
}

/**
 * Computes exact Adamic-Adar Index between two sets with degree map:
 * AA(A, B) = \sum_{z \in \Gamma(A) \cap \Gamma(B)} \frac{1}{\ln(\deg(z))}
 * 
 * Missing Degree Policy: If deg(z) is undefined or unobserved in degreesMap,
 * the term is strictly skipped without assuming or inventing an artificial degree.
 * If deg(z) <= 1, it is skipped as ln(1) = 0.
 */
export function adamicAdarIndexSets(setA: string[], setB: string[], degreesMap: Record<string, number> = {}): number {
  const sB = new Set(setB);
  const common = setA.filter((x) => sB.has(x));

  let aa = 0;
  for (const z of common) {
    const deg = degreesMap[z];
    if (deg !== undefined && deg > 1) {
      aa += 1.0 / Math.log(deg);
    }
  }
  return parseFloat(aa.toFixed(4));
}
