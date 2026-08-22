import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';

export const CANONICAL_CATEGORIES = [
  'Drugs',
  'Fraud_Financial',
  'Services_Escrow',
  'Digital_Goods',
  'Security_PGP',
  'General_Other',
] as const;

export type CanonicalCategory = (typeof CANONICAL_CATEGORIES)[number];

export function mapMarketCategoryToCanonical(cid: number, categoryName: string): CanonicalCategory {
  const name = (categoryName || '').toLowerCase();
  if (
    cid === 2 ||
    (cid >= 7 && cid <= 33) ||
    name.includes('drug') ||
    name.includes('cannabis') ||
    name.includes('weed') ||
    name.includes('hash') ||
    name.includes('stimulant') ||
    name.includes('cocaine') ||
    name.includes('ecstasy') ||
    name.includes('mdma') ||
    name.includes('opioid') ||
    name.includes('benzo') ||
    name.includes('psychedelic') ||
    name.includes('steroid') ||
    name.includes('prescription') ||
    name.includes('dissociative')
  ) {
    return 'Drugs';
  }

  if (
    name.includes('fraud') ||
    name.includes('carding') ||
    name.includes('cvv') ||
    name.includes('fullz') ||
    name.includes('bank') ||
    name.includes('counterfeit') ||
    name.includes('paypal') ||
    name.includes('transfer') ||
    name.includes('dump') ||
    name.includes('account')
  ) {
    return 'Fraud_Financial';
  }

  if (
    name.includes('service') ||
    name.includes('hosting') ||
    name.includes('vpn') ||
    name.includes('socks') ||
    name.includes('escrow') ||
    name.includes('custom')
  ) {
    return 'Services_Escrow';
  }

  if (
    cid === 3 ||
    name.includes('guide') ||
    name.includes('tutorial') ||
    name.includes('ebook') ||
    name.includes('digital') ||
    name.includes('software') ||
    name.includes('exploit') ||
    name.includes('data')
  ) {
    return 'Digital_Goods';
  }

  if (
    name.includes('security') ||
    name.includes('pgp') ||
    name.includes('encrypt') ||
    name.includes('key') ||
    name.includes('opsec')
  ) {
    return 'Security_PGP';
  }

  return 'General_Other';
}

export interface InterEventStats {
  meanHours: number;
  stdHours: number;
  medianHours: number;
  minHours: number;
  maxHours: number;
  p25Hours: number;
  p75Hours: number;
  p95Hours: number;
  logNormalMu: number;
  logNormalSigma: number;
  intervalsCount: number;
}

export interface CadenceStats {
  totalEvents: number;
  activeDaysCount: number;
  activeWeeksCount: number;
  eventsPerActiveWeek: number;
  activeDaysPerActiveWeek: number;
  inactivityGapMaxDays: number;
  inactivityGapMeanDays: number;
}

export interface BehaviorProfileData {
  entityId: string;
  entityName: string;
  entityType: 'VENDOR' | 'USER';
  status: 'VALID_PROFILE' | 'INSUFFICIENT_DATA';
  profileVersion: '1.0.0-behavior';
  generatedAt: string;
  activityHours24: number[]; // 24-bin normalized histogram (sum = 1.0)
  interEventStats: InterEventStats;
  cadence: CadenceStats;
  categoryDistribution: Record<string, number>;
  primaryCategory: string;
  reputation: {
    approvalRating: number;
    positiveFeedback: number;
    neutralFeedback: number;
    negativeFeedback: number;
    sales: number;
    pgpPresent: boolean;
  };
  graph: {
    degree: number;
    weightedDegree: number;
    counterparties: string[];
  };
  provenance: {
    datasetId: string;
    datasetVersion: string;
    sourceFiles: string[];
    matchedSourceRows: number;
  };
}

export const MIN_EVENTS_THRESHOLD = 5;
export const MIN_ACTIVE_DAYS_THRESHOLD = 2;

/**
 * Computes exact Inter-Event Statistics from sorted timestamps.
 */
export function computeInterEventStats(timestamps: Date[]): InterEventStats {
  if (timestamps.length < 2) {
    return {
      meanHours: 0,
      stdHours: 0,
      medianHours: 0,
      minHours: 0,
      maxHours: 0,
      p25Hours: 0,
      p75Hours: 0,
      p95Hours: 0,
      logNormalMu: 0,
      logNormalSigma: 0,
      intervalsCount: 0,
    };
  }

  const intervalsHours: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    const deltaMs = timestamps[i].getTime() - timestamps[i - 1].getTime();
    intervalsHours.push(Math.max(0.001, deltaMs / (1000 * 3600)));
  }

  intervalsHours.sort((a, b) => a - b);
  const count = intervalsHours.length;
  const mean = intervalsHours.reduce((a, b) => a + b, 0) / count;
  const variance = intervalsHours.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / count;
  const std = Math.sqrt(variance);

  const min = intervalsHours[0];
  const max = intervalsHours[count - 1];
  const median = intervalsHours[Math.floor(count * 0.5)];
  const p25 = intervalsHours[Math.floor(count * 0.25)];
  const p75 = intervalsHours[Math.floor(count * 0.75)];
  const p95 = intervalsHours[Math.floor(count * 0.95)];

  // Log-normal parameters
  const logValues = intervalsHours.map((v) => Math.log(v));
  const logMean = logValues.reduce((a, b) => a + b, 0) / count;
  const logVar = logValues.reduce((a, b) => a + Math.pow(b - logMean, 2), 0) / count;
  const logStd = Math.sqrt(logVar);

  return {
    meanHours: parseFloat(mean.toFixed(4)),
    stdHours: parseFloat(std.toFixed(4)),
    medianHours: parseFloat(median.toFixed(4)),
    minHours: parseFloat(min.toFixed(4)),
    maxHours: parseFloat(max.toFixed(4)),
    p25Hours: parseFloat(p25.toFixed(4)),
    p75Hours: parseFloat(p75.toFixed(4)),
    p95Hours: parseFloat(p95.toFixed(4)),
    logNormalMu: parseFloat(logMean.toFixed(4)),
    logNormalSigma: parseFloat(logStd.toFixed(4)),
    intervalsCount: count,
  };
}

export function getISOWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

/**
 * Computes exact weekly cadence and active days statistics.
 */
export function computeCadenceStats(timestamps: Date[]): CadenceStats {
  if (timestamps.length === 0) {
    return {
      totalEvents: 0,
      activeDaysCount: 0,
      activeWeeksCount: 0,
      eventsPerActiveWeek: 0,
      activeDaysPerActiveWeek: 0,
      inactivityGapMaxDays: 0,
      inactivityGapMeanDays: 0,
    };
  }

  const dayKeys = new Set<string>();
  const weekKeys = new Map<string, Set<string>>(); // weekKey -> Set of dayKeys

  for (const d of timestamps) {
    const dayStr = d.toISOString().split('T')[0];
    dayKeys.add(dayStr);

    const weekKey = getISOWeekKey(d);
    if (!weekKeys.has(weekKey)) {
      weekKeys.set(weekKey, new Set<string>());
    }
    weekKeys.get(weekKey)!.add(dayStr);
  }

  const activeDays = dayKeys.size;
  const activeWeeks = weekKeys.size;
  const eventsPerWeek = activeWeeks > 0 ? timestamps.length / activeWeeks : 0;

  let totalDaysInActiveWeeks = 0;
  for (const daysSet of weekKeys.values()) {
    totalDaysInActiveWeeks += daysSet.size;
  }
  const activeDaysPerWeek = activeWeeks > 0 ? totalDaysInActiveWeeks / activeWeeks : 0;

  // Inactivity gaps
  const sortedDays = Array.from(dayKeys).sort();
  const gapsDays: number[] = [];
  for (let i = 1; i < sortedDays.length; i++) {
    const d1 = new Date(sortedDays[i - 1]).getTime();
    const d2 = new Date(sortedDays[i]).getTime();
    const gap = (d2 - d1) / (1000 * 3600 * 24);
    if (gap > 1) {
      gapsDays.push(gap);
    }
  }

  const maxGap = gapsDays.length > 0 ? Math.max(...gapsDays) : 0;
  const meanGap = gapsDays.length > 0 ? gapsDays.reduce((a, b) => a + b, 0) / gapsDays.length : 0;

  return {
    totalEvents: timestamps.length,
    activeDaysCount: activeDays,
    activeWeeksCount: activeWeeks,
    eventsPerActiveWeek: parseFloat(eventsPerWeek.toFixed(2)),
    activeDaysPerActiveWeek: parseFloat(activeDaysPerWeek.toFixed(2)),
    inactivityGapMaxDays: parseFloat(maxGap.toFixed(2)),
    inactivityGapMeanDays: parseFloat(meanGap.toFixed(2)),
  };
}

/**
 * Computes normalized 24-bin activity histogram (sum = 1.0).
 */
export function computeActivityHoursHistogram(timestamps: Date[]): number[] {
  const bins = new Array(24).fill(0);
  if (timestamps.length === 0) return bins;

  for (const d of timestamps) {
    bins[d.getUTCHours()]++;
  }

  const total = timestamps.length;
  const normalized = bins.map((c) => parseFloat((c / total).toFixed(4)));

  // Ensure exact sum = 1.0 by adjusting largest bin slightly if rounding occurs
  const currentSum = normalized.reduce((a, b) => a + b, 0);
  const diff = 1.0 - currentSum;
  if (Math.abs(diff) > 0 && Math.abs(diff) < 0.05) {
    const maxIdx = normalized.indexOf(Math.max(...normalized));
    normalized[maxIdx] = parseFloat((normalized[maxIdx] + diff).toFixed(4));
  }

  return normalized;
}

/**
 * Loads category mapping dictionary from market/categories.tsv.
 */
export function loadCategoryMap(extractedDir: string): Map<number, string> {
  const catMap = new Map<number, string>();
  const catFile = path.join(extractedDir, 'market', 'categories.tsv');
  if (fs.existsSync(catFile)) {
    const lines = fs.readFileSync(catFile, 'utf8').split('\n').filter(Boolean);
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split('\t');
      const cid = parseInt(cols[0], 10);
      const name = cols[1]?.trim() || `Category_${cid}`;
      if (!isNaN(cid)) {
        catMap.set(cid, name);
      }
    }
  }
  return catMap;
}

/**
 * Loads graph communication / interaction degrees from network/edges-*.tsv.
 */
export async function loadGraphEdges(extractedDir: string, uidOrVid: string): Promise<{ degree: number; weightedDegree: number; counterparties: string[] }> {
  const networkDir = path.join(extractedDir, 'network');
  if (!fs.existsSync(networkDir)) {
    return { degree: 0, weightedDegree: 0, counterparties: [] };
  }

  const edgeFiles = fs.readdirSync(networkDir).filter((f) => f.startsWith('edges-') && f.endsWith('.tsv'));
  const counterpartiesSet = new Set<string>();
  let weightedDegree = 0;

  for (const ef of edgeFiles) {
    const filePath = path.join(networkDir, ef);
    const stream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    let isHeader = true;
    for await (const line of rl) {
      if (isHeader) {
        isHeader = false;
        continue;
      }
      const cols = line.split('\t');
      const src = cols[0];
      const tgt = cols[1];
      const weight = parseFloat(cols[2]) || 1.0;

      if (src === uidOrVid) {
        counterpartiesSet.add(tgt);
        weightedDegree += weight;
      } else if (tgt === uidOrVid) {
        counterpartiesSet.add(src);
        weightedDegree += weight;
      }
    }
  }

  return {
    degree: counterpartiesSet.size,
    weightedDegree: parseFloat(weightedDegree.toFixed(2)),
    counterparties: Array.from(counterpartiesSet),
  };
}
