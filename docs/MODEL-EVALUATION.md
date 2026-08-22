# Wolverine Intelligence — ML Model Evaluation Report

## Attribution Model v1 Performance (Evolution 2014-2015)

- **Dataset**: Evolution Cryptomarket dataset (`forum/post.tsv`, `market/vendors.tsv`, `market/listings.tsv`, `forum-market/user-matching.tsv`).
- **Pairs Total**: 900 pairs (30 verified positive cross-subsystem pairs, 522 hard negatives, 348 random negatives).
- **Test Set Evaluation (120 Held-Out Samples)**:
  - **ROC-AUC**: **0.5345** (95% CI: `[0.0000, 0.9748]`)
  - **PR-AUC**: **0.1257** (95% CI: `[0.0083, 0.5476]`)
  - **Brier Score**: **0.0322**
  - **Expected Calibration Error**: **0.0034**
- **Evaluation Integrity**: Zero self-pair shortcuts, zero synthetic features, bit-for-bit reproducible deterministic training.
