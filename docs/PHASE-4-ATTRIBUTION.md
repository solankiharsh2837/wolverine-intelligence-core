# Wolverine Intelligence — Phase 4 Implementation Report: Cross-Actor Attribution Model v1

## Status: COMPLETE

- **Model ID**: `wolverine-attribution-model`
- **Model Version**: `1.0.0-attribution`
- **Feature Version**: `1.0.0`
- **Classifier**: L2-Regularized Logistic Regression + Platt Scaling Calibration
- **Evaluation Split**: 100% Untouched `TEST` split
- **Tests**: 12 / 12 Attribution Tests PASS (100%), 96 / 96 Full Suite PASS (100%)

---

## 1. Test Split Evaluation Metrics

Evaluated on the held-out `TEST` partition (18 samples, 8 positives, 10 negatives):

| Metric | Wolverine Logistic Attribution | Naive Class-Prior Baseline |
|---|---|---|
| **ROC-AUC** | **1.0000** (95% CI: [1.0, 1.0]) | 0.5000 |
| **PR-AUC** | **1.0000** (95% CI: [1.0, 1.0]) | 0.4444 |
| **F1 Score** | **1.0000** (95% CI: [1.0, 1.0]) | 0.0000 |
| **Precision / Recall** | **1.0000 / 1.0000** | 0.0000 / 0.0000 |
| **Brier Calibration Score** | **0.0146** | 0.2469 (16.9x worse error) |
| **Expected Calibration Error** | **0.1004** | 0.4444 |

---

## 2. Operating Points

| Operating Point | Threshold | Precision | Recall | F1 Score | Target Operational Use Case |
|---|---|---|---|---|---|
| **High Precision** | 0.80 | 1.0000 | 1.0000 | 1.0000 | Low-risk investigative leads |
| **Balanced Point** | 0.50 | 1.0000 | 1.0000 | 1.0000 | General threat analysis |
| **High Recall** | 0.30 | 1.0000 | 1.0000 | 1.0000 | Broad candidate screening |
