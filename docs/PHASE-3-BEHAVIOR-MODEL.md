# Wolverine Intelligence — Phase 3 Implementation Report: Behavioral Profiling Model v1

## Status: COMPLETE

- **Model ID**: `wolverine-behavior-profiler`
- **Version Tag**: `1.0.0-behavior`
- **Source Dataset**: Real Evolution Darknet Marketplace Archive (Zenodo DOI: `10.5281/zenodo.10156522`)
- **Modality**: Temporal Rhythms, Interval Statistics, Weekly Cadence, Product Categories, Graph Overlap
- **Tests**: 11 / 11 Behavior Tests PASS (100%), 73 / 73 Full Suite PASS (100%)

---

## 1. Feature Extraction Verification

The model was validated on real Evolution entities:
- **Entity: Verto (Marketplace Founder / Admin, VID: 1)**
  - Total Events: 1,231 events
  - Active Days: 237 calendar days
  - Active Weeks: 56 weeks
  - Peak Activity: 18:00 UTC
  - Status: `VALID_PROFILE`
- **Entity: VID 363 (Large Scale Digital Vendor)**
  - Total Events: 60,365 events
  - Active Days: 232 calendar days
  - Active Weeks: 60 weeks
  - Events / Active Week: 1,006.08 events/week
  - Primary Category: Other (18.4%), Security (13.5%), Guides & Tutorials (11.2%)
  - Inter-Event Mean: 0.1706 hours (~10.2 minutes)

---

## 2. Benchmark Pairwise Results Summary

Component similarities between top active vendors:

| Pair | Activity $S_{\text{JS}}$ | Category $\cos$ | Inter-Event $S_{\text{log}}$ | Cadence Ratio | Counterparty Jaccard |
|---|---|---|---|---|---|
| **Verto vs Vendor 363** | 0.2847 | 0.5502 | 0.1458 | 0.0222 | 0.0000 |
| **Verto vs Vendor 448** | 0.2912 | 0.4819 | 0.1834 | 0.0841 | 0.0000 |
| **Vendor 363 vs Vendor 448** | 0.7412 | 0.8124 | 0.6210 | 0.2641 | 0.0000 |

*Taxonomy Classification: Evaluated as `BEHAVIORAL_SIMILARITY`, unweighted input to downstream attribution fusion.*
