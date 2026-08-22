# Wolverine Intelligence

**Multi-network dark-web threat-intelligence and attribution platform**

## Mission
Wolverine Intelligence is an advanced cyber threat intelligence and attribution system designed to ingest, normalize, and analyze data across multiple dark web networks and the clearnet. By employing rigorous evidence taxonomy, statistical attribution, AI-driven hypothesis generation, and cryptographic anchoring, Wolverine Intelligence enables analysts to trace threat actors across disparate environments with verifiable confidence.

## Design Philosophy
Wolverine is built on non-negotiable architectural principles designed to preserve trust, transparency, and analytical rigor.

- **The 5 Evidence Classes:** Every piece of data in the system is explicitly categorized as an OBSERVED FACT, INFERRED RELATIONSHIP, STATISTICAL ATTRIBUTION, AI HYPOTHESIS, or CRYPTOGRAPHIC PROOF.
- **No Hidden AI Truth:** AI is NEVER the hidden source of truth. AI operates on explicitly defined data, generates hypotheses that reference existing database IDs, and is always presented as an assistant requiring human review, never as an unverified oracle.
- **Layer-by-Layer Understandability:** The system is explicitly designed for human operability. Every observation must be reproducible from its provenance, every relationship must cite its evidence, and intermediate states can be inspected, traced, and explained.

## Supported Networks
Wolverine collects and integrates data natively from:
- **Tor** (.onion sites)
- **I2P** (Invisible Internet Project)
- **ZeroNet**
- **Freenet**
- **Clearnet** (standard web)

## Core Capabilities
1. Multi-network ingestion (Tor, I2P, ZeroNet, Freenet, Clearnet)
2. Deterministic entity resolution (cross-network identity linking)
3. Stylometric analysis of textual artifacts
4. Behavioral pattern detection
5. Infrastructure and exposure scanning
6. Probabilistic attribution modeling
7. Cryptographic anchoring via Wolverine hashes and Besu
8. Synthetic environment generation for safe testing
9. Vulnerability correlation and fingerprinting
10. Generative AI integration (MiniCPM5) for hypothesis building
11. Verifiable provenance tracking
12. Complex graph-based relationship mapping
13. Extensible network and dataset adapters
14. Statistical model calibration and tuning
15. Full narrative and report generation
16. Developer API and REST endpoints
17. Interactive Analyst Frontend UI
18. Versioning across all analytical subsystems

## Repository Map
```text
/
├── frontend/               - React frontend application for analysts
├── backend/                - Node.js/TypeScript REST API and GraphQL server
├── database/               - PostgreSQL schema definitions, Prisma ORM setup, and migrations
├── collection/             - Data ingestion subsystems
│   ├── core/               - Core ingestion engine and canonical normalizers
│   ├── tor/                - Tor network adapters and scrapers
│   ├── i2p/                - I2P network adapters
│   ├── zeronet/            - ZeroNet adapters
│   ├── freenet/            - Freenet adapters
│   ├── clearnet/           - Clearnet scrapers and OSINT collectors
│   └── datasets/           - Adapters for static dataset ingestion
├── sites/                  - Target-specific scraping templates and logic
│   ├── tor/                - Tor marketplaces, forums, messaging, escrow
│   ├── i2p/                - I2P sites
│   ├── zeronet/            - ZeroNet zites
│   └── freenet/            - Freenet freesites
├── synthetic/              - Synthetic data and environment generation
│   ├── population/         - Synthetic persona generation
│   ├── personas/           - Detailed persona modeling
│   ├── activity/           - Traffic and activity simulation
│   └── calibration/        - Tools to calibrate synthetic data against real-world metrics
├── ml/                     - Machine learning and analysis models
│   ├── stylometry/         - Authorship attribution and linguistic analysis
│   ├── behavior/           - Behavioral fingerprinting (timing, action sequences)
│   ├── attribution/        - Statistical models for entity linkage
│   ├── infrastructure/     - Server and hosting infrastructure classification
│   └── common/             - Shared ML utilities and feature extraction
├── scanners/               - Active and passive network scanners
│   ├── fingerprinting/     - Service and OS fingerprinting
│   ├── exposure/           - Data leak and exposure detection
│   ├── vulnerability/      - CVE and exploit scanning
│   └── normalization/      - Scanner output normalization
├── wolverine/              - Trust and cryptographic anchoring (Wolverine hashes)
├── models/                 - External AI model integration
│   ├── manifests/          - Model configurations
│   ├── checkpoints/        - Local model weights (e.g., MiniCPM5)
│   └── evaluations/        - Model benchmarking and evaluation metrics
├── datasets/               - Local dataset storage
│   ├── raw/                - Unprocessed ingested data
│   ├── normalized/         - Canonicalized observations
│   ├── processed/          - Feature vectors and model inputs
│   └── metadata/           - Dataset provenance and catalogs
├── scripts/                - Utility, operational, and maintenance scripts
├── tests/                  - Unit, integration, and end-to-end test suites
├── docs/                   - System specifications and architectural documentation
└── docker/                 - Containerization and orchestration configurations
```

## Documentation Index
- [`docs/MASTER-ARCHITECTURE.md`](docs/MASTER-ARCHITECTURE.md) - The master system architecture diagram, subsystem definitions, and data flows.
- [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) - Canonical PostgreSQL data schema, Prisma configuration, and entity definitions.
- [`docs/IMPLEMENTATION-ROADMAP.md`](docs/IMPLEMENTATION-ROADMAP.md) - Master example trace and development milestones.

## Technology Stack
- **Database:** PostgreSQL + Prisma ORM
- **Trust Layer:** Hyperledger Besu (for anchoring)
- **AI/LLM:** MiniCPM5 (running locally for hypothesis generation)
- **Backend:** Node.js, TypeScript, Express/Fastify
- **Frontend:** React, TypeScript, TailwindCSS

## Quickstart for Developers
1. **Get Oriented:** Start by reading `docs/MASTER-ARCHITECTURE.md` to understand the system boundaries and design laws.
2. **Understand the Data:** Read `docs/DATA-MODEL.md` to learn how we structure observations and enforce provenance.
3. **Trace the Execution:** Follow the master example in `docs/IMPLEMENTATION-ROADMAP.md` to see how data flows from ingestion to AI attribution.
4. **Environment Setup:** (Implementation code pending. When ready, use `docker-compose up` in the `/docker` directory to spin up the PostgreSQL, Besu, and local ML services).

## Evidence Taxonomy Table

| Class | Meaning | Examples |
|---|---|---|
| OBSERVED | Directly witnessed from network/dataset source | Raw HTML, forum post content, timestamp, IP address |
| DETERMINISTIC_MATCH | Exact identifier reuse | Same PGP public key, identical Bitcoin address, identical email |
| STATISTICAL_MATCH | Feature-based probabilistic linkage | High confidence stylometry match between two forum accounts |
| AI_HYPOTHESIS | Generated by local AI model, requires human review | "Account A and B may be the same actor due to temporal correlation of posts mentioning specific exploit." |
| CRYPTOGRAPHIC_PROOF | Wolverine-attested, Besu-anchored | Merkle root of an evidence subgraph anchored on the Besu ledger |

## License / Status
**Status:** Hackathon Project, Active Specification Phase.
**License:** MIT (Subject to update based on specific organizational usage).
