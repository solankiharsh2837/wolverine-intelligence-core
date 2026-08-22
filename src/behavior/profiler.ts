import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';
import {
  BehaviorProfileData,
  computeActivityHoursHistogram,
  computeInterEventStats,
  computeCadenceStats,
  loadCategoryMap,
  loadGraphEdges,
  MIN_EVENTS_THRESHOLD,
  MIN_ACTIVE_DAYS_THRESHOLD,
} from './extractor.js';
import {
  ComponentSimilarityResult,
  jensenShannonDivergence,
  jensenShannonSimilarity,
  cosineSimilarityMap,
  logRatioSimilarity,
  ratioSimilarity,
  jaccardSimilaritySets,
  adamicAdarIndexSets,
} from './similarity.js';

export class EvolutionBehaviorProfiler {
  private extractedDir: string;
  private categoryMap: Map<number, string>;
  private scrapeDateMap: Map<number, Date>;
  private profileCache = new Map<string, BehaviorProfileData>();

  constructor(extractedDir?: string) {
    this.extractedDir = extractedDir || path.resolve('research-data/evolution/extracted');
    this.categoryMap = loadCategoryMap(this.extractedDir);
    this.scrapeDateMap = this.loadScrapeDates();
  }

  private loadScrapeDates(): Map<number, Date> {
    const dates = new Map<number, Date>();
    const scrapesPath = path.join(this.extractedDir, 'market', 'scrapes.tsv');
    if (fs.existsSync(scrapesPath)) {
      const lines = fs.readFileSync(scrapesPath, 'utf8').split('\n').filter(Boolean);
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split('\t');
        const sid = parseInt(cols[0], 10);
        const y = parseInt(cols[1], 10);
        const m = parseInt(cols[2], 10);
        const d = parseInt(cols[3], 10);
        if (!isNaN(sid) && !isNaN(y) && !isNaN(m) && !isNaN(d)) {
          dates.set(sid, new Date(Date.UTC(y, m - 1, d, 12, 0, 0)));
        }
      }
    }
    return dates;
  }

  /**
   * Profiles an Evolution marketplace vendor by vid or username.
   */
  public async profileVendor(vidOrUsername: string, bypassCache = false): Promise<BehaviorProfileData> {
    const cacheKey = vidOrUsername.toLowerCase();
    if (!bypassCache && this.profileCache.has(cacheKey)) {
      return this.profileCache.get(cacheKey)!;
    }

    const vendorsPath = path.join(this.extractedDir, 'market', 'vendors.tsv');
    const listingsPath = path.join(this.extractedDir, 'market', 'listings.tsv');

    let matchedVid = '';
    let matchedUsername = '';
    let rank = 'Unknown';
    let approvalRating = 100.0;
    let posFeedback = 0;
    let neuFeedback = 0;
    let negFeedback = 0;
    let sales = 0;
    let pgpPresent = false;
    let matchedVendorRows = 0;

    // 1. Scan vendors.tsv
    const vStream = fs.createReadStream(vendorsPath);
    const vRl = readline.createInterface({ input: vStream, crlfDelay: Infinity });

    let isHeader = true;
    for await (const line of vRl) {
      if (isHeader) {
        isHeader = false;
        continue;
      }
      const cols = line.split('\t');
      const vid = cols[0];
      const username = cols[2];

      if (vid === vidOrUsername || (username && username.toLowerCase() === vidOrUsername.toLowerCase())) {
        matchedVid = vid;
        matchedUsername = username || `Vendor_${vid}`;
        rank = cols[3] || rank;
        approvalRating = parseFloat(cols[5]) || approvalRating;
        posFeedback = Math.max(posFeedback, parseInt(cols[6], 10) || 0);
        neuFeedback = Math.max(neuFeedback, parseInt(cols[7], 10) || 0);
        negFeedback = Math.max(negFeedback, parseInt(cols[8], 10) || 0);
        sales = Math.max(sales, parseInt(cols[4], 10) || parseInt(cols[9], 10) || 0);
        if (cols[10]?.includes('PGP')) pgpPresent = true;
        matchedVendorRows++;
      }
    }

    if (!matchedVid) {
      throw new Error(`Vendor not found in Evolution dataset: ${vidOrUsername}`);
    }

    // 2. Scan listings.tsv for event timestamps & categories
    const timestamps: Date[] = [];
    const categoryCounts: Record<string, number> = {};
    let matchedListingRows = 0;

    const lStream = fs.createReadStream(listingsPath);
    const lRl = readline.createInterface({ input: lStream, crlfDelay: Infinity });

    let isLHeader = true;
    for await (const line of lRl) {
      if (isLHeader) {
        isLHeader = false;
        continue;
      }
      const cols = line.split('\t');
      if (cols[1] === matchedVid) {
        matchedListingRows++;
        const mscrapeId = parseInt(cols[2], 10);
        const scrapeDate = this.scrapeDateMap.get(mscrapeId);
        if (scrapeDate) {
          timestamps.push(scrapeDate);
        }

        const cid = parseInt(cols[6], 10);
        const catName = this.categoryMap.get(cid) || 'Uncategorized';
        categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
      }
    }

    // 3. Scan forum/post.tsv for forum activity timestamps (matching username in forum/user.tsv)
    const forumTimestamps = await this.scanForumActivity(matchedUsername);
    timestamps.push(...forumTimestamps);

    // Sort all timestamps chronologically
    timestamps.sort((a, b) => a.getTime() - b.getTime());

    // 4. Graph telemetry
    const graphData = await loadGraphEdges(this.extractedDir, matchedVid);

    // 5. Extract feature vectors
    const activityHours24 = computeActivityHoursHistogram(timestamps);
    const interEventStats = computeInterEventStats(timestamps);
    const cadence = computeCadenceStats(timestamps);

    // Category distribution normalization
    const totalCatObservations = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    const normalizedCategories: Record<string, number> = {};
    let primaryCategory = 'None';
    let maxCatCount = 0;

    for (const [k, count] of Object.entries(categoryCounts)) {
      normalizedCategories[k] = parseFloat((count / (totalCatObservations || 1)).toFixed(4));
      if (count > maxCatCount) {
        maxCatCount = count;
        primaryCategory = k;
      }
    }

    const isSparse = timestamps.length < MIN_EVENTS_THRESHOLD || cadence.activeDaysCount < MIN_ACTIVE_DAYS_THRESHOLD;

    const result: BehaviorProfileData = {
      entityId: `evo_vendor_${matchedVid}`,
      entityName: matchedUsername,
      entityType: 'VENDOR',
      status: isSparse ? 'INSUFFICIENT_DATA' : 'VALID_PROFILE',
      profileVersion: '1.0.0-behavior',
      generatedAt: new Date().toISOString(),
      activityHours24,
      interEventStats,
      cadence,
      categoryDistribution: normalizedCategories,
      primaryCategory,
      reputation: {
        approvalRating,
        positiveFeedback: posFeedback,
        neutralFeedback: neuFeedback,
        negativeFeedback: negFeedback,
        sales,
        pgpPresent,
      },
      graph: graphData,
      provenance: {
        datasetId: 'evolution-2014-2015',
        datasetVersion: '1.0.0',
        sourceFiles: ['market/vendors.tsv', 'market/listings.tsv', 'market/scrapes.tsv', 'forum/post.tsv'],
        matchedSourceRows: matchedVendorRows + matchedListingRows + forumTimestamps.length,
      },
    };

    this.profileCache.set(cacheKey, result);
    this.profileCache.set(matchedVid.toLowerCase(), result);
    this.profileCache.set(matchedUsername.toLowerCase(), result);

    return result;
  }

  /**
   * Scans forum posts for a matching username.
   */
  private async scanForumActivity(username: string): Promise<Date[]> {
    const userPath = path.join(this.extractedDir, 'forum', 'user.tsv');
    const postPath = path.join(this.extractedDir, 'forum', 'post.tsv');
    const matchedUids = new Set<string>();

    if (fs.existsSync(userPath)) {
      const uStream = fs.createReadStream(userPath);
      const uRl = readline.createInterface({ input: uStream, crlfDelay: Infinity });
      let isH = true;
      for await (const line of uRl) {
        if (isH) { isH = false; continue; }
        const cols = line.split('\t');
        if (cols[1] && cols[1].toLowerCase() === username.toLowerCase()) {
          matchedUids.add(cols[0]);
        }
      }
    }

    if (matchedUids.size === 0 || !fs.existsSync(postPath)) return [];

    const timestamps: Date[] = [];
    const pStream = fs.createReadStream(postPath);
    const pRl = readline.createInterface({ input: pStream, crlfDelay: Infinity });
    let isPH = true;

    for await (const line of pRl) {
      if (isPH) { isPH = false; continue; }
      const cols = line.split('\t');
      const uid = cols[7];
      if (matchedUids.has(uid)) {
        const y = parseInt(cols[3], 10);
        const m = parseInt(cols[4], 10);
        const d = parseInt(cols[5], 10);
        const timeParts = (cols[6] || '12:00:00').split(':').map((x) => parseInt(x, 10));
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          timestamps.push(new Date(Date.UTC(y, m - 1, d, timeParts[0] || 0, timeParts[1] || 0, timeParts[2] || 0)));
        }
      }
    }

    return timestamps;
  }

  /**
   * Compares two behavior profiles and outputs component-level similarities.
   */
  public compareProfiles(profileA: BehaviorProfileData, profileB: BehaviorProfileData): ComponentSimilarityResult {
    const notes: string[] = [];
    const isSparse = profileA.status === 'INSUFFICIENT_DATA' || profileB.status === 'INSUFFICIENT_DATA';
    if (isSparse) {
      notes.push('Comparison contains one or more sparse profiles (< 5 events or < 2 active days).');
    }

    // 1. Activity Hours JSD & Similarity
    const jsd = jensenShannonDivergence(profileA.activityHours24, profileB.activityHours24);
    const actSim = jensenShannonSimilarity(profileA.activityHours24, profileB.activityHours24);

    // 2. Category Cosine
    const catSim = cosineSimilarityMap(profileA.categoryDistribution, profileB.categoryDistribution);

    // 3. Inter-Event Log-Ratio
    const interSim = logRatioSimilarity(profileA.interEventStats.meanHours, profileB.interEventStats.meanHours);

    // 4. Cadence Weekly Ratio
    const cadenceSim = ratioSimilarity(profileA.cadence.eventsPerActiveWeek, profileB.cadence.eventsPerActiveWeek);

    // 5. Graph Overlap
    const graphJaccard = jaccardSimilaritySets(profileA.graph.counterparties, profileB.graph.counterparties);
    const graphAA = adamicAdarIndexSets(profileA.graph.counterparties, profileB.graph.counterparties);

    return {
      entityA: profileA.entityName,
      entityB: profileB.entityName,
      activityHourJSD: jsd,
      activityHourSimilarity: actSim,
      categoryCosineSimilarity: catSim,
      interEventLogRatioSimilarity: interSim,
      cadenceWeeklyRatioSimilarity: cadenceSim,
      graphCounterpartyJaccard: graphJaccard,
      graphAdamicAdarIndex: graphAA,
      isSparseComparison: isSparse,
      notes,
    };
  }
}
