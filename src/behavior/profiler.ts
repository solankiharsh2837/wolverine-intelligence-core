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

interface ForumPostRecord {
  tid: string;
  pid: string;
  uid: string;
  timestamp: Date;
  text: string;
}

interface VendorListingRecord {
  lid: string;
  vid: string;
  scrapeId: number;
  cid: number;
  shipsFrom: string;
  productClass: string;
}

interface VendorMetaRecord {
  vid: string;
  username: string;
  rank: string;
  approvalRating: number;
  posFeedback: number;
  neuFeedback: number;
  negFeedback: number;
  sales: number;
  pgpPresent: boolean;
  matchedVendorRows: number;
}

export class EvolutionBehaviorProfiler {
  private extractedDir: string;
  private categoryMap: Map<number, string>;
  private scrapeDateMap: Map<number, Date>;
  private profileCache = new Map<string, BehaviorProfileData>();

  private isForumIndexed = false;
  private forumIndexingPromise: Promise<void> | null = null;
  private forumUserPostsMap: Map<string, ForumPostRecord[]> = new Map();
  private forumUserMetaMap: Map<string, { uid: string; username: string; title: string; numPosts: number }> = new Map();

  private isMarketIndexed = false;
  private marketIndexingPromise: Promise<void> | null = null;
  private vendorListingsMap: Map<string, VendorListingRecord[]> = new Map();
  private vendorMetaMap: Map<string, VendorMetaRecord> = new Map();

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

  private async ensureForumIndexed(): Promise<void> {
    if (this.isForumIndexed) return;
    if (this.forumIndexingPromise) return this.forumIndexingPromise;

    this.forumIndexingPromise = (async () => {
      const userPath = path.join(this.extractedDir, 'forum', 'user.tsv');
      if (fs.existsSync(userPath)) {
        const uStream = fs.createReadStream(userPath);
        const uRl = readline.createInterface({ input: uStream, crlfDelay: Infinity });
        let isH = true;
        for await (const line of uRl) {
          if (isH) { isH = false; continue; }
          const cols = line.split('\t');
          const uid = cols[0];
          const username = cols[1];
          const title = cols[6] || '';
          const numPosts = parseInt(cols[11], 10) || 0;
          if (uid && username) {
            const rec = { uid, username, title, numPosts };
            this.forumUserMetaMap.set(uid, rec);
            this.forumUserMetaMap.set(username.toLowerCase(), rec);
          }
        }
      }

      const postPath = path.join(this.extractedDir, 'forum', 'post.tsv');
      if (fs.existsSync(postPath)) {
        const pStream = fs.createReadStream(postPath);
        const pRl = readline.createInterface({ input: pStream, crlfDelay: Infinity });
        let isH = true;
        for await (const line of pRl) {
          if (isH) { isH = false; continue; }
          const cols = line.split('\t');
          const tid = cols[0];
          const pid = cols[1];
          const y = parseInt(cols[3], 10);
          const m = parseInt(cols[4], 10);
          const d = parseInt(cols[5], 10);
          const tParts = (cols[6] || '12:00:00').split(':').map((x) => parseInt(x, 10));
          const uid = cols[7];
          const text = cols[8] || '';

          if (uid && !isNaN(y) && !isNaN(m) && !isNaN(d)) {
            const timestamp = new Date(Date.UTC(y, m - 1, d, tParts[0] || 0, tParts[1] || 0, tParts[2] || 0));
            const list = this.forumUserPostsMap.get(uid) || [];
            list.push({ tid, pid, uid, timestamp, text });
            this.forumUserPostsMap.set(uid, list);
          }
        }
      }

      this.isForumIndexed = true;
    })();

    return this.forumIndexingPromise;
  }

  private async ensureMarketIndexed(): Promise<void> {
    if (this.isMarketIndexed) return;
    if (this.marketIndexingPromise) return this.marketIndexingPromise;

    this.marketIndexingPromise = (async () => {
      const vendorsPath = path.join(this.extractedDir, 'market', 'vendors.tsv');
      if (fs.existsSync(vendorsPath)) {
        const vStream = fs.createReadStream(vendorsPath);
        const vRl = readline.createInterface({ input: vStream, crlfDelay: Infinity });
        let isH = true;
        for await (const line of vRl) {
          if (isH) { isH = false; continue; }
          const cols = line.split('\t');
          const vid = cols[0];
          const username = cols[2] || `Vendor_${vid}`;
          const rank = cols[3] || 'Unknown';
          const approvalRating = parseFloat(cols[5]) || 100.0;
          const posFeedback = parseInt(cols[6], 10) || 0;
          const neuFeedback = parseInt(cols[7], 10) || 0;
          const negFeedback = parseInt(cols[8], 10) || 0;
          const sales = parseInt(cols[4], 10) || 0;
          const pgpPresent = Boolean(cols[9] && cols[9].trim().length > 0);

          const existing = this.vendorMetaMap.get(vid);
          if (existing) {
            existing.posFeedback = Math.max(existing.posFeedback, posFeedback);
            existing.sales = Math.max(existing.sales, sales);
            existing.matchedVendorRows++;
          } else {
            const rec: VendorMetaRecord = {
              vid,
              username,
              rank,
              approvalRating,
              posFeedback,
              neuFeedback,
              negFeedback,
              sales,
              pgpPresent,
              matchedVendorRows: 1,
            };
            this.vendorMetaMap.set(vid, rec);
            this.vendorMetaMap.set(username.toLowerCase(), rec);
          }
        }
      }

      const listingsPath = path.join(this.extractedDir, 'market', 'listings.tsv');
      if (fs.existsSync(listingsPath)) {
        const lStream = fs.createReadStream(listingsPath);
        const lRl = readline.createInterface({ input: lStream, crlfDelay: Infinity });
        let isH = true;
        for await (const line of lRl) {
          if (isH) { isH = false; continue; }
          const cols = line.split('\t');
          const lid = cols[0];
          const vid = cols[1];
          const scrapeId = parseInt(cols[2], 10);
          const cid = parseInt(cols[6], 10);
          const shipsFrom = cols[7] || 'Unknown';
          const productClass = cols[9] || 'Other';

          if (vid) {
            const list = this.vendorListingsMap.get(vid) || [];
            list.push({ lid, vid, scrapeId, cid, shipsFrom, productClass });
            this.vendorListingsMap.set(vid, list);
          }
        }
      }

      this.isMarketIndexed = true;
    })();

    return this.marketIndexingPromise;
  }

  public async profileForumUser(uidOrUsername: string, bypassCache = false): Promise<BehaviorProfileData> {
    const cacheKey = `forum_${uidOrUsername.toLowerCase()}`;
    if (!bypassCache && this.profileCache.has(cacheKey)) {
      return this.profileCache.get(cacheKey)!;
    }

    await this.ensureForumIndexed();

    let meta = this.forumUserMetaMap.get(uidOrUsername.toLowerCase());
    let uid = meta?.uid || uidOrUsername;
    let username = meta?.username || `ForumUser_${uid}`;

    const posts = this.forumUserPostsMap.get(uid) || [];
    const timestamps = posts.map((p) => p.timestamp);
    const sourceFiles = ['forum/post.tsv', 'forum/user.tsv'];

    if (timestamps.length === 0) {
      const sparseResult: BehaviorProfileData = {
        entityId: `forum_user_${uid}`,
        entityName: username,
        entityType: 'USER',
        status: 'INSUFFICIENT_DATA',
        profileVersion: '1.0.0-behavior',
        generatedAt: new Date().toISOString(),
        activityHours24: new Array(24).fill(0),
        interEventStats: {
          meanHours: 0, stdHours: 0, medianHours: 0, minHours: 0, maxHours: 0,
          p25Hours: 0, p75Hours: 0, p95Hours: 0, logNormalMu: 0, logNormalSigma: 0, intervalsCount: 0,
        },
        cadence: {
          totalEvents: 0, activeDaysCount: 0, activeWeeksCount: 0,
          eventsPerActiveWeek: 0, activeDaysPerActiveWeek: 0, inactivityGapMaxDays: 0, inactivityGapMeanDays: 0,
        },
        categoryDistribution: {},
        primaryCategory: 'None',
        reputation: { approvalRating: 100, positiveFeedback: 0, neutralFeedback: 0, negativeFeedback: 0, sales: 0, pgpPresent: false },
        graph: { degree: 0, weightedDegree: 0, counterparties: [] },
        provenance: { datasetId: 'evolution-2014-2015', datasetVersion: '1.0.0', sourceFiles, matchedSourceRows: 0 },
      };
      this.profileCache.set(cacheKey, sparseResult);
      return sparseResult;
    }

    const activityHours24 = computeActivityHoursHistogram(timestamps);
    const interEventStats = computeInterEventStats(timestamps);
    const cadence = computeCadenceStats(timestamps);

    const categoryCounts: Record<string, number> = {
      Drugs: 0, Fraud: 0, Services: 0, Digital: 0, Security: 0, General: 0,
    };
    const threadCounterparties = new Set<string>();

    for (const post of posts) {
      if (post.tid) threadCounterparties.add(`thread_${post.tid}`);
      const textLower = post.text.toLowerCase();
      if (textLower.includes('weed') || textLower.includes('coke') || textLower.includes('drug') || textLower.includes('mdma') || textLower.includes('lsd') || textLower.includes('hash')) {
        categoryCounts.Drugs++;
      } else if (textLower.includes('carding') || textLower.includes('cvv') || textLower.includes('fullz') || textLower.includes('bank') || textLower.includes('transfer')) {
        categoryCounts.Fraud++;
      } else if (textLower.includes('service') || textLower.includes('escrow') || textLower.includes('hosting')) {
        categoryCounts.Services++;
      } else if (textLower.includes('ebook') || textLower.includes('digital') || textLower.includes('guide') || textLower.includes('software')) {
        categoryCounts.Digital++;
      } else if (textLower.includes('pgp') || textLower.includes('security') || textLower.includes('encrypt') || textLower.includes('key')) {
        categoryCounts.Security++;
      } else {
        categoryCounts.General++;
      }
    }

    const totalTopics = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    const categoryDistribution: Record<string, number> = {};
    let maxCat = 'General';
    let maxCount = 0;

    for (const [cat, cnt] of Object.entries(categoryCounts)) {
      if (cnt > 0) {
        categoryDistribution[cat] = parseFloat((cnt / totalTopics).toFixed(4));
        if (cnt > maxCount) {
          maxCount = cnt;
          maxCat = cat;
        }
      }
    }

    const counterparties = Array.from(threadCounterparties);
    const graph = {
      degree: counterparties.length,
      weightedDegree: posts.length,
      counterparties,
    };

    const isSparse = timestamps.length < MIN_EVENTS_THRESHOLD || cadence.activeDaysCount < MIN_ACTIVE_DAYS_THRESHOLD;

    const result: BehaviorProfileData = {
      entityId: `forum_user_${uid}`,
      entityName: username,
      entityType: 'USER',
      status: isSparse ? 'INSUFFICIENT_DATA' : 'VALID_PROFILE',
      profileVersion: '1.0.0-behavior',
      generatedAt: new Date().toISOString(),
      activityHours24,
      interEventStats,
      cadence,
      categoryDistribution,
      primaryCategory: maxCat,
      reputation: {
        approvalRating: 100,
        positiveFeedback: posts.length,
        neutralFeedback: 0,
        negativeFeedback: 0,
        sales: 0,
        pgpPresent: posts.some((p) => p.text.includes('BEGIN PGP')),
      },
      graph,
      provenance: {
        datasetId: 'evolution-2014-2015',
        datasetVersion: '1.0.0',
        sourceFiles,
        matchedSourceRows: posts.length,
      },
    };

    this.profileCache.set(cacheKey, result);
    return result;
  }

  public async profileVendor(vidOrUsername: string, bypassCache = false): Promise<BehaviorProfileData> {
    const cacheKey = `vendor_${vidOrUsername.toLowerCase()}`;
    if (!bypassCache && this.profileCache.has(cacheKey)) {
      return this.profileCache.get(cacheKey)!;
    }

    await this.ensureMarketIndexed();

    let meta = this.vendorMetaMap.get(vidOrUsername.toLowerCase());
    let vid = meta?.vid || vidOrUsername;
    let username = meta?.username || `Vendor_${vid}`;

    if (!meta) {
      throw new Error(`Vendor not found in Evolution dataset: ${vidOrUsername}`);
    }

    const listings = this.vendorListingsMap.get(vid) || [];
    const timestamps: Date[] = [];
    const categoryCounts: Record<string, number> = {};

    for (const item of listings) {
      if (this.scrapeDateMap.has(item.scrapeId)) {
        timestamps.push(this.scrapeDateMap.get(item.scrapeId)!);
      }
      const catName = this.categoryMap.get(item.cid) || 'Other';
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
    }

    if (timestamps.length === 0) {
      const forumDates = await this.scanForumActivity(username);
      timestamps.push(...forumDates);
    }

    const activityHours24 = computeActivityHoursHistogram(timestamps);
    const interEventStats = computeInterEventStats(timestamps);
    const cadence = computeCadenceStats(timestamps);

    const totalCategories = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    const categoryDistribution: Record<string, number> = {};
    let primaryCategory = 'None';
    let maxCategoryCount = 0;

    for (const [cat, count] of Object.entries(categoryCounts)) {
      categoryDistribution[cat] = parseFloat((count / (totalCategories || 1)).toFixed(4));
      if (count > maxCategoryCount) {
        maxCategoryCount = count;
        primaryCategory = cat;
      }
    }

    const graphResult = await loadGraphEdges(this.extractedDir, vid);
    const graph = {
      degree: graphResult.degree,
      weightedDegree: graphResult.weightedDegree,
      counterparties: graphResult.counterparties,
    };

    const isSparse = timestamps.length < MIN_EVENTS_THRESHOLD || cadence.activeDaysCount < MIN_ACTIVE_DAYS_THRESHOLD;

    const result: BehaviorProfileData = {
      entityId: `evo_vendor_${vid}`,
      entityName: username,
      entityType: 'VENDOR',
      status: isSparse ? 'INSUFFICIENT_DATA' : 'VALID_PROFILE',
      profileVersion: '1.0.0-behavior',
      generatedAt: new Date().toISOString(),
      activityHours24,
      interEventStats,
      cadence,
      categoryDistribution,
      primaryCategory,
      reputation: {
        approvalRating: meta.approvalRating,
        positiveFeedback: meta.posFeedback,
        neutralFeedback: meta.neuFeedback,
        negativeFeedback: meta.negFeedback,
        sales: meta.sales,
        pgpPresent: meta.pgpPresent,
      },
      graph,
      provenance: {
        datasetId: 'evolution-2014-2015',
        datasetVersion: '1.0.0',
        sourceFiles: ['market/vendors.tsv', 'market/listings.tsv', 'market/scrapes.tsv'],
        matchedSourceRows: meta.matchedVendorRows + listings.length,
      },
    };

    this.profileCache.set(cacheKey, result);
    return result;
  }

  private async scanForumActivity(username: string): Promise<Date[]> {
    await this.ensureForumIndexed();
    const meta = this.forumUserMetaMap.get(username.toLowerCase());
    if (!meta) return [];
    const posts = this.forumUserPostsMap.get(meta.uid) || [];
    return posts.map((p) => p.timestamp);
  }

  public compareProfiles(profileA: BehaviorProfileData, profileB: BehaviorProfileData): ComponentSimilarityResult {
    const notes: string[] = [];
    const isSparse = profileA.status === 'INSUFFICIENT_DATA' || profileB.status === 'INSUFFICIENT_DATA';
    if (isSparse) {
      notes.push('Comparison contains one or more sparse profiles (< 5 events or < 2 active days).');
    }

    const jsd = jensenShannonDivergence(profileA.activityHours24, profileB.activityHours24);
    const actSim = jensenShannonSimilarity(profileA.activityHours24, profileB.activityHours24);
    const catSim = cosineSimilarityMap(profileA.categoryDistribution, profileB.categoryDistribution);
    const interSim = logRatioSimilarity(profileA.interEventStats.meanHours, profileB.interEventStats.meanHours);
    const cadenceSim = ratioSimilarity(profileA.cadence.eventsPerActiveWeek, profileB.cadence.eventsPerActiveWeek);
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
