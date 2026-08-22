# Wolverine Intelligence — Research Data Lake (Domain A)

This directory houses the **Research Data Lake (Domain A)**, strictly decoupled from the **Operational Intelligence Database (Domain B)** and the **Wolverine Trust Store (Domain C)**.

## Architectural Boundary Law
- **Domain A (This Directory)**: Stores raw research files, dataset manifests, extraction pipelines, profiling reports, train/val/test splits, deterministic feature artifacts, and synthetic calibration distribution parameters.
- **Domain B (PostgreSQL)**: Stores runtime operational intelligence (Actors, Personas, Identifiers, Observations, Relationships). Raw research corpora MUST NOT be dumped into PostgreSQL.
- **Domain C (Wolverine Trust)**: Stores cryptographic Merkle roots, attestation signatures, and Hyperledger Besu on-chain trust receipts.

## Dataset Provenance & Honesty Standards
Every fixture and dataset tracked in Domain A adheres to strict taxonomy:
1. `REAL_DATASET_DERIVED_FIXTURE`: Permitted ONLY when an actual verified raw archive is acquired, hashed, and tracked under `research-data/<dataset>/raw/` with exact `sourceFile`, `sourceFileSha256`, and `sourceRow` provenance.
2. `SYNTHETIC_TEST_FIXTURE`: Labeled explicitly for tests and algorithmic validation where the upstream dataset is access-restricted or pending approval.
3. `OFFICIAL_SCHEMA_SPECIFICATION_FIXTURE`: Strictly reflects the publisher's official documented schema (e.g., NICT Darknet 2022) without inventing unsupported fields.

## Authoritative Dataset Inventory

| Dataset | Official Source | Status | Modality | Raw Storage |
|---|---|---|---|---|
| **Evolution** (2014–2015) | Boekhout, Blokland, Takes (Leiden / NSCR), Zenodo 10156522 | `ACQUIRED_RAW_ARCHIVE` | Marketplace & Communication Graph | `evolution/raw/evolution_zenodo_10156522.zip` |
| **VeriDark** | Manolache et al. (Bitdefender / Univ. Bucharest), NeurIPS 2022, Zenodo 6998371 | `ACCESS_RESTRICTED` | Authorship Forum Post Pairs | Access Request Required via Zenodo |
| **NICT Darknet 2022** | National Institute of Information and Communications Technology (NICT), Japan | `ACCESS_RESTRICTED` | TCP-SYN Darknet Telescope Sensor Traffic | Formal Email Application & Institutional NDA Required |
| **Darknet Surfing** | Darknet Surfing Academic Initiative | `PENDING_INSTITUTIONAL_ACCESS` | Hidden Service HTML & Hyperlink Graph | Institutional Repository Access Pending |
