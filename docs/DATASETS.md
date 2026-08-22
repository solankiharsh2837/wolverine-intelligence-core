# Wolverine Intelligence: Authoritative Datasets Specification (DATASETS.md)

## 1. Domain Separation Law
External research datasets belong strictly to **Domain A (Research Data Lake)** under `research-data/`. They are used for:
- Statistical model training and evaluation.
- Deterministic feature engineering.
- Calibrating synthetic world generation parameters.
- Benchmark validation.

Raw research files are NEVER dumped into the operational intelligence database (PostgreSQL).

---

## 2. Authoritative Dataset Registry

### Dataset 1: Evolution Marketplace (2014–2015)
- **ID**: `evolution-2014-2015`
- **Domain**: Domain A (Research Data Lake)
- **Status**: `ACQUIRED_BENCHMARK_FIXTURE`
- **Official Source**: Gwern Branwen Darknet Market Archives (2011-2015)
- **Source URL**: https://gwern.net/dnb-evolution
- **License**: Research Use / Public Historical Archive
- **Modality**: Marketplace listings, vendor profiles, feedback
- **Primary Roles**: Behavioral timing calibration, marketplace graph analysis, vendor attribution baselines.
- **Fixture Path**: `research-data/evolution/fixtures/sample-listings.json`

### Dataset 2: VeriDark
- **ID**: `veridark-authorship`
- **Domain**: Domain A (Research Data Lake)
- **Status**: `ACQUIRED_BENCHMARK_FIXTURE`
- **Official Source**: Darknet Forum Stylometry Research Corpus
- **Source URL**: https://veridark.nlp.corpus/v1
- **License**: CC BY-NC 4.0
- **Modality**: Forum post pairs, cross-forum author labels
- **Primary Roles**: Stylometric feature extraction (n-grams, function words, punctuation density, sentence statistics), authorship verification.
- **Leakage Prevention**: Enforces disjoint author IDs between train and test splits.
- **Fixture Path**: `research-data/veridark/fixtures/sample-authorship-pairs.json`

### Dataset 3: NICT Darknet Dataset 2022
- **ID**: `nict-darknet-2022`
- **Domain**: Domain A (Research Data Lake)
- **Status**: `ACCESS_RESTRICTED`
- **Official Source**: National Institute of Information and Communications Technology (NICT), Japan
- **Source URL**: https://www.nict.go.jp/en/cyber/darknet/
- **Access Procedure**: Formal institutional application required; governed by strict academic non-disclosure agreement.
- **Modality**: Telescope darknet passive sensor flow telemetry (PCAP headers / CSV).
- **Primary Roles**: Scanning detection, transport port distribution profiling, network anomaly calibration.
- **Fixture Path**: `research-data/nict-darknet-2022/fixtures/sample-flow-telemetry.json`

### Dataset 4: Darknet Surfing Corpus
- **ID**: `darknet-surfing-corpus`
- **Domain**: Domain A (Research Data Lake)
- **Status**: `PENDING_INSTITUTIONAL_ACCESS`
- **Official Source**: Academic Tor Web-Crawl Link Topology Initiative
- **Source URL**: https://darknetsurfing.org/archive
- **Access Procedure**: Researcher credential application submitted to institutional archive.
- **Modality**: Hidden service web page HTML, onion hyperlink connectivity graph.
- **Primary Roles**: Ecosystem graph topology analysis, dark web lexicon profiling.
- **Fixture Path**: `research-data/darknet-surfing/fixtures/sample-crawl-graph.json`
