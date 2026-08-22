import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';
import crypto from 'node:crypto';

async function computeSha256Stream(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function run() {
  const baseDir = path.resolve('wolverine-intelligence/research-data/evolution');
  const rawZipPath = path.join(baseDir, 'raw', 'evolution_zenodo_10156522.zip');
  const extractedDir = path.join(baseDir, 'extracted');

  const listingsFile = path.join(extractedDir, 'market', 'listings.tsv');
  const vendorsFile = path.join(extractedDir, 'market', 'vendors.tsv');
  const categoriesFile = path.join(extractedDir, 'market', 'categories.tsv');

  console.log('[1/4] Computing SHA-256 hashes of real source files...');
  const zipHash = await computeSha256Stream(rawZipPath);
  const categoriesHash = await computeSha256Stream(categoriesFile);
  const listingsHash = await computeSha256Stream(listingsFile);
  const vendorsHash = await computeSha256Stream(vendorsFile);

  console.log(`  • Raw ZIP Hash: sha256-${zipHash}`);
  console.log(`  • Listings TSV Hash: sha256-${listingsHash}`);
  console.log(`  • Vendors TSV Hash: sha256-${vendorsHash}`);

  // 2. Extract real listing rows
  console.log('[2/4] Extracting actual listing rows...');
  const listingsStream = fs.createReadStream(listingsFile);
  const listingsRl = readline.createInterface({ input: listingsStream, crlfDelay: Infinity });
  
  const realListings: any[] = [];
  let rowIdx = 0;
  const prices: number[] = [];

  for await (const line of listingsRl) {
    if (rowIdx === 0) {
      rowIdx++;
      continue; // skip header
    }
    const cols = line.split('\t');
    if (cols.length >= 10) {
      const price = parseFloat(cols[4]);
      if (!isNaN(price) && price > 0) prices.push(price);

      if (realListings.length < 5) {
        realListings.push({
          fixture_type: "REAL_DATASET_DERIVED_FIXTURE",
          datasetId: "evolution-2014-2015",
          datasetVersion: "1.0.0",
          sourceFile: "market/listings.tsv",
          sourceFileSha256: `sha256-${listingsHash}`,
          sourceRow: rowIdx,
          lid: parseInt(cols[0], 10),
          vid: parseInt(cols[1], 10),
          mscrape_id: parseInt(cols[2], 10),
          title: cols[3],
          price_btc: price,
          description: cols[5]?.substring(0, 300) || "",
          cid: parseInt(cols[6], 10),
          ships_from: cols[7],
          ships_to: cols[8],
          product_class: cols[9],
          listing_available: cols[10] === 'True'
        });
      }
    }
    rowIdx++;
    if (rowIdx > 50000) break;
  }

  // 3. Extract real vendor rows
  console.log('[3/4] Extracting actual vendor rows...');
  const vendorsStream = fs.createReadStream(vendorsFile);
  const vendorsRl = readline.createInterface({ input: vendorsStream, crlfDelay: Infinity });
  
  const realVendors: any[] = [];
  let vRowIdx = 0;

  for await (const line of vendorsRl) {
    if (vRowIdx === 0) {
      vRowIdx++;
      continue;
    }
    const cols = line.split('\t');
    if (cols.length >= 11 && realVendors.length < 3) {
      realVendors.push({
        fixture_type: "REAL_DATASET_DERIVED_FIXTURE",
        datasetId: "evolution-2014-2015",
        datasetVersion: "1.0.0",
        sourceFile: "market/vendors.tsv",
        sourceFileSha256: `sha256-${vendorsHash}`,
        sourceRow: vRowIdx,
        vid: parseInt(cols[0], 10),
        mscrape_id: parseInt(cols[1], 10),
        username: cols[2],
        rank: cols[3],
        approval_rating: parseFloat(cols[5]) || 100.0,
        pgp_key_present: cols[10]?.includes('PGP') || false,
        disabled: cols[12] === 'True'
      });
    }
    vRowIdx++;
    if (vRowIdx > 1000) break;
  }

  // Save fixtures
  const fixturesDir = path.join(baseDir, 'fixtures');
  fs.writeFileSync(path.join(fixturesDir, 'sample-listings.json'), JSON.stringify(realListings, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(fixturesDir, 'sample-vendors.json'), JSON.stringify(realVendors, null, 2) + '\n', 'utf8');
  console.log(`Saved ${realListings.length} real listing fixtures and ${realVendors.length} real vendor fixtures.`);

  // 4. Compute REAL calibration stats from the 50,000 real listing prices
  console.log('[4/4] Computing real dataset calibration from extracted listings...');
  prices.sort((a, b) => a - b);
  const minPrice = prices[0];
  const maxPrice = prices[prices.length - 1];
  const medianPrice = prices[Math.floor(prices.length / 2)];
  const meanPrice = parseFloat((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(4));

  const calibration = {
    calibrationType: "MARKETPLACE_REAL_DATA_DISTRIBUTION",
    datasetId: "evolution-2014-2015",
    datasetVersion: "1.0.0",
    sourceFile: "market/listings.tsv",
    sourceFileSha256: `sha256-${listingsHash}`,
    calculatedAt: new Date().toISOString(),
    sampleSize: prices.length,
    distributions: {
      priceBtc: {
        min: minPrice,
        median: medianPrice,
        mean: meanPrice,
        max: maxPrice,
        p25: prices[Math.floor(prices.length * 0.25)],
        p75: prices[Math.floor(prices.length * 0.75)],
        p95: prices[Math.floor(prices.length * 0.95)]
      }
    }
  };

  fs.writeFileSync(path.resolve('wolverine-intelligence/research-data/calibration/marketplace-calibration.json'), JSON.stringify(calibration, null, 2) + '\n', 'utf8');
  console.log('Saved real calibration distribution:', calibration.distributions.priceBtc);

  // Update metadata.json with real dataset schema
  const metadata = {
    datasetId: "evolution-2014-2015",
    name: "A large-scale longitudinal structured dataset of the dark web cryptomarket Evolution (2014-2015)",
    version: "1.0.0",
    status: "ACQUIRED_RAW_ARCHIVE",
    license: "CC-BY-4.0",
    doi: "10.5281/zenodo.10156522",
    sourceUrl: "https://zenodo.org/records/10156522",
    downloadUrl: "https://zenodo.org/api/records/10156522/files/data-and-readme.zip/content",
    rawArchive: {
      filename: "evolution_zenodo_10156522.zip",
      sizeBytes: fs.statSync(rawZipPath).size,
      sha256: `sha256-${zipHash}`
    },
    tables: {
      "market/listings.tsv": {
        sha256: `sha256-${listingsHash}`,
        fields: ["lid", "vid", "mscrape_id", "title", "price", "description", "cid", "ships_from", "ships_to", "product_class", "listing_available", "return_policy"]
      },
      "market/vendors.tsv": {
        sha256: `sha256-${vendorsHash}`,
        fields: ["vid", "mscrape_id", "username", "rank", "sales", "approval_rating", "positive_feedback", "neutral_feedback", "negative_feedback", "legacy_sales", "pgp_key", "return_policy", "disabled"]
      },
      "market/categories.tsv": {
        sha256: `sha256-${categoriesHash}`,
        fields: ["cid", "category", "parent_cid"]
      }
    }
  };

  fs.writeFileSync(path.join(baseDir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n', 'utf8');
}

run();
