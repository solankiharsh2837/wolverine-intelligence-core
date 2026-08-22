# Wolverine Intelligence Test Strategy

> [!IMPORTANT]
> This document defines the complete testing strategy for the Wolverine Intelligence project. Every subsystem must be rigorously tested to ensure data integrity, verifiable provenance, and calibrated attribution.

## 1. Testing Philosophy

The system must guarantee that observations are never corrupted, that AI does not poison factual databases, and that attribution confidence is mathematically sound. The testing pipeline reflects these guarantees.

## 2. Test Categories

### 2.1 Unit Tests
*   **Purpose:** Test individual functions and modules in isolation.
*   **Coverage:** Normalization functions, hash computations, feature extraction algorithms, string similarity calculations.
*   **Framework:** Jest (TypeScript/Frontend), `pytest` (Python/Backend/ML).
*   **Procedure:** Execute pure functions with varied inputs.
*   **Expected Result:** All assertions pass; edge cases (nulls, malformed strings, UTF-8 boundaries) are handled gracefully.
*   **Failure Condition:** Any assertion failure, unhandled exception, or unexpected NaN result.

### 2.2 Schema Tests
*   **Purpose:** Verify database schema integrity and relations.
*   **Coverage:** All tables exist, foreign key constraints enforced, indexes present, unique constraints active.
*   **Procedure:** Run Prisma `validate`, deploy schema to test DB, attempt constraint violations (e.g., inserting orphaned records).
*   **Expected Result:** Schema exactly matches specification; invalid data insertion is rejected by the database.
*   **Failure Condition:** Missing table, wrong constraint, missing index, silent acceptance of invalid relational data.

### 2.3 Dataset Tests
*   **Purpose:** Verify dataset adapters correctly transform raw third-party records.
*   **Coverage:** Each dataset adapter, schema mapping logic, validation logic.
*   **Procedure:** Load sample raw records (JSON/CSV), run through adapter, verify canonical output.
*   **Expected Result:** Canonical output matches expected structure, no dropped critical fields.
*   **Failure Condition:** Missing required fields, wrong type casting, broken mappings.

### 2.4 Feature Tests
*   **Purpose:** Verify feature extraction produces correct mathematical values for the ML pipeline.
*   **Coverage:** Identity, text, behavior, graph, market, and infrastructure features.
*   **Procedure:** Feed known input data $\rightarrow$ compute features $\rightarrow$ assert against known feature vector.
*   **Expected Result:** Feature values within expected ranges [0,1], normalization is mathematically correct.
*   **Failure Condition:** Feature out of range, generation of `NaN` or `Infinity`, incorrect normalization.

### 2.5 Model Tests
*   **Purpose:** Verify attribution model produces calibrated probabilistic outputs.
*   **Coverage:** Training loops, inference logic, probability calibration.
*   **Procedure:** Train model on synthetic data with known ground-truth labels. Evaluate metrics on holdout set.
*   **Expected Result:** AUC-ROC > 0.85; Calibration error (Brier Score) < threshold.
*   **Failure Condition:** Poor performance metrics, miscalibrated probabilities (e.g., predicting 99% confidence on random noise).

### 2.6 Integration Tests
*   **Purpose:** Verify end-to-end component communication (Collector $\rightarrow$ DB $\rightarrow$ Analysis $\rightarrow$ API).
*   **Coverage:** Network adapters with local test site simulators.
*   **Procedure:** Run collector against simulated test site, verify database state updates, query API for results.
*   **Expected Result:** Pipeline successfully produces correct canonical records observable via API.
*   **Failure Condition:** Missing records, broken normalization in transit, API 500 errors.

### 2.7 Collector Tests
*   **Purpose:** Verify each network adapter against specific network semantics.
*   **Coverage:** TorAdapter, I2PAdapter, ZeroNetAdapter, FreenetAdapter, ClearnetAdapter, DatasetAdapter.
*   **Procedure:** Adapter discovers simulated test site, performs scraping, normalizes data.
*   **Expected Result:** Correct artifacts and observations produced with appropriate network metadata.
*   **Failure Condition:** Connection failure handling missing, wrong normalization, missing provenance tracking.

### 2.8 Graph Tests
*   **Purpose:** Verify graph operations scale and return correct structural data.
*   **Coverage:** Graph API, shortest path traversal, Louvain community detection.
*   **Procedure:** Load a known graph topology into GraphDB, execute queries, verify results.
*   **Expected Result:** Correct neighbors identified, valid shortest paths returned, logical communities formed.
*   **Failure Condition:** Missing edges, infinite loops in traversal, incorrect pathing.

### 2.9 Scanner Tests
*   **Purpose:** Verify scanner adapters (e.g., Nmap, Nikto integrations) produce correct findings.
*   **Coverage:** Each scanner wrapper/adapter.
*   **Procedure:** Run scanner against known vulnerable test target (e.g., Metasploitable container).
*   **Expected Result:** Correct findings generated and normalized to platform Indicators.
*   **Failure Condition:** Missing obvious findings, parsing failures of scanner output.

### 2.10 Wolverine Tests (Cryptographic Evidence)
*   **Purpose:** Verify cryptographic evidence pipeline and Besu blockchain anchoring.
*   **Coverage:** Canonicalization, hashing (SHA-256), Merkle tree generation, smart contract attestation, verification logic.
*   **Procedure:** 
    1. Create observations.
    2. Attest to chain.
    3. Verify unmodified data (must pass).
    4. Tamper with DB record.
    5. Verify modified data (must fail).
*   **Expected Result:** Strict detection of any data tampering.
*   **Failure Condition:** False positive (flags unmodified data), false negative (fails to detect tampered data).

### 2.11 End-to-End Tests
*   **Purpose:** Verify complete system flow from raw network ingestion to UI rendering payload.
*   **Coverage:** Master trace examples.
*   **Procedure:** Spin up full stack. Inject data at edge. Poll API until data propagates. Verify payload structure.
*   **Expected Result:** Data is observable at every stage and structurally sound at the API edge.
*   **Failure Condition:** Any stage hangs, produces incorrect output, or loses provenance tracing.

### 2.12 Reproducibility Tests
*   **Purpose:** Verify the system can be deployed reliably on a clean machine.
*   **Coverage:** `docker-compose.yml`, setup scripts, DB migrations, ML model weights fetching.
*   **Procedure:** Provision fresh ephemeral VM (e.g., Ubuntu). Clone repo. Run `make setup`. Verify `make test` passes.
*   **Expected Result:** All components functional within SLA without manual intervention.
*   **Failure Condition:** Missing implicit dependency, broken setup script, non-reproducible model environment.

## 3. Test Data Management

*   **Synthetic Data Generators:** The system includes scripts to generate fake dark web forums, actors, and PGP keys with known overlapping features to test the attribution model.
*   **Fixtures:** Static JSON responses representing raw scrapes are stored in `tests/fixtures/` to test normalization logic without needing live network access.
*   **Seed Data:** `Prisma seed` is configured to load a baseline dataset for UI and API testing.

## 4. CI/CD Integration

*   **On Commit (Pre-push):** Unit Tests, Schema Tests, Feature Tests. (Fast, no external dependencies).
*   **On Pull Request:** Integration Tests, Graph Tests, Collector Tests (against simulators), Wolverine Tests (against local ephemeral Besu node).
*   **Nightly Build:** Model Tests (retraining/evaluation), Full End-to-End Tests, Reproducibility Tests (runs in clean VM runner).
*   **Infrastructure Requirements:** GitLab CI / GitHub Actions runners must support `docker-compose` for integration environments.

## 5. Test Directory Structure

```text
tests/
├── unit/             # Pure function tests (normalization, hashing)
├── schema/           # Database schema validations
├── dataset/          # Dataset adapter transformation tests
├── feature/          # Feature extraction tests
├── model/            # Model training and calibration tests
├── integration/      # Multi-component tests
├── collector/        # Network adapter tests (Tor, I2P, etc.)
├── graph/            # Graph traversal and algorithm tests
├── scanner/          # Infrastructure scanning tests
├── wolverine/        # Blockchain and cryptographic proof tests
├── e2e/              # Full pipeline tests
├── reproducibility/  # Clean-slate deployment tests
└── fixtures/         # Static test data and mocks
```

## 6. Operability: Running Tests

Developers can execute tests using the standard Make toolchain:
*   `make test-unit`: Runs only unit tests.
*   `make test-integration`: Spins up test DB/Besu node and runs integration suite.
*   `make test-all`: Runs the complete suite (requires Docker).
*   `make test-coverage`: Generates HTML coverage reports.
