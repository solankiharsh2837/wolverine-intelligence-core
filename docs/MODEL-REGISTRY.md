# Wolverine Intelligence — Model Registry & Training Baseline Specification

## 1. Model Registry Architecture

Trained models and feature extractor versions are registered in PostgreSQL (`model_versions` table) to maintain full traceability:

```
model_versions:
  id: UUID
  modelName: string (e.g. 'wolverine-logistic-attribution')
  versionTag: string (e.g. 'v1.0.0-logistic')
  parameters: JSON metadata
```

### Metadata Fields Stored in `parameters`:
- `task`: `ATTRIBUTION_SCORING`, `AUTHORSHIP_VERIFICATION`, `BEHAVIOR_CLASSIFICATION`
- `datasetIds`: Array of research dataset IDs used for training
- `featureVersion`: Version of feature extraction code
- `hyperparameters`: Regularization $\lambda$, intercept $\beta_0$, weights $\beta_1 \dots \beta_{10}$
- `trainingConfig`: Train/val/test split ratios, stratified sampling parameters
- `evaluationMetrics`: AUC-ROC, F1 score, Brier score, EER (Equal Error Rate)

---

## 2. Baseline Model Architecture

1. **Authorship Stylometry Baseline**:
   - Algorithm: Linear SVM / Logistic Regression on L1-normalized n-gram and function word frequencies.
   - Input: $x_{\text{sty}} \in [0,1]^{k}$.
   - Evaluation: Macro F1 and AUC-ROC on author-disjoint test splits.
2. **Behavioral Timing Baseline**:
   - Algorithm: Jensen-Shannon divergence over 24-hour UTC activity distributions.
3. **Attribution Logistic Regression**:
   - Equation: $P(\text{same\_actor} | x) = \frac{1}{1 + e^{-(\beta_0 + \sum \beta_i x_i)}}$
   - Features: $x = [\text{alias}, \text{pgp}, \text{wallet}, \text{stylometry}, \text{behavior}, \text{temporal}, \text{graph}, \text{market}, \text{infrastructure}, \text{migration}]$.
