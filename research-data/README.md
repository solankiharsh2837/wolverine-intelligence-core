# Wolverine Intelligence — Research Data Lake (Domain A)

This directory houses the **Research Data Lake (Domain A)**, strictly decoupled from the **Operational Intelligence Database (Domain B)** and the **Wolverine Trust Store (Domain C)**.

## Architectural Boundary Law
- **Domain A (This Directory)**: Stores immutable raw research files, dataset manifests, extraction pipelines, profiling reports, train/val/test splits, deterministic feature artifacts, and synthetic calibration distribution parameters.
- **Domain B (PostgreSQL)**: Stores runtime operational intelligence (Actors, Personas, Identifiers, Observations, Relationships). Raw research corpora MUST NOT be dumped into PostgreSQL.
- **Domain C (Wolverine Trust)**: Stores cryptographic Merkle roots, attestation signatures, and Hyperledger Besu on-chain trust receipts.

## Subdirectories per Dataset
Each dataset directory contains:
- `metadata.json`: Authoritative dataset metadata, licensing, and schema definitions.
- `manifest.json`: Cryptographic file registry containing SHA-256 hashes, byte sizes, and timestamps.
- `raw/`: Immutable raw files or archives (never modified in-place).
- `extracted/`: Extracted and parsed tabular/JSON representations.
- `processed/`: Cleaned train/validation/test splits and normalized research records.
- `fixtures/`: Deterministic test fixtures derived from verified real datasets (`REAL_DATASET_DERIVED_FIXTURE`).
- `reports/`: Machine-readable profiling JSONs and human-readable quality reports.
