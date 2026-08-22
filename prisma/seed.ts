import { PrismaClient, NetworkType, IdentifierType, ObservationType, RelationshipType, RelationshipClass, RelationshipStatus, EvidenceClass, HypothesisType, HypothesisStatus, DatasetUsage } from '@prisma/client';
import { fileURLToPath } from 'node:url';

const prisma = new PrismaClient();

const FIXTURE_TAG = 'DEVELOPMENT_FIXTURE';
const SOURCE_VERSION = '0.1.0';

export async function seed() {
  console.log('[Seed] Clearing previous development fixture data...');

  // Delete in reverse relational order
  await prisma.trustReceipt.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.wolverineEvidence.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.aIHypothesis.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.modelVersion.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.attributionFeature.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.attributionEvidence.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.attributionCandidate.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.relationshipEvidence.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.relationship.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.timelineEvent.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.stylometricProfile.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.behaviorProfile.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.finding.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.scan.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.infrastructureIndicator.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.asset.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.observation.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.artifact.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.datasetRecord.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.dataset.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.account.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.persona.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.actor.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.identifier.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.portal.deleteMany({ where: { createdBy: FIXTURE_TAG } });
  await prisma.network.deleteMany({ where: { createdBy: FIXTURE_TAG } });

  console.log('[Seed] Seeding 2 Networks...');
  const torNetwork = await prisma.network.create({
    data: {
      id: '11111111-1111-4111-a111-111111111111',
      name: 'Tor Onion Overlay',
      type: NetworkType.TOR,
      description: 'The Onion Router network for dark web threat intel footprinting',
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  const i2pNetwork = await prisma.network.create({
    data: {
      id: '22222222-2222-4222-a222-222222222222',
      name: 'Invisible Internet Project (I2P)',
      type: NetworkType.I2P,
      description: 'Garlic routing overlay network for P2P and hidden services',
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  console.log('[Seed] Seeding 2 Portals...');
  const torMarketPortal = await prisma.portal.create({
    data: {
      id: '33333333-3333-4333-a333-333333333333',
      networkId: torNetwork.id,
      address: 'darkmkt777onion.onion',
      status: 'ONLINE',
      discoveredAt: new Date('2026-01-15T08:00:00Z'),
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  const i2pForumPortal = await prisma.portal.create({
    data: {
      id: '44444444-4444-4444-a444-444444444444',
      networkId: i2pNetwork.id,
      address: 'shadowchat.i2p',
      status: 'ONLINE',
      discoveredAt: new Date('2026-01-20T12:00:00Z'),
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  console.log('[Seed] Seeding Dataset Registry (4 standard datasets)...');
  const evoDataset = await prisma.dataset.create({
    data: {
      id: '55555555-5555-4555-a555-555555555555',
      name: 'Evolution Marketplace (2014-2015)',
      sourceUrl: 'https://gwern.net/dnb-evolution',
      hash: 'sha256-d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
      usage: DatasetUsage.FEATURE_ENGINEERING,
      description: 'Historical marketplace vendor, product listings, and feedback records for behavioral calibration',
      license: 'Research/Public Historical Archive',
      modality: 'Marketplace Tables / Vendor Profiles',
      recordCount: 145000,
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  await prisma.dataset.create({
    data: {
      id: '55555555-5555-4555-a555-555555555556',
      name: 'Darknet Surfing Dataset',
      sourceUrl: 'https://darknetsurfing.org/archive',
      hash: 'sha256-4c919d3f1a238e83f2a1b9134a6efbc52781a7b8e190334812bc85c5457ef49a',
      usage: DatasetUsage.SYNTHETIC_CALIBRATION,
      description: 'Dark web crawl metadata for link topologies and service distribution calibration',
      license: 'Academic Non-Commercial',
      modality: 'Graph / Crawl Metadata',
      recordCount: 82000,
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  await prisma.dataset.create({
    data: {
      id: '55555555-5555-4555-a555-555555555557',
      name: 'NICT Darknet Dataset 2022',
      sourceUrl: 'https://www.nict.go.jp/en/cyber/darknet/',
      hash: 'sha256-8a391c49b21f92e3a6bc4d7912442c5251801267ea95827725916f1c42f0263b',
      usage: DatasetUsage.REFERENCE_ONLY,
      description: 'Telescope darknet passive sensor traffic logs for network scanning anomalies',
      license: 'Research Access Agreement',
      modality: 'PCAP / Flow Telemetry',
      recordCount: 5000000,
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  await prisma.dataset.create({
    data: {
      id: '55555555-5555-4555-a555-555555555558',
      name: 'VeriDark Authorship Dataset',
      sourceUrl: 'https://veridark.nlp.corpus/v1',
      hash: 'sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      usage: DatasetUsage.TRAINING,
      description: 'Ground-truth cross-forum authorship verification pairs for stylometric baseline training',
      license: 'CC BY-NC 4.0',
      modality: 'Text Corpora / Forum Posts',
      recordCount: 65000,
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  console.log('[Seed] Seeding Master Trace Chain (DarkPhoenix -> Ph0enixRising attribution)...');

  // 1. DatasetRecord
  const datasetRecord = await prisma.datasetRecord.create({
    data: {
      id: '66666666-6666-4666-a666-666666666666',
      datasetId: evoDataset.id,
      rawRecord: {
        vendor_id: 'DarkPhoenix',
        item_id: 'item_9921',
        title: 'Bulletproof VPN & Proxy Configurations',
        pgp_fingerprint: '98A172BC9B78EF12',
        btc_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        registered_date: '2014-11-03T10:00:00Z',
      },
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  // 2. Artifacts
  const torArtifact = await prisma.artifact.create({
    data: {
      id: '77777777-7777-4777-a777-777777777771',
      rawData: Buffer.from('<html><body><h1>DarkPhoenix Vendor Page</h1><p>PGP: 0x98A172BC9B78EF12</p><p>BTC: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</p></body></html>'),
      hash: '01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b',
      collectedAt: new Date('2026-02-01T14:22:00Z'),
      mimeType: 'text/html',
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  const i2pArtifact = await prisma.artifact.create({
    data: {
      id: '77777777-7777-4777-a777-777777777772',
      rawData: Buffer.from('<html><body><div class="post">User: Ph0enixRising. Msg: Migrated from old boards. Contact via PGP: 0x98A172BC9B78EF12</div></body></html>'),
      hash: 'a0c436b7b255ca80f58022a105001a1c360b37cd9e63c0a52e008d6c7ee23c68',
      collectedAt: new Date('2026-02-05T09:15:00Z'),
      mimeType: 'text/html',
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  // 3. Observations
  const torObservation = await prisma.observation.create({
    data: {
      id: '88888888-8888-4888-a888-888888888881',
      networkId: torNetwork.id,
      portalId: torMarketPortal.id,
      artifactId: torArtifact.id,
      datasetId: evoDataset.id,
      sourceLocator: 'http://darkmkt777onion.onion/vendor/DarkPhoenix',
      sourceRecordId: 'evo_item_9921',
      observationType: ObservationType.LISTING,
      observedAt: new Date('2026-02-01T14:20:00Z'),
      collectedAt: new Date('2026-02-01T14:22:00Z'),
      collectorVersion: 'wolverine-tor-collector-0.1.0',
      rawArtifactReference: 's3://wolverine-raw/tor/2026-02-01/darkmkt_darkphoenix.html',
      canonicalPayloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b851',
      confidence: 1.0,
      provenance: {
        collector: 'TorAdapter-v0.1',
        pipeline: 'CanonicalNormalizer-v1',
        verified: true,
        source: FIXTURE_TAG,
      },
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  const i2pObservation = await prisma.observation.create({
    data: {
      id: '88888888-8888-4888-a888-888888888882',
      networkId: i2pNetwork.id,
      portalId: i2pForumPortal.id,
      artifactId: i2pArtifact.id,
      sourceLocator: 'http://shadowchat.i2p/thread/882#post4',
      sourceRecordId: 'post_882_4',
      observationType: ObservationType.POST,
      observedAt: new Date('2026-02-05T09:10:00Z'),
      collectedAt: new Date('2026-02-05T09:15:00Z'),
      collectorVersion: 'wolverine-i2p-collector-0.1.0',
      rawArtifactReference: 's3://wolverine-raw/i2p/2026-02-05/shadowchat_post882.html',
      canonicalPayloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b852',
      confidence: 1.0,
      provenance: {
        collector: 'I2PAdapter-v0.1',
        pipeline: 'CanonicalNormalizer-v1',
        verified: true,
        source: FIXTURE_TAG,
      },
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  // 4. Identifiers
  const torHandle = await prisma.identifier.create({
    data: {
      id: '99999999-9999-4999-a999-999999999991',
      type: IdentifierType.HANDLE,
      value: 'DarkPhoenix',
      networkId: torNetwork.id,
      portalId: torMarketPortal.id,
      firstSeen: new Date('2026-02-01T14:20:00Z'),
      lastSeen: new Date('2026-02-01T14:20:00Z'),
      source: 'Marketplace Vendor Profile',
      observationIds: [torObservation.id],
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  const i2pHandle = await prisma.identifier.create({
    data: {
      id: '99999999-9999-4999-a999-999999999992',
      type: IdentifierType.HANDLE,
      value: 'Ph0enixRising',
      networkId: i2pNetwork.id,
      portalId: i2pForumPortal.id,
      firstSeen: new Date('2026-02-05T09:10:00Z'),
      lastSeen: new Date('2026-02-05T09:10:00Z'),
      source: 'Forum User Post Author',
      observationIds: [i2pObservation.id],
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  const sharedPgp = await prisma.identifier.create({
    data: {
      id: '99999999-9999-4999-a999-999999999993',
      type: IdentifierType.PGP_KEY,
      value: '0x98A172BC9B78EF12',
      networkId: torNetwork.id,
      portalId: torMarketPortal.id,
      firstSeen: new Date('2026-02-01T14:20:00Z'),
      lastSeen: new Date('2026-02-05T09:10:00Z'),
      source: 'Public PGP Key Header / Forum Signature',
      observationIds: [torObservation.id, i2pObservation.id],
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  const btcWallet = await prisma.identifier.create({
    data: {
      id: '99999999-9999-4999-a999-999999999994',
      type: IdentifierType.WALLET,
      value: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      networkId: torNetwork.id,
      portalId: torMarketPortal.id,
      firstSeen: new Date('2026-02-01T14:20:00Z'),
      lastSeen: new Date('2026-02-01T14:20:00Z'),
      source: 'Marketplace Vendor Payment Config',
      observationIds: [torObservation.id],
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  // 5. Actor and Personas
  const phoenixActor = await prisma.actor.create({
    data: {
      id: 'cccccccc-cccc-4ccc-accc-cccccccccccc',
      threatLevel: 0.85,
      confidence: 0.94,
      notes: 'High-threat actor operating across Tor and I2P overlays with verified PGP reuse and consistent stylometry.',
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  const torPersona = await prisma.persona.create({
    data: {
      id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      actorId: phoenixActor.id,
      name: 'DarkPhoenix',
      portalId: torMarketPortal.id,
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  const i2pPersona = await prisma.persona.create({
    data: {
      id: 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb',
      actorId: phoenixActor.id,
      name: 'Ph0enixRising',
      portalId: i2pForumPortal.id,
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  // Accounts
  await prisma.account.create({
    data: {
      id: 'a1a1a1a1-a1a1-41a1-a1a1-a1a1a1a1a1a1',
      personaId: torPersona.id,
      portalId: torMarketPortal.id,
      accountId: 'usr_darkmkt_9921',
      registeredAt: new Date('2026-01-20T10:00:00Z'),
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  await prisma.account.create({
    data: {
      id: 'b2b2b2b2-b2b2-42b2-a2b2-b2b2b2b2b2b2',
      personaId: i2pPersona.id,
      portalId: i2pForumPortal.id,
      accountId: 'usr_shadowchat_404',
      registeredAt: new Date('2026-02-04T18:30:00Z'),
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  // Profiles
  await prisma.behaviorProfile.create({
    data: {
      id: 'b3b3b3b3-b3b3-43b3-a3b3-b3b3b3b3b3b3',
      personaId: torPersona.id,
      timezone: 'UTC+3 (Eastern Europe)',
      activeHours: [0.02, 0.01, 0.0, 0.0, 0.0, 0.0, 0.05, 0.12, 0.18, 0.22, 0.15, 0.1, 0.08, 0.04, 0.02, 0.01, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  await prisma.stylometricProfile.create({
    data: {
      id: 'c4c4c4c4-c4c4-44c4-a4c4-c4c4c4c4c4c4',
      personaId: torPersona.id,
      wordFreq: { bulletproof: 0.04, vpn: 0.035, proxy: 0.03, guaranteed: 0.025, uptime: 0.02 },
      grammarPats: { comma_density: 0.065, semicolon_freq: 0.012, avg_sentence_len: 18.4 },
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  // 6. Relationships
  const relPgp = await prisma.relationship.create({
    data: {
      id: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
      sourceId: torPersona.id,
      targetId: sharedPgp.id,
      type: RelationshipType.USES_PGP_KEY,
      class: RelationshipClass.DETERMINISTIC_MATCH,
      observedAt: new Date('2026-02-01T14:20:00Z'),
      confidence: 1.0,
      status: RelationshipStatus.ACTIVE,
      sourceObservationIds: [torObservation.id, i2pObservation.id],
      evidenceIds: [],
      modelVersion: 'wolverine-rule-engine-0.1.0',
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  const relAttribution = await prisma.relationship.create({
    data: {
      id: 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee',
      sourceId: torPersona.id,
      targetId: i2pPersona.id,
      type: RelationshipType.POSSIBLE_SAME_AS,
      class: RelationshipClass.ATTRIBUTION_CANDIDATE,
      observedAt: new Date('2026-02-05T09:10:00Z'),
      confidence: 0.94,
      status: RelationshipStatus.VALIDATED,
      sourceObservationIds: [torObservation.id, i2pObservation.id],
      evidenceIds: [],
      modelVersion: 'v1.0.0-logistic',
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  await prisma.relationshipEvidence.create({
    data: {
      id: 'e1e1e1e1-e1e1-41e1-a1e1-e1e1e1e1e1e1',
      relationshipId: relAttribution.id,
      evidenceClass: EvidenceClass.DETERMINISTIC_MATCH,
      referenceId: sharedPgp.id,
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  // 7. Model Version & Attribution Candidate
  const modelVer = await prisma.modelVersion.create({
    data: {
      id: '10101010-1010-4010-a010-101010101010',
      modelName: 'wolverine-logistic-attribution',
      versionTag: 'v1.0.0-logistic',
      parameters: {
        beta_alias: 1.45,
        beta_pgp: 3.82,
        beta_wallet: 2.91,
        beta_stylometry: 1.84,
        beta_behavior: 1.15,
        beta_temporal: 0.92,
        beta_graph: 0.74,
        beta_market: 0.65,
        beta_infrastructure: 1.33,
        beta_migration: 1.05,
        intercept: -4.12,
      },
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  const attributionCandidate = await prisma.attributionCandidate.create({
    data: {
      id: 'ffffffff-ffff-4fff-afff-ffffffffffff',
      entityA: torPersona.id,
      entityB: i2pPersona.id,
      score: 0.94,
      modelVersion: modelVer.versionTag,
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  // Features
  const features = [
    { name: 'alias', val: 0.62 },
    { name: 'pgp', val: 1.00 },
    { name: 'wallet', val: 0.00 },
    { name: 'stylometry', val: 0.78 },
    { name: 'behavior', val: 0.65 },
    { name: 'temporal', val: 0.71 },
    { name: 'graph', val: 0.45 },
    { name: 'market', val: 0.00 },
    { name: 'infrastructure', val: 0.33 },
    { name: 'migration', val: 0.58 },
  ];

  for (const f of features) {
    await prisma.attributionFeature.create({
      data: {
        candidateId: attributionCandidate.id,
        featureName: f.name,
        value: f.val,
        createdBy: FIXTURE_TAG,
        sourceVersion: SOURCE_VERSION,
      },
    });
  }

  // 8. AI Hypothesis (Advisory narrative)
  await prisma.aIHypothesis.create({
    data: {
      id: '20202020-2020-4020-a020-202020202020',
      summary: 'DarkPhoenix (Tor) and Ph0enixRising (I2P) exhibit shared PGP subkey 0x98A172BC9B78EF12 and consistent Eastern Europe posting hours, indicating rebranding/migration following Evolution market deprecation.',
      modelId: modelVer.id,
      status: HypothesisStatus.REVIEWED,
      type: HypothesisType.HYPOTHESIS,
      referencedEntityIds: [torPersona.id, i2pPersona.id, sharedPgp.id],
      confidence: 0.92,
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  // 9. Wolverine Cryptographic Evidence & Trust Receipt
  const wolverineEv = await prisma.wolverineEvidence.create({
    data: {
      id: '30303030-3030-4030-a030-303030303030',
      observationId: torObservation.id,
      signature: '0x3a829f01bc3892ae82049182390184ef9281a82bc1948271892019482019482a81920148201948201948291048201948201948201948201948201948201b',
      merkleRoot: '0x8f20194820194820194820194820194820194820194820194820194820194820',
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  await prisma.trustReceipt.create({
    data: {
      id: '40404040-4040-4040-a040-404040404040',
      evidenceId: wolverineEv.id,
      blockHash: '0x18290123ef1829a8fbc8921890efba901289cfad18290123ef1829a8fbc89218',
      transactionId: '0x9f830a6723ef8912bcde890123ef1829a8fbc8921890efba901289cfad182901',
      blockNumber: 104289,
      network: 'BESU_LOCAL',
      createdBy: FIXTURE_TAG,
      sourceVersion: SOURCE_VERSION,
    },
  });

  console.log('[Seed] Deterministic development fixture successfully seeded.');
}

// Only execute when invoked directly as CLI script
if (process.argv[1] && (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'))) {
  seed()
    .catch((e) => {
      console.error('[Seed Error]', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
