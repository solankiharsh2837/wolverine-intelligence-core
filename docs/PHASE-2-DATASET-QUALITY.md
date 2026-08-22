# Wolverine Intelligence — Phase 2 Dataset Quality & Profiling Report

## Summary
- **Execution Date**: 2026-08-22
- **Tracked Research Datasets**: 4
- **Manifest Checksum Verification Rate**: 100% (All files match SHA-256)
- **Data Leakage Risk**: Mitigated via author-disjoint and chronological forward partitioning.

---

## 1. Dataset Quality Matrix

| Dataset ID | Status | Tracked Files | Verified Hashes | Null Rate (Key Fields) | Avg Text Length | Primary Use Case |
|---|---|---|---|---|---|---|
| `evolution-2014-2015` | `ACQUIRED_BENCHMARK_FIXTURE` | 2 | `aa0750c0...`, `159fa114...` | 0.00% | 85.2 chars | Behavioral profiling, marketplace graphs |
| `veridark-authorship` | `ACQUIRED_BENCHMARK_FIXTURE` | 1 | `432df2d0...` | 0.00% | 132.7 chars | Stylometry, cross-author verification |
| `nict-darknet-2022` | `ACCESS_RESTRICTED` | 1 | `2089f32d...` | 0.00% | N/A (Flows) | Transport scanning, telemetry profiling |
| `darknet-surfing-corpus` | `PENDING_INSTITUTIONAL_ACCESS` | 1 | `29891383...` | 0.00% | 33.0 chars | Link topology, graph connectivity |

---

## 2. Profiling Outputs Generated
- `research-data/evolution/reports/sample-listings.profile.json`
- `research-data/evolution/reports/sample-vendors.profile.json`
- `research-data/veridark/reports/sample-authorship-pairs.profile.json`
- `research-data/nict-darknet-2022/reports/sample-flow-telemetry.profile.json`
- `research-data/darknet-surfing/reports/sample-crawl-graph.profile.json`
