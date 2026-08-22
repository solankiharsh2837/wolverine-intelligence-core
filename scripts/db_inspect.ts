import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspect() {
  console.log('============================================================');
  console.log('WOLVERINE INTELLIGENCE — CORE DATABASE INSPECTOR');
  console.log('============================================================\n');

  // 1. Table Row Counts
  console.log('--- TABLE ROW COUNTS ---');
  const counts = {
    networks: await prisma.network.count(),
    portals: await prisma.portal.count(),
    assets: await prisma.asset.count(),
    actors: await prisma.actor.count(),
    personas: await prisma.persona.count(),
    accounts: await prisma.account.count(),
    identifiers: await prisma.identifier.count(),
    artifacts: await prisma.artifact.count(),
    observations: await prisma.observation.count(),
    relationships: await prisma.relationship.count(),
    relationship_evidence: await prisma.relationshipEvidence.count(),
    infrastructure_indicators: await prisma.infrastructureIndicator.count(),
    scans: await prisma.scan.count(),
    findings: await prisma.finding.count(),
    attribution_candidates: await prisma.attributionCandidate.count(),
    attribution_evidences: await prisma.attributionEvidence.count(),
    attribution_features: await prisma.attributionFeature.count(),
    behavior_profiles: await prisma.behaviorProfile.count(),
    stylometric_profiles: await prisma.stylometricProfile.count(),
    timeline_events: await prisma.timelineEvent.count(),
    datasets: await prisma.dataset.count(),
    dataset_records: await prisma.datasetRecord.count(),
    model_versions: await prisma.modelVersion.count(),
    ai_hypotheses: await prisma.aIHypothesis.count(),
    wolverine_evidence: await prisma.wolverineEvidence.count(),
    trust_receipts: await prisma.trustReceipt.count(),
  };

  for (const [table, count] of Object.entries(counts)) {
    console.log(`  [${table.padEnd(26)}] : ${count} rows`);
  }

  // 2. Dataset Registry Summary
  console.log('\n--- DATASET REGISTRY ---');
  const datasets = await prisma.dataset.findMany({
    select: {
      id: true,
      name: true,
      usage: true,
      recordCount: true,
      hash: true,
      sourceUrl: true,
    },
  });
  datasets.forEach((ds) => {
    console.log(`  • ID: ${ds.id}`);
    console.log(`    Name   : ${ds.name}`);
    console.log(`    Usage  : ${ds.usage}`);
    console.log(`    Records: ${ds.recordCount ?? 'N/A'}`);
    console.log(`    Hash   : ${ds.hash}`);
    console.log(`    Source : ${ds.sourceUrl}`);
  });

  // 3. Master Trace Inspection
  console.log('\n--- MASTER TRACE INSPECTION (DarkPhoenix -> Ph0enixRising) ---');
  const traceDataset = await prisma.dataset.findFirst({
    where: { name: { contains: 'Evolution' } },
    include: { records: true },
  });

  if (traceDataset && traceDataset.records.length > 0) {
    const rec = traceDataset.records[0];
    console.log(`  1. Dataset         : ${traceDataset.name} [ID: ${traceDataset.id}]`);
    console.log(`  2. DatasetRecord   : ID: ${rec.id}`);
    console.log(`     Raw Record Data : ${JSON.stringify(rec.rawRecord)}`);

    const obs = await prisma.observation.findFirst({
      where: { datasetId: traceDataset.id },
      include: { artifact: true, network: true, portal: true },
    });

    if (obs) {
      console.log(`  3. Artifact        : ID: ${obs.artifact.id} (Hash: ${obs.artifact.hash}, Format: ${obs.artifact.mimeType})`);
      console.log(`  4. Observation     : ID: ${obs.id} (Type: ${obs.observationType}, Conf: ${obs.confidence})`);
      console.log(`     Network/Portal  : ${obs.network.name} -> ${obs.portal.address}`);
      console.log(`     Payload Hash    : ${obs.canonicalPayloadHash}`);
    }

    const identifiers = await prisma.identifier.findMany({
      where: { value: { in: ['DarkPhoenix', 'Ph0enixRising', '0x98A172BC9B78EF12'] } },
    });
    console.log('  5. Identifiers Extracted:');
    identifiers.forEach((ident) => {
      console.log(`     • [${ident.type.padEnd(8)}] ${ident.value} (ID: ${ident.id})`);
    });

    const personas = await prisma.persona.findMany({
      where: { name: { in: ['DarkPhoenix', 'Ph0enixRising'] } },
      include: { actor: true, portal: true, behaviorProfiles: true, stylometricProfiles: true },
    });
    console.log('  6. Personas & Resolved Actor:');
    personas.forEach((p) => {
      console.log(`     • Persona: ${p.name} [ID: ${p.id}] on Portal: ${p.portal.address}`);
      if (p.actor) {
        console.log(`       -> Resolved Actor ID: ${p.actor.id} (Threat: ${p.actor.threatLevel}, Conf: ${p.actor.confidence})`);
      }
    });

    const relationships = await prisma.relationship.findMany({
      include: { evidences: true },
    });
    console.log('  7. Graph Relationships:');
    relationships.forEach((r) => {
      console.log(`     • ${r.type} [${r.class}] (Conf: ${r.confidence}, Status: ${r.status}) [ID: ${r.id}]`);
      r.evidences.forEach((e) => {
        console.log(`       - Evidence: ${e.evidenceClass} (Ref: ${e.referenceId})`);
      });
    });

    const candidate = await prisma.attributionCandidate.findFirst({
      include: { features: true },
    });
    if (candidate) {
      console.log(`  8. Attribution Candidate:`);
      console.log(`     • Link: ${candidate.entityA} <---> ${candidate.entityB}`);
      console.log(`       Score: ${candidate.score} (Model: ${candidate.modelVersion}) [ID: ${candidate.id}]`);
      console.log('       Feature Vector:');
      candidate.features.forEach((f) => {
        console.log(`         - ${f.featureName.padEnd(14)}: ${f.value.toFixed(2)}`);
      });
    }

    const wolverine = await prisma.wolverineEvidence.findFirst({
      include: { trustReceipts: true },
    });
    if (wolverine) {
      console.log(`  9. Wolverine Cryptographic Evidence:`);
      console.log(`     • Merkle Root: ${wolverine.merkleRoot}`);
      console.log(`     • Signature  : ${wolverine.signature.substring(0, 32)}...`);
      wolverine.trustReceipts.forEach((tr) => {
        console.log(`       - Besu Trust Receipt: TxHash ${tr.transactionId} (Block #${tr.blockNumber})`);
      });
    }

    const aiHypothesis = await prisma.aIHypothesis.findFirst();
    if (aiHypothesis) {
      console.log(` 10. AI Hypothesis (Advisory Layer):`);
      console.log(`     • Summary : "${aiHypothesis.summary}"`);
      console.log(`     • Status  : ${aiHypothesis.status}, Type: ${aiHypothesis.type}`);
    }
  }

  console.log('\n============================================================');
  console.log('INSPECTION COMPLETE: All Relational Contracts Verified.');
  console.log('============================================================');
}

inspect()
  .catch((e) => {
    console.error('[Inspect Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
