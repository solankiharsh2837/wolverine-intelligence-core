# Wolverine Intelligence Platform
## Database Specification & Operability Guide (DATABASE.md)

This document defines the PostgreSQL database architecture, Prisma ORM integration, complete ER model, and developer operability guide for the Wolverine Intelligence platform.

> [!IMPORTANT]
> The database is the ultimate source of truth for the platform. It enforces referential integrity, structural schema validation, and relational linkages between all observed evidence and inferred relationships.
> See [DATA-MODEL.md](DATA-MODEL.md) for field-level definitions and taxonomy.

---

## 1. Database Architecture

- **RDBMS**: PostgreSQL 15-alpine (Docker container `wolverine-postgres`)
- **Port**: `5432`
- **Database Name**: `wolverine_intel`
- **User**: `postgres`
- **ORM**: Prisma ORM (v5.22.0) for schema management, migrations, and type-safe data access.
- **Client Generation**: `@prisma/client` generated to `./node_modules/@prisma/client`

---

## 2. Complete ER Model

All 26 canonical tables implemented in PostgreSQL:

| Table Name | Primary Key | Foreign Keys | Unique Constraints | Indexes |
|---|---|---|---|---|
| `networks` | `id` (UUID) | None | `name` | Default PK |
| `portals` | `id` (UUID) | `networkId` (ON DELETE CASCADE) | None | `idx_portals_networkId`, `idx_portals_address` |
| `assets` | `id` (UUID) | `portalId` (ON DELETE SET NULL) | None | `idx_assets_portalId`, `idx_assets_value` |
| `actors` | `id` (UUID) | None | None | Default PK |
| `personas` | `id` (UUID) | `actorId` (ON DELETE SET NULL), `portalId` (ON DELETE CASCADE) | None | `idx_personas_actorId`, `idx_personas_portalId`, `idx_personas_name` |
| `accounts` | `id` (UUID) | `personaId` (ON DELETE CASCADE), `portalId` (ON DELETE CASCADE) | `(portalId, accountId)` | `idx_accounts_personaId`, `idx_accounts_portalId` |
| `identifiers` | `id` (UUID) | `networkId` (ON DELETE CASCADE), `portalId` (ON DELETE SET NULL) | None | `idx_identifiers_networkId`, `idx_identifiers_portalId`, `idx_identifiers_type_value` |
| `artifacts` | `id` (UUID) | None | `hash` | `idx_artifacts_hash` |
| `observations` | `id` (UUID) | `networkId`, `portalId`, `artifactId`, `datasetId`, `scanId` | `canonicalPayloadHash` | `idx_observations_networkId`, `idx_observations_portalId`, `idx_observations_observedAt`, etc. |
| `relationships` | `id` (UUID) | None | None | `idx_relationships_sourceId`, `idx_relationships_targetId`, `idx_relationships_type`, `idx_relationships_class` |
| `relationship_evidence` | `id` (UUID) | `relationshipId` (ON DELETE CASCADE) | None | `idx_relevidence_relationshipId`, `idx_relevidence_referenceId` |
| `infrastructure_indicators`| `id` (UUID) | `assetId` (ON DELETE CASCADE) | None | `idx_infind_assetId`, `idx_infind_key` |
| `scans` | `id` (UUID) | `portalId` (ON DELETE SET NULL) | None | `idx_scans_portalId` |
| `findings` | `id` (UUID) | `scanId` (ON DELETE CASCADE) | None | `idx_findings_scanId`, `idx_findings_type` |
| `attribution_candidates` | `id` (UUID) | None | None | `idx_attrcand_entityA`, `idx_attrcand_entityB`, `idx_attrcand_score` |
| `attribution_evidences` | `id` (UUID) | `candidateId` (ON DELETE CASCADE) | None | `idx_attrev_candidateId`, `idx_attrev_referenceId` |
| `attribution_features` | `id` (UUID) | `candidateId` (ON DELETE CASCADE) | None | `idx_attrfeat_candidateId`, `idx_attrfeat_featureName` |
| `behavior_profiles` | `id` (UUID) | `personaId` (ON DELETE CASCADE) | None | `idx_behavior_personaId` |
| `stylometric_profiles` | `id` (UUID) | `personaId` (ON DELETE CASCADE) | None | `idx_stylometric_personaId` |
| `timeline_events` | `id` (UUID) | None | None | `idx_timeline_entityId`, `idx_timeline_eventTime` |
| `datasets` | `id` (UUID) | None | `name` | `idx_datasets_name` |
| `dataset_records` | `id` (UUID) | `datasetId` (ON DELETE CASCADE) | None | `idx_dsrecords_datasetId` |
| `model_versions` | `id` (UUID) | None | `(modelName, versionTag)` | Unique constraint index |
| `ai_hypotheses` | `id` (UUID) | `modelId` (ON DELETE CASCADE) | None | `idx_aihypo_modelId`, `idx_aihypo_status` |
| `wolverine_evidence` | `id` (UUID) | `observationId` (ON DELETE CASCADE) | None | `idx_wolev_observationId`, `idx_wolev_merkleRoot` |
| `trust_receipts` | `id` (UUID) | `evidenceId` (ON DELETE CASCADE) | `transactionId` | `idx_trust_evidenceId`, `idx_trust_transactionId` |

---

## 3. Developer Operability

### Start Database
```bash
npm run db:up
# Or via docker compose:
docker compose up -d
```

### Stop Database
```bash
npm run db:down
```

### Database URL
```env
DATABASE_URL="postgresql://postgres:wolverine@localhost:5432/wolverine_intel?schema=public"
```

### Prisma Commands
```bash
# Generate Prisma Client
npm run db:generate

# Run development migrations
npm run db:migrate

# Seed deterministic development fixture
npm run db:seed

# Inspect database contents in terminal
npm run db:inspect

# Open Prisma Studio web GUI (http://localhost:5555)
npm run db:studio

# Run database automated test suite
npm run db:test
```

### Backup & Restore
```bash
# Snapshot database to backups/ folder
npm run db:backup

# Restore latest snapshot
npm run db:restore
```

### Direct psql Access
```bash
docker exec -it wolverine-postgres psql -U postgres -d wolverine_intel
```

---

## 4. Essential SQL Queries

```sql
-- 1. Table Row Counts
SELECT schemaname, relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname;

-- 2. Trace Persona to Resolved Actor
SELECT p.name AS persona_name, p.id AS persona_id, a.id AS actor_id, a."threatLevel", a.confidence
FROM personas p
JOIN actors a ON p."actorId" = a.id;

-- 3. Find Shared Identifiers (e.g. PGP Keys across networks)
SELECT i.value, i.type, n.name AS network, i."observationIds"
FROM identifiers i
JOIN networks n ON i."networkId" = n.id
WHERE i.type = 'PGP_KEY';

-- 4. Attribution Candidate Scoring & Feature Vectors
SELECT ac.id, ac."entityA", ac."entityB", ac.score, af."featureName", af.value
FROM attribution_candidates ac
JOIN attribution_features af ON ac.id = af."candidateId"
ORDER BY ac.score DESC;

-- 5. Wolverine Cryptographic Receipts & Anchors
SELECT we."observationId", we."merkleRoot", tr."transactionId", tr."blockNumber", tr.network
FROM wolverine_evidence we
JOIN trust_receipts tr ON we.id = tr."evidenceId";
```
