import fs from 'node:fs';
import path from 'node:path';

// ============================================================
// DETERMINISTIC FEATURE EXTRACTION ENGINE (PHASE 2 FOUNDATION)
// ============================================================

export interface StylometricFeatures {
  featureVersion: string;
  charNgrams2: Record<string, number>;
  charNgrams3: Record<string, number>;
  wordNgrams1: Record<string, number>;
  functionWordFreqs: Record<string, number>;
  punctuationDensity: Record<string, number>;
  sentenceStats: {
    meanLengthWords: number;
    meanLengthChars: number;
    sentenceCount: number;
  };
}

export interface BehaviorFeatures {
  featureVersion: string;
  timeOfDayHistogram24: number[]; // 24 bins normalized to sum = 1.0
  interEventStatsHours: {
    mean: number;
    std: number;
    min: number;
    max: number;
  };
  cadenceWeekly: number;
}

export interface GraphFeatures {
  featureVersion: string;
  commonNeighborsCount: number;
  jaccardSimilarity: number;
  adamicAdarIndex: number;
}

export interface NetworkFeatures {
  featureVersion: string;
  portDistribution: Record<string, number>;
  synRateMean: number;
}

const FUNCTION_WORDS = [
  'the', 'and', 'of', 'to', 'a', 'in', 'that', 'is', 'was', 'for',
  'on', 'with', 'as', 'by', 'at', 'from', 'this', 'be', 'or', 'an',
  'if', 'not', 'you', 'we', 'all', 'our', 'your', 'please', 'if'
];

export function extractStylometricFeatures(text: string): StylometricFeatures {
  const clean = text.toLowerCase().trim();
  const chars = clean.split('');
  const totalChars = Math.max(1, chars.length);

  // 1. Char N-grams
  const char2: Record<string, number> = {};
  for (let i = 0; i < chars.length - 1; i++) {
    const gram = clean.substring(i, i + 2);
    char2[gram] = (char2[gram] || 0) + 1;
  }
  for (const k in char2) char2[k] = parseFloat((char2[k] / (chars.length - 1 || 1)).toFixed(5));

  const char3: Record<string, number> = {};
  for (let i = 0; i < chars.length - 2; i++) {
    const gram = clean.substring(i, i + 3);
    char3[gram] = (char3[gram] || 0) + 1;
  }
  for (const k in char3) char3[k] = parseFloat((char3[k] / (chars.length - 2 || 1)).toFixed(5));

  // 2. Word unigrams
  const words = clean.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const totalWords = Math.max(1, words.length);
  const word1: Record<string, number> = {};
  for (const w of words) {
    word1[w] = (word1[w] || 0) + 1;
  }
  for (const k in word1) word1[k] = parseFloat((word1[k] / totalWords).toFixed(5));

  // 3. Function words
  const funcWords: Record<string, number> = {};
  for (const fw of FUNCTION_WORDS) {
    const count = words.filter((w) => w === fw).length;
    funcWords[fw] = parseFloat((count / totalWords).toFixed(5));
  }

  // 4. Punctuation density
  const puncts = [',', '.', '!', '?', ';', ':', '-', '(', ')', '"', '\''];
  const punctDensity: Record<string, number> = {};
  for (const p of puncts) {
    const count = (text.match(new RegExp('\\' + p, 'g')) || []).length;
    punctDensity[p] = parseFloat((count / totalChars).toFixed(5));
  }

  // 5. Sentence statistics
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const sentCount = Math.max(1, sentences.length);
  const sentLengthsWords = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const sentLengthsChars = sentences.map((s) => s.length);
  const meanWords = sentLengthsWords.reduce((a, b) => a + b, 0) / sentCount;
  const meanChars = sentLengthsChars.reduce((a, b) => a + b, 0) / sentCount;

  return {
    featureVersion: '1.0.0-stylometry',
    charNgrams2: char2,
    charNgrams3: char3,
    wordNgrams1: word1,
    functionWordFreqs: funcWords,
    punctuationDensity: punctDensity,
    sentenceStats: {
      meanLengthWords: parseFloat(meanWords.toFixed(2)),
      meanLengthChars: parseFloat(meanChars.toFixed(2)),
      sentenceCount: sentCount,
    },
  };
}

export function extractBehaviorFeatures(timestampsIso: string[]): BehaviorFeatures {
  const hist = new Array(24).fill(0);
  const dates = timestampsIso.map((ts) => new Date(ts)).sort((a, b) => a.getTime() - b.getTime());

  for (const d of dates) {
    const hr = d.getUTCHours();
    hist[hr]++;
  }
  const total = Math.max(1, dates.length);
  const normHist = hist.map((c) => parseFloat((c / total).toFixed(4)));

  const deltasHours: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const delta = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 3600);
    deltasHours.push(delta);
  }

  let mean = 0;
  let std = 0;
  if (deltasHours.length > 0) {
    mean = deltasHours.reduce((a, b) => a + b, 0) / deltasHours.length;
    const variance = deltasHours.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / deltasHours.length;
    std = Math.sqrt(variance);
  }

  return {
    featureVersion: '1.0.0-behavior',
    timeOfDayHistogram24: normHist,
    interEventStatsHours: {
      mean: parseFloat(mean.toFixed(2)),
      std: parseFloat(std.toFixed(2)),
      min: deltasHours.length ? parseFloat(Math.min(...deltasHours).toFixed(2)) : 0,
      max: deltasHours.length ? parseFloat(Math.max(...deltasHours).toFixed(2)) : 0,
    },
    cadenceWeekly: parseFloat(((dates.length / Math.max(1, (dates[dates.length - 1]?.getTime() - dates[0]?.getTime() || 1) / (1000 * 3600 * 24 * 7))) || 1).toFixed(2)),
  };
}

export function extractGraphFeatures(neighborsA: string[], neighborsB: string[]): GraphFeatures {
  const setA = new Set(neighborsA);
  const setB = new Set(neighborsB);
  const common = neighborsA.filter((n) => setB.has(n));
  const union = new Set([...neighborsA, ...neighborsB]);

  const jaccard = union.size > 0 ? common.length / union.size : 0;
  // Adamic-Adar: sum 1 / log(|N(w)|)
  let adamicAdar = 0;
  for (const c of common) {
    adamicAdar += 1 / Math.log(Math.max(2, 3)); // placeholder log degree
  }

  return {
    featureVersion: '1.0.0-graph',
    commonNeighborsCount: common.length,
    jaccardSimilarity: parseFloat(jaccard.toFixed(4)),
    adamicAdarIndex: parseFloat(adamicAdar.toFixed(4)),
  };
}

// CLI runner to process fixtures into research-data/processed/
if (process.argv[1] && process.argv[1].includes('extract_features')) {
  console.log('============================================================');
  console.log('WOLVERINE INTELLIGENCE — FEATURE EXTRACTION PIPELINE');
  console.log('============================================================\n');

  const baseDir = path.resolve('research-data');

  // 1. Process VeriDark text pairs
  const veridarkFixtures = path.join(baseDir, 'veridark', 'fixtures', 'sample-authorship-pairs.json');
  if (fs.existsSync(veridarkFixtures)) {
    const pairs = JSON.parse(fs.readFileSync(veridarkFixtures, 'utf8'));
    const processedPairs = pairs.map((p: any) => {
      const featA = extractStylometricFeatures(p.text_sample_a);
      const featB = extractStylometricFeatures(p.text_sample_b);
      return {
        pairId: p.pair_id,
        authorA: p.author_a,
        authorB: p.author_b,
        sameAuthor: p.same_author,
        featuresA: featA,
        featuresB: featB,
      };
    });
    const outPath = path.join(baseDir, 'veridark', 'processed', 'authorship-feature-pairs.json');
    fs.writeFileSync(outPath, JSON.stringify(processedPairs, null, 2) + '\n', 'utf8');
    console.log(`• Extracted stylometric features for ${pairs.length} VeriDark text pairs -> ${path.relative(process.cwd(), outPath)}`);
  }

  // 2. Process Evolution timestamps
  const evoListings = path.join(baseDir, 'evolution', 'fixtures', 'sample-listings.json');
  if (fs.existsSync(evoListings)) {
    const listings = JSON.parse(fs.readFileSync(evoListings, 'utf8'));
    const timestamps = listings.map((l: any) => l.timestamp);
    const behaviorFeats = extractBehaviorFeatures(timestamps);
    const outPath = path.join(baseDir, 'evolution', 'processed', 'vendor-behavior-features.json');
    fs.writeFileSync(outPath, JSON.stringify(behaviorFeats, null, 2) + '\n', 'utf8');
    console.log(`• Extracted behavioral features for Evolution vendor timestamps -> ${path.relative(process.cwd(), outPath)}`);
  }

  console.log('\n============================================================');
  console.log('FEATURE EXTRACTION COMPLETE: Deterministic artifacts saved.');
  console.log('============================================================');
}
