# Wolverine Intelligence — Research Data Architecture (3-Domain Model)

## 1. Executive Summary & Domain Separation Law

To prevent the corruption of the operational intelligence graph with static raw research corpora, **Wolverine Intelligence** establishes a strict **Three-Domain Data Architecture**:

```mermaid
flowchart TD
    subgraph DomainA [Domain A: Research Data Lake (Filesystem / Object Storage)]
        RawFiles[Immutable Raw Datasets\nEvolution, VeriDark, NICT, Darknet Surfing]
        Manifests[File Manifests & SHA-256 Hashes]
        Profiler[Dataset Profiling & Quality Metrics]
        FeatureEng[Deterministic Feature Extraction]
        Splits[Train / Val / Test Disjoint Splits]
        Calibration[Synthetic World Calibration Distributions]

        RawFiles --> Manifests --> Profiler --> FeatureEng --> Splits --> Calibration
    end

    subgraph DomainB [Domain B: Operational Intelligence Database (PostgreSQL)]
        DatasetCatalog[Dataset & Model Catalog (Metadata Only)]
        RuntimeGraph[Threat Intelligence Graph\nActors, Personas, Identifiers, Observations, Relationships]
    end

    subgraph DomainC [Domain C: Wolverine Trust Store]
        WolverineProof[Merkle Tree Construction & Attestation]
        BesuLedger[Hyperledger Besu On-Chain Anchor Receipts]
    end

    Splits -->|Baseline Model Weights| BaselineModels[Classical ML Models\nLogistic Attribution, SVM Stylometry]
    BaselineModels --> ModelReg[Model Version Registry]
    ModelReg --> DatasetCatalog
    Calibration -->|Distribution Parameters| SyntheticSim[Synthetic World Simulators]
    SyntheticSim -->|Simulated Events| RuntimeGraph
    LiveCollectors[Live Overlay Collectors] -->|Ingested Observations| RuntimeGraph
    RuntimeGraph --> WolverineProof --> BesuLedger
```

---

## 2. The Three Distinct Data Domains

### Domain A: Research Data Lake (`research-data/`)
- **Storage Medium**: Filesystem / Cloud Object Store (S3, GCS, Ceph).
- **Contents**: Raw historical dumps, CSV/JSON/SQLite archives, file manifests, SHA-256 checksums, profiling reports, train/validation/test partitions, feature vectors, and synthetic calibration distribution parameters.
- **Immutability Law**: Raw files are read-only and NEVER edited in-place.
- **Scope**: Used for ML model training, feature baseline benchmarking, and parameter calibration. Raw records from this layer **MUST NEVER** be dumped into PostgreSQL.

### Domain B: Operational Intelligence Database (PostgreSQL)
- **Storage Medium**: PostgreSQL 15+ with Prisma ORM.
- **Contents**: Runtime threat intelligence observations, extracted identifiers, resolved personas, high-level actor records, graph relationships, infrastructure scan findings, timeline events, and attribution candidates.
- **Source of Observations**: Live network collectors (Tor, I2P, ZeroNet, Freenet, Clearnet) and calibrated synthetic world simulations.
- **Research Role**: PostgreSQL stores only **Metadata Catalog Entries** for registered datasets (`datasets` table) and trained models (`model_versions` table).

### Domain C: Wolverine Trust Store
- **Storage Medium**: Cryptographic Merkle State + Hyperledger Besu Private Ledger.
- **Contents**: Observation payload hashes, binary Merkle roots ($R_w$), ECDSA secp256k1 attestation signatures, and on-chain block receipts.
- **Role**: Guarantees non-repudiation and structural integrity ($R_c = R_w$) without replacing PostgreSQL or storing full payload text on-chain.

---

## 3. Directory Layout of the Research Data Lake

```
wolverine-intelligence/
├── research-data/
│   ├── registry/
│   │   └── datasets.json               <- Authoritative dataset catalog
│   ├── manifests/                      <- Checksum registries
│   ├── raw/                            <- Immutable raw archives (gitignored)
│   ├── extracted/                      <- Parsed intermediate files
│   ├── processed/                      <- Normalized feature matrices & pairs
│   ├── fixtures/                       <- Tiny real-derived benchmark fixtures
│   ├── calibration/                    <- Computed synthetic parameter distributions
│   ├── reports/                        <- Machine & human profiling reports
│   ├── evolution/                      <- Evolution marketplace corpus
│   ├── veridark/                       <- VeriDark authorship verification pairs
│   ├── nict-darknet-2022/              <- NICT passive sensor flow telemetry
│   └── darknet-surfing/                <- Tor web crawl graph topology
```

---

## 4. Data Leakage Prevention Strategy

1. **Stylometric Authorship Partitioning**:
   - Model evaluation enforces strict **Author-Level Disjoint Splits**.
   - If author $A$ appears in the training set, zero text samples from author $A$ may appear in validation or test sets ($\text{Authors}_{\text{train}} \cap \text{Authors}_{\text{test}} = \emptyset$).
2. **Graph Model Partitioning**:
   - Split networks across independent connected components to avoid adjacency leakage.
3. **Temporal Causal Partitioning**:
   - Time-series behavior and marketplace events enforce strict forward chronological cutoffs ($t_{\text{test}} > t_{\text{train}}$) to prevent future data from leaking into past predictions.
