# Wolverine Intelligence: Datasets Specification

This document defines the dataset registry, per-dataset metadata, and dataset integration strategy for the Wolverine Intelligence platform.

## 1. Dataset Philosophy

Real datasets provide ground truth for training, validation, and calibration of the Wolverine Intelligence system.

- **Honest Attribution Constraints**: Not every dataset supports actor attribution. Each dataset's specific capabilities and limitations MUST be clearly documented.
- **Systematic Registration**: Datasets are versioned and registered in the system's registry.
- **Transformation Strategy**: Raw dataset records are transformed into canonical observations via a specific `DatasetAdapter`.
- **Synthetic Calibration**: Synthetic data is rigorously calibrated against the distributions of real datasets to ensure realistic representations.
- **AI Boundary**: AI is NEVER the hidden source of truth. Every observation and inferred relationship must be traceable back to its originating dataset.

## 2. Dataset Registry

### Dataset 1: Evolution Marketplace (2014–2015)

- **Dataset ID**: `evolution-2014-2015`
- **Official Source**: Academic archives and leaked marketplace dumps (e.g., Gwern's Darknet Market Archives).
- **License/Terms**: Public domain / Research use only.
- **Download Procedure**:
  1. Request access from authorized academic repositories or download via specified darknet archive torrents.
  2. Decrypt archives and extract tabular files.
- **Format**: CSV and SQLite database dumps.
- **Schema**:
  | Field | Type | Required | Description | Constraints |
  |-------|------|----------|-------------|-------------|
  | `item_id` | String | Yes | Unique listing identifier | alphanumeric |
  | `vendor_name` | String | Yes | Vendor alias | - |
  | `category` | String | No | Listing category | e.g., "Drugs", "Digital" |
  | `description` | Text | Yes | Item description | may contain PGP keys |
  | `price_btc` | Decimal | Yes | Item price in Bitcoin | > 0 |
  | `scrape_date` | Date | Yes | Date of observation | between 2014-2015 |
- **Size**: ~1.2M listings, ~50K vendors, ~5M reviews.
- **Modality**: Marketplace listings, vendor profiles, user reviews.
- **Task**: Vendor attribution, writing style analysis, marketplace behavior modeling.
- **Limitations**: Single marketplace, limited to a specific time period (2014-2015), may contain non-actor PII.
- **Privacy Concerns**: High risk of containing unredacted PII in reviews or descriptions. Requires rigorous scrubbing of buyer data.
- **Train/Test Suitability**: Excellent for marketplace behavior features and vendor style analysis (Stylometry).
- **Leakage Risk**: High risk of cross-contamination if test set vendors overlap with other darknet dataset training splits.
- **Usage**: Training, validation, feature engineering, and synthetic calibration.

### Dataset 2: Darknet Surfing

- **Dataset ID**: `darknet-surfing-corpus`
- **Official Source**: Derived from academic web-crawling initiatives of TOR hidden services.
- **License/Terms**: Academic research license.
- **Download Procedure**: Provided upon request by the original academic authors or via institutional access.
- **Format**: JSON Lines (JSONL).
- **Schema**:
  | Field | Type | Required | Description | Constraints |
  |-------|------|----------|-------------|-------------|
  | `onion_address` | String | Yes | v2 or v3 Onion URL | `.onion` suffix |
  | `html_content` | Text | Yes | Raw HTML body | - |
  | `timestamp` | Datetime | Yes | Crawl time | ISO8601 |
  | `inbound_links` | Array(String) | No | List of referring onions | - |
- **Size**: ~200K unique pages, ~5M links.
- **Modality**: Web page content, network graph.
- **Task**: Hidden service categorization, link analysis, ecosystem mapping.
- **Limitations**: High noise ratio, incomplete crawls due to bot protection, many dead links, heavily skewed towards forums rather than modern dynamic markets.
- **Privacy Concerns**: May capture unintended private user content on open forums.
- **Train/Test Suitability**: Suitable for NLP-based classification and graph-based anomaly detection.
- **Leakage Risk**: Moderate. Graph splits must strictly avoid overlapping connected components.
- **Usage**: Pretraining language models on dark web lexicon, infrastructure link analysis.

### Dataset 3: NICT Darknet Dataset 2022

> [!WARNING]
> This dataset contains **NETWORK TRAFFIC** data, not marketplace or forum data. It maps to `NetworkObservation`, NOT marketplace observations.

- **Dataset ID**: `nict-darknet-2022`
- **Official Source**: National Institute of Information and Communications Technology (NICT).
- **License/Terms**: Strictly controlled academic license; NDA required.
- **Download Procedure**: Formal application via NICT portal, secure FTP transfer.
- **Format**: PCAP and aggregated flow summaries (CSV).
- **Schema**:
  | Field | Type | Required | Description | Constraints |
  |-------|------|----------|-------------|-------------|
  | `src_ip` | String | Yes | Source IP (anonymized) | IPv4/IPv6 |
  | `dst_port` | Integer | Yes | Destination Port | 1-65535 |
  | `protocol` | String | Yes | Transport Protocol | TCP/UDP/ICMP |
  | `packet_count` | Integer | Yes | Packets in flow | > 0 |
  | `timestamp` | Datetime | Yes | Flow start time | 2022 range |
- **Size**: ~500GB PCAP, ~2B flow records.
- **Modality**: Network packet headers and flows.
- **Task**: Traffic analysis, temporal patterns, infrastructure fingerprinting (e.g., scanning behavior).
- **Limitations**: Completely anonymized payload. **NOT useful for:** actor attribution, stylometry, or marketplace behavior.
- **Privacy Concerns**: Low, due to strict payload stripping and IP anonymization by the provider.
- **Train/Test Suitability**: Excellent for detecting large-scale scanning, DDoS backscatter, and infrastructure setup.
- **Leakage Risk**: Low risk of overlap with application-layer datasets.
- **Usage**: Infrastructure analysis, network anomaly detection.

### Dataset 4: VeriDark

> [!NOTE]
> This is an **AUTHORSHIP** dataset. It maps to `AuthorshipTrainingExample` and is strictly used for ML training and evaluation, not operational intelligence.

- **Dataset ID**: `veridark-authorship`
- **Official Source**: VeriDark Project Repository.
- **License/Terms**: Open for non-commercial research.
- **Download Procedure**: Direct download from the project's GitHub repository or Zenodo.
- **Format**: JSON.
- **Schema**:
  | Field | Type | Required | Description | Constraints |
  |-------|------|----------|-------------|-------------|
  | `author_id` | String | Yes | Anonymized author identifier | - |
  | `text` | Text | Yes | Forum post or message | min 50 words |
  | `domain` | String | Yes | Source forum/domain | e.g., "HackForums" |
  | `timestamp` | Datetime | No | Time of posting | - |
- **Size**: ~10,000 authors, ~500,000 texts.
- **Modality**: Short to medium length text posts.
- **Task**: Authorship verification, stylometric modeling.
- **Limitations**: Heavily skewed towards specific forums; styles may not generalize to distinct darknet marketplaces.
- **Cross-author splits**: Available natively (e.g., rigorous separation of seen vs. unseen authors in test sets).
- **Domain/forum splits**: Provided for cross-domain evaluation (e.g., train on Forum A, test on Forum B).
- **Privacy Concerns**: Text may contain personal rants or identifiable anecdotes, though author identities are anonymized.
- **Usage**: Training and evaluating stylometry models.

## 3. Dataset Adapter Architecture

The `DatasetAdapter` interface ensures that datasets are transformed into the canonical observation models expected by the Wolverine Intelligence platform. Incompatible datasets are *not* forced into a fake common structure; they map to distinct domain entities respecting their native semantics.

```typescript
interface DatasetAdapter {
  datasetId: string;
  version: string;
  load(config: DatasetConfig): DatasetIterator;
  validate(record: any): ValidationResult;
  toCanonical(record: any): CanonicalRecord[];
  getSchema(): DatasetSchema;
  getStatistics(): DatasetStatistics;
}
```

### Mapping Examples

1. **Evolution Marketplace Adapter**
   - *Input*: CSV row (item, description, vendor, PGP key).
   - *Output*:
     - `Artifact` (The listing text, OBSERVED)
     - `Observation` (The sighting of the listing, OBSERVED)
     - `Identifier` (The vendor's alias and PGP key, OBSERVED)
     - `Relationship` (Vendor controls Listing, DETERMINISTIC_MATCH)

2. **NICT Darknet Adapter**
   - *Input*: Flow summary record.
   - *Output*:
     - `NetworkObservation` (A canonical form distinct from marketplace observations, representing a scanning event or connection, OBSERVED).

3. **VeriDark Adapter**
   - *Input*: JSON text snippet.
   - *Output*:
     - `AuthorshipTrainingExample` (Directly fed into ML pipelines, bypassing intelligence graph indexing).

## 4. Dataset Quality Framework

Every dataset ingested must be evaluated against the following quality dimensions:

- **Completeness Scoring**: Percentage of records missing critical fields (e.g., missing PGP keys or timestamps).
- **Consistency Checks**: Validation that chronological sequences make sense (e.g., reviews are not dated before listings are created).
- **Temporal Coverage Analysis**: Identification of gaps or outages in the dataset's timeline (e.g., a two-month gap in marketplace scrapes).
- **Schema Validation**: Strict type checking and constraint enforcement during the `load()` and `validate()` phases.
- **Duplicate Detection**: Identifying overlapping scrapes using hashing on canonical forms.
- **Cross-dataset Overlap Detection**: Using Locality-Sensitive Hashing (LSH) or exact ID matching to detect if the same data exists in multiple datasets (e.g., a vendor in both Evolution and Darknet Surfing) to prevent data leakage in training.

## 5. Dataset Versioning

- **Version Tracking**: Datasets are versioned using a combination of the source release tag and an internal processing increment (e.g., `evolution-2014-2015-v1.2`).
- **Reprocessing Triggers**: If a `DatasetAdapter` is updated (e.g., extracting a new feature like PGP keys from descriptions), the dataset version is bumped. This triggers a pipeline to re-run `toCanonical()` and update the downstream databases.
- **Lineage Tracking**:
  - `Raw`: Unaltered source data (immutable).
  - `Normalized`: Schema-conforming records parsed by the adapter.
  - `Processed`: Canonical records (`Observation`, `Identifier`, etc.) mapped into the system graph.

## 6. Ethical Guidelines

- **PII Handling**: Scrubbing routines must target and redact unencrypted Personally Identifiable Information (emails, phone numbers, addresses) of non-actors (e.g., buyers whose addresses leaked).
- **License Compliance**: Datasets must ONLY be used in accordance with their research, academic, or open-source licenses. No commercial exploitation of restricted academic datasets.
- **Responsible Use**: Data modeling should not be used to deanonymize vulnerable populations; the focus is exclusively on identifying malicious threat actors and understanding structural intelligence.
- **Provenance Documentation**: Every canonical record must retain a `source_dataset_id` and `source_record_id`. AI is never the hidden source of truth, and every fact must trace back to its origin.

## 7. Future Dataset Candidates

### Potential Candidates

1. **CIC-Darknet2020**
   - *Assessment*: Useful for distinguishing darknet vs. clear-web traffic at the application layer.
   - *Mapping*: `NetworkObservation`.
2. **Kaggle Tor Hidden Services**
   - *Assessment*: Useful for testing HTML parsing and basic entity extraction on older Tor sites.
   - *Mapping*: `Artifact`, `Observation`.

### Inclusion Criteria

To be included in the Wolverine Intelligence registry, a candidate dataset must:
1. Provide a clear, verifiable provenance.
2. Serve a distinct, documented purpose (attribution, infrastructure mapping, or stylometry).
3. Not violate explicit ethical or legal boundaries regarding data acquisition.
4. Have a defined mapping to an existing Canonical Record type without breaking native semantics.
