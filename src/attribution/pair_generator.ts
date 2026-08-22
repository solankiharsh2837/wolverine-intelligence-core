import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { AttributionPair, PairSplit, PairType } from './types.js';
import { ATTRIBUTION_FEATURE_ORDER, extractAttributionFeatures } from './feature_extractor.js';
import { EvolutionBehaviorProfiler } from '../behavior/profiler.js';
import { BehaviorProfileData } from '../behavior/extractor.js';

interface RawMatchRecord {
  matchId: number;
  username: string;
  uid: string;
  vid: string;
}

export class AttributionPairGenerator {
  private extractedDir: string;
  private profiler: EvolutionBehaviorProfiler;

  constructor(extractedDir?: string) {
    this.extractedDir = extractedDir || path.resolve('research-data/evolution/extracted');
    this.profiler = new EvolutionBehaviorProfiler(this.extractedDir);
  }

  /**
   * Deterministically assigns a match ID / cluster to a split to eliminate leakage.
   */
  public getSplitForMatchId(matchId: number): PairSplit {
    const hash = crypto.createHash('sha256').update(`match_cluster_${matchId}`).digest('hex');
    const bucket = parseInt(hash.substring(0, 4), 16) % 100;
    if (bucket < 70) return 'TRAIN';
    if (bucket < 85) return 'VALIDATION';
    return 'TEST';
  }

  /**
   * Loads verified ground-truth match records from forum-market/user-matching.tsv.
   */
  public async loadGroundTruthMatches(limit: number = 300): Promise<RawMatchRecord[]> {
    const matchPath = path.join(this.extractedDir, 'forum-market', 'user-matching.tsv');
    const matches: RawMatchRecord[] = [];

    if (!fs.existsSync(matchPath)) {
      throw new Error(`Ground truth matching file not found: ${matchPath}`);
    }

    const stream = fs.createReadStream(matchPath);
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    let isHeader = true;
    for await (const line of rl) {
      if (isHeader) {
        isHeader = false;
        continue;
      }
      const cols = line.split('\t');
      const matchId = parseInt(cols[0], 10);
      const username = cols[1];
      const uid = cols[2];
      const vid = cols[3];

      if (!isNaN(matchId) && username && uid && vid) {
        matches.push({ matchId, username, uid, vid });
        if (matches.length >= limit) break;
      }
    }

    return matches;
  }

  /**
   * Constructs genuine cross-subsystem attribution pairs (Forum User UID <-> Marketplace Vendor VID)
   * with ZERO self-pairs (entityA.id !== entityB.id).
   */
  public async generatePairsDataset(
    targetMatchesToProfile: number = 40
  ): Promise<{ pairs: AttributionPair[]; insufficientDataCount: number }> {
    const rawMatches = await this.loadGroundTruthMatches(targetMatchesToProfile * 3);
    const pairs: AttributionPair[] = [];
    const seenPairs = new Set<string>();
    let insufficientDataCount = 0;

    // 1. Profile both the Forum Persona and Vendor Persona for each ground-truth match
    const validMatches: {
      match: RawMatchRecord;
      forumProfile: BehaviorProfileData;
      vendorProfile: BehaviorProfileData;
    }[] = [];

    console.log(`[AttributionPairGenerator] Extracting cross-subsystem profiles (Forum UID <-> Market VID)...`);

    for (const match of rawMatches) {
      if (validMatches.length >= targetMatchesToProfile) break;
      try {
        const forumProf = await this.profiler.profileForumUser(match.uid);
        const vendorProf = await this.profiler.profileVendor(match.vid);

        if (forumProf.status === 'VALID_PROFILE' && vendorProf.status === 'VALID_PROFILE') {
          validMatches.push({ match, forumProfile: forumProf, vendorProfile: vendorProf });
          console.log(`  ✔ Cross-subsystem match ${match.matchId} (${match.username}): Forum UID ${match.uid} (${forumProf.cadence.totalEvents} posts) <-> Vendor VID ${match.vid} (${vendorProf.cadence.totalEvents} listings)`);
        } else {
          insufficientDataCount++;
        }
      } catch (err: any) {
        insufficientDataCount++;
      }
    }

    console.log(`[AttributionPairGenerator] Profiled ${validMatches.length} valid cross-subsystem match pairs (${insufficientDataCount} sparse pairs skipped).`);

    const addPair = (
      profA: BehaviorProfileData,
      profB: BehaviorProfileData,
      matchIdA: number,
      isSameActor: boolean,
      pairType: PairType,
      features: number[],
      notes: string
    ) => {
      // Invariant: ZERO self-pairs!
      assert.notEqual(profA.entityId, profB.entityId, `Self-pairing is strictly prohibited: ${profA.entityId}`);

      const key1 = `${profA.entityId}:::${profB.entityId}`;
      const key2 = `${profB.entityId}:::${profA.entityId}`;
      if (seenPairs.has(key1) || seenPairs.has(key2)) return;
      seenPairs.add(key1);

      const split = this.getSplitForMatchId(matchIdA);
      const pairId = `pair_${split.toLowerCase()}_${pairs.length + 1}`;

      pairs.push({
        pairId,
        entityA: { id: profA.entityId, name: profA.entityName, type: profA.entityType },
        entityB: { id: profB.entityId, name: profB.entityName, type: profB.entityType },
        label: isSameActor ? 'SAME_ACTOR' : 'DIFFERENT_ACTOR',
        numericLabel: isSameActor ? 1 : 0,
        pairType,
        labelSource: 'Evolution Zenodo 10156522: forum-market/user-matching.tsv',
        datasetId: 'evolution-2014-2015',
        datasetVersion: '1.0.0',
        split,
        featureVersion: '1.0.0',
        features,
        featureNames: ATTRIBUTION_FEATURE_ORDER,
        provenance: {
          matchId: matchIdA,
          sourceFiles: ['forum-market/user-matching.tsv', 'forum/post.tsv', 'market/vendors.tsv', 'market/listings.tsv'],
          createdAt: new Date().toISOString(),
        },
        notes,
      });
    };

    // 2. Positive Pairs (Genuine Cross-Subsystem Match: Forum UID A <-> Vendor VID B, same match_id)
    for (const item of validMatches) {
      const realFeatures = extractAttributionFeatures(item.forumProfile, item.vendorProfile);
      addPair(
        item.forumProfile,
        item.vendorProfile,
        item.match.matchId,
        true,
        'POSITIVE_GROUND_TRUTH_MATCH',
        realFeatures,
        `Verified cross-subsystem match_id ${item.match.matchId} (Forum UID ${item.match.uid} <-> Market VID ${item.match.vid})`
      );
    }

    // 3. Negative Pairs (Forum UID A vs Vendor VID B, different match_id)
    for (let i = 0; i < validMatches.length; i++) {
      for (let j = 0; j < validMatches.length; j++) {
        if (i === j) continue;
        const itemA = validMatches[i];
        const itemB = validMatches[j];

        if (itemA.match.matchId === itemB.match.matchId) continue;

        // Cross-subsystem comparison between different actors
        const realFeatures = extractAttributionFeatures(itemA.forumProfile, itemB.vendorProfile);
        const activityJS = realFeatures[0];
        const interEventLog = realFeatures[1];
        const categoryCosine = realFeatures[3];
        // Measured hard negative: distinct actors with elevated behavioral/temporal or topical similarity
        const isHardNegative = activityJS >= 0.28 || interEventLog >= 0.72 || categoryCosine >= 0.05;

        addPair(
          itemA.forumProfile,
          itemB.vendorProfile,
          itemA.match.matchId,
          false,
          isHardNegative ? 'NEGATIVE_HARD_CATEGORY_OVERLAP' : 'NEGATIVE_RANDOM',
          realFeatures,
          isHardNegative
            ? `Measured hard negative: Forum UID ${itemA.match.uid} vs Market VID ${itemB.match.vid} (match_ids ${itemA.match.matchId} vs ${itemB.match.matchId}) with elevated behavioral/temporal correlation`
            : `Cross-subsystem negative: Forum UID ${itemA.match.uid} vs Market VID ${itemB.match.vid} (match_ids ${itemA.match.matchId} vs ${itemB.match.matchId})`
        );
      }
    }

    return { pairs, insufficientDataCount };
  }
}
