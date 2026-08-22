-- CreateEnum
CREATE TYPE "NetworkType" AS ENUM ('TOR', 'I2P', 'ZERONET', 'FREENET', 'CLEARNET');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('HANDLE', 'PGP_KEY', 'WALLET', 'EMAIL', 'CRYPTO_ADDRESS', 'PUBLISHER_KEY', 'SITE_IDENTITY', 'DOMAIN', 'CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "ObservationType" AS ENUM ('POST', 'LISTING', 'MESSAGE', 'PROFILE_UPDATE', 'TRANSACTION', 'REVIEW', 'HEARTBEAT', 'KEY_EVENT', 'MIGRATION', 'SCAN_RESULT');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('AUTHORED', 'POSTED', 'REPLIED_TO', 'MESSAGED', 'LISTED', 'BOUGHT_FROM', 'SOLD_TO', 'REPUTATION_FOR', 'VOUCHED_FOR', 'USES_ACCOUNT', 'HAS_ALIAS', 'USES_WALLET', 'USES_PGP_KEY', 'POSSIBLE_SAME_AS', 'MIGRATED_TO', 'SHARES_INFRASTRUCTURE', 'SHARES_FINGERPRINT', 'SHARES_COUNTERPARTY', 'TEMPORALLY_CORRELATED', 'COMMUNITY_OVERLAP', 'INSTRUMENTED_BY');

-- CreateEnum
CREATE TYPE "RelationshipClass" AS ENUM ('OBSERVED', 'DETERMINISTIC_MATCH', 'STATISTICAL_MATCH', 'AI_HYPOTHESIS', 'ATTRIBUTION_CANDIDATE');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('PROPOSED', 'VALIDATED', 'ACTIVE', 'SUPERSEDED', 'RETRACTED');

-- CreateEnum
CREATE TYPE "FindingType" AS ENUM ('EXPOSURE', 'VULNERABILITY', 'FINGERPRINT', 'MISCONFIGURATION');

-- CreateEnum
CREATE TYPE "EvidenceClass" AS ENUM ('OBSERVED', 'DETERMINISTIC_MATCH', 'STATISTICAL_MATCH', 'AI_HYPOTHESIS', 'CRYPTOGRAPHIC_PROOF');

-- CreateEnum
CREATE TYPE "HypothesisType" AS ENUM ('SUMMARIZATION', 'HYPOTHESIS', 'NARRATIVE', 'PATTERN');

-- CreateEnum
CREATE TYPE "HypothesisStatus" AS ENUM ('GENERATED', 'REVIEWED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DatasetUsage" AS ENUM ('TRAINING', 'VALIDATION', 'TEST', 'FEATURE_ENGINEERING', 'SYNTHETIC_CALIBRATION', 'REFERENCE_ONLY');

-- CreateTable
CREATE TABLE "networks" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "NetworkType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "networks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portals" (
    "id" UUID NOT NULL,
    "networkId" UUID NOT NULL,
    "address" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "discoveredAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "portals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "portalId" UUID,
    "assetType" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "firstSeen" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actors" (
    "id" UUID NOT NULL,
    "threatLevel" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "actors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "name" TEXT NOT NULL,
    "portalId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "personaId" UUID NOT NULL,
    "portalId" UUID NOT NULL,
    "accountId" TEXT NOT NULL,
    "registeredAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identifiers" (
    "id" UUID NOT NULL,
    "type" "IdentifierType" NOT NULL,
    "value" TEXT NOT NULL,
    "networkId" UUID NOT NULL,
    "portalId" UUID,
    "firstSeen" TIMESTAMPTZ(6) NOT NULL,
    "lastSeen" TIMESTAMPTZ(6) NOT NULL,
    "source" TEXT NOT NULL,
    "observationIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artifacts" (
    "id" UUID NOT NULL,
    "rawData" BYTEA NOT NULL,
    "hash" TEXT NOT NULL,
    "collectedAt" TIMESTAMPTZ(6) NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observations" (
    "id" UUID NOT NULL,
    "networkId" UUID NOT NULL,
    "portalId" UUID NOT NULL,
    "sourceLocator" TEXT NOT NULL,
    "sourceRecordId" TEXT,
    "artifactId" UUID NOT NULL,
    "observationType" "ObservationType" NOT NULL,
    "observedAt" TIMESTAMPTZ(6) NOT NULL,
    "collectedAt" TIMESTAMPTZ(6) NOT NULL,
    "collectorVersion" TEXT NOT NULL,
    "rawArtifactReference" TEXT NOT NULL,
    "canonicalPayloadHash" TEXT NOT NULL,
    "datasetId" UUID,
    "scanId" UUID,
    "confidence" DOUBLE PRECISION NOT NULL,
    "provenance" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationships" (
    "id" UUID NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "type" "RelationshipType" NOT NULL,
    "class" "RelationshipClass" NOT NULL,
    "observedAt" TIMESTAMPTZ(6),
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" "RelationshipStatus" NOT NULL DEFAULT 'PROPOSED',
    "validFrom" TIMESTAMPTZ(6),
    "validTo" TIMESTAMPTZ(6),
    "sourceObservationIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidenceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "modelVersion" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationship_evidence" (
    "id" UUID NOT NULL,
    "relationshipId" UUID NOT NULL,
    "evidenceClass" "EvidenceClass" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "relationship_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infrastructure_indicators" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "infrastructure_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scans" (
    "id" UUID NOT NULL,
    "portalId" UUID,
    "startedAt" TIMESTAMPTZ(6) NOT NULL,
    "finishedAt" TIMESTAMPTZ(6),
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "findings" (
    "id" UUID NOT NULL,
    "scanId" UUID NOT NULL,
    "type" "FindingType" NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribution_candidates" (
    "id" UUID NOT NULL,
    "entityA" TEXT NOT NULL,
    "entityB" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "attribution_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribution_evidences" (
    "id" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "evidenceClass" "EvidenceClass" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "attribution_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribution_features" (
    "id" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "featureName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "attribution_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavior_profiles" (
    "id" UUID NOT NULL,
    "personaId" UUID NOT NULL,
    "timezone" TEXT,
    "activeHours" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "behavior_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stylometric_profiles" (
    "id" UUID NOT NULL,
    "personaId" UUID NOT NULL,
    "wordFreq" JSONB NOT NULL,
    "grammarPats" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "stylometric_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" UUID NOT NULL,
    "entityId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventTime" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datasets" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "hash" TEXT NOT NULL,
    "usage" "DatasetUsage" NOT NULL DEFAULT 'REFERENCE_ONLY',
    "description" TEXT,
    "license" TEXT,
    "modality" TEXT,
    "recordCount" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dataset_records" (
    "id" UUID NOT NULL,
    "datasetId" UUID NOT NULL,
    "rawRecord" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "dataset_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_versions" (
    "id" UUID NOT NULL,
    "modelName" TEXT NOT NULL,
    "versionTag" TEXT NOT NULL,
    "parameters" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "model_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_hypotheses" (
    "id" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "modelId" UUID NOT NULL,
    "status" "HypothesisStatus" NOT NULL DEFAULT 'GENERATED',
    "type" "HypothesisType" NOT NULL DEFAULT 'HYPOTHESIS',
    "referencedEntityIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "ai_hypotheses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wolverine_evidence" (
    "id" UUID NOT NULL,
    "observationId" UUID NOT NULL,
    "signature" TEXT NOT NULL,
    "merkleRoot" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "wolverine_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_receipts" (
    "id" UUID NOT NULL,
    "evidenceId" UUID NOT NULL,
    "blockHash" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "network" TEXT NOT NULL DEFAULT 'BESU_LOCAL',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,

    CONSTRAINT "trust_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "networks_name_key" ON "networks"("name");

-- CreateIndex
CREATE INDEX "portals_networkId_idx" ON "portals"("networkId");

-- CreateIndex
CREATE INDEX "portals_address_idx" ON "portals"("address");

-- CreateIndex
CREATE INDEX "assets_portalId_idx" ON "assets"("portalId");

-- CreateIndex
CREATE INDEX "assets_value_idx" ON "assets"("value");

-- CreateIndex
CREATE INDEX "personas_actorId_idx" ON "personas"("actorId");

-- CreateIndex
CREATE INDEX "personas_portalId_idx" ON "personas"("portalId");

-- CreateIndex
CREATE INDEX "personas_name_idx" ON "personas"("name");

-- CreateIndex
CREATE INDEX "accounts_personaId_idx" ON "accounts"("personaId");

-- CreateIndex
CREATE INDEX "accounts_portalId_idx" ON "accounts"("portalId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_portalId_accountId_key" ON "accounts"("portalId", "accountId");

-- CreateIndex
CREATE INDEX "identifiers_networkId_idx" ON "identifiers"("networkId");

-- CreateIndex
CREATE INDEX "identifiers_portalId_idx" ON "identifiers"("portalId");

-- CreateIndex
CREATE INDEX "identifiers_type_value_idx" ON "identifiers"("type", "value");

-- CreateIndex
CREATE UNIQUE INDEX "artifacts_hash_key" ON "artifacts"("hash");

-- CreateIndex
CREATE INDEX "artifacts_hash_idx" ON "artifacts"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "observations_canonicalPayloadHash_key" ON "observations"("canonicalPayloadHash");

-- CreateIndex
CREATE INDEX "observations_networkId_idx" ON "observations"("networkId");

-- CreateIndex
CREATE INDEX "observations_portalId_idx" ON "observations"("portalId");

-- CreateIndex
CREATE INDEX "observations_artifactId_idx" ON "observations"("artifactId");

-- CreateIndex
CREATE INDEX "observations_datasetId_idx" ON "observations"("datasetId");

-- CreateIndex
CREATE INDEX "observations_scanId_idx" ON "observations"("scanId");

-- CreateIndex
CREATE INDEX "observations_observedAt_idx" ON "observations"("observedAt");

-- CreateIndex
CREATE INDEX "observations_collectedAt_idx" ON "observations"("collectedAt");

-- CreateIndex
CREATE INDEX "relationships_sourceId_idx" ON "relationships"("sourceId");

-- CreateIndex
CREATE INDEX "relationships_targetId_idx" ON "relationships"("targetId");

-- CreateIndex
CREATE INDEX "relationships_type_idx" ON "relationships"("type");

-- CreateIndex
CREATE INDEX "relationships_class_idx" ON "relationships"("class");

-- CreateIndex
CREATE INDEX "relationships_confidence_idx" ON "relationships"("confidence");

-- CreateIndex
CREATE INDEX "relationship_evidence_relationshipId_idx" ON "relationship_evidence"("relationshipId");

-- CreateIndex
CREATE INDEX "relationship_evidence_referenceId_idx" ON "relationship_evidence"("referenceId");

-- CreateIndex
CREATE INDEX "infrastructure_indicators_assetId_idx" ON "infrastructure_indicators"("assetId");

-- CreateIndex
CREATE INDEX "infrastructure_indicators_key_idx" ON "infrastructure_indicators"("key");

-- CreateIndex
CREATE INDEX "scans_portalId_idx" ON "scans"("portalId");

-- CreateIndex
CREATE INDEX "findings_scanId_idx" ON "findings"("scanId");

-- CreateIndex
CREATE INDEX "findings_type_idx" ON "findings"("type");

-- CreateIndex
CREATE INDEX "attribution_candidates_entityA_idx" ON "attribution_candidates"("entityA");

-- CreateIndex
CREATE INDEX "attribution_candidates_entityB_idx" ON "attribution_candidates"("entityB");

-- CreateIndex
CREATE INDEX "attribution_candidates_score_idx" ON "attribution_candidates"("score");

-- CreateIndex
CREATE INDEX "attribution_evidences_candidateId_idx" ON "attribution_evidences"("candidateId");

-- CreateIndex
CREATE INDEX "attribution_evidences_referenceId_idx" ON "attribution_evidences"("referenceId");

-- CreateIndex
CREATE INDEX "attribution_features_candidateId_idx" ON "attribution_features"("candidateId");

-- CreateIndex
CREATE INDEX "attribution_features_featureName_idx" ON "attribution_features"("featureName");

-- CreateIndex
CREATE INDEX "behavior_profiles_personaId_idx" ON "behavior_profiles"("personaId");

-- CreateIndex
CREATE INDEX "stylometric_profiles_personaId_idx" ON "stylometric_profiles"("personaId");

-- CreateIndex
CREATE INDEX "timeline_events_entityId_idx" ON "timeline_events"("entityId");

-- CreateIndex
CREATE INDEX "timeline_events_eventTime_idx" ON "timeline_events"("eventTime");

-- CreateIndex
CREATE UNIQUE INDEX "datasets_name_key" ON "datasets"("name");

-- CreateIndex
CREATE INDEX "datasets_name_idx" ON "datasets"("name");

-- CreateIndex
CREATE INDEX "dataset_records_datasetId_idx" ON "dataset_records"("datasetId");

-- CreateIndex
CREATE UNIQUE INDEX "model_versions_modelName_versionTag_key" ON "model_versions"("modelName", "versionTag");

-- CreateIndex
CREATE INDEX "ai_hypotheses_modelId_idx" ON "ai_hypotheses"("modelId");

-- CreateIndex
CREATE INDEX "ai_hypotheses_status_idx" ON "ai_hypotheses"("status");

-- CreateIndex
CREATE INDEX "wolverine_evidence_observationId_idx" ON "wolverine_evidence"("observationId");

-- CreateIndex
CREATE INDEX "wolverine_evidence_merkleRoot_idx" ON "wolverine_evidence"("merkleRoot");

-- CreateIndex
CREATE UNIQUE INDEX "trust_receipts_transactionId_key" ON "trust_receipts"("transactionId");

-- CreateIndex
CREATE INDEX "trust_receipts_evidenceId_idx" ON "trust_receipts"("evidenceId");

-- CreateIndex
CREATE INDEX "trust_receipts_transactionId_idx" ON "trust_receipts"("transactionId");

-- AddForeignKey
ALTER TABLE "portals" ADD CONSTRAINT "portals_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "networks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "portals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "actors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "portals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "portals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identifiers" ADD CONSTRAINT "identifiers_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "networks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identifiers" ADD CONSTRAINT "identifiers_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "portals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "networks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "portals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "datasets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "scans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationship_evidence" ADD CONSTRAINT "relationship_evidence_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure_indicators" ADD CONSTRAINT "infrastructure_indicators_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "portals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribution_evidences" ADD CONSTRAINT "attribution_evidences_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "attribution_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribution_features" ADD CONSTRAINT "attribution_features_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "attribution_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_profiles" ADD CONSTRAINT "behavior_profiles_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stylometric_profiles" ADD CONSTRAINT "stylometric_profiles_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dataset_records" ADD CONSTRAINT "dataset_records_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_hypotheses" ADD CONSTRAINT "ai_hypotheses_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "model_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wolverine_evidence" ADD CONSTRAINT "wolverine_evidence_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "observations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_receipts" ADD CONSTRAINT "trust_receipts_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "wolverine_evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
