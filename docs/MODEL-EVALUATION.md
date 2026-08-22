# Wolverine Intelligence: Attribution Model Evaluation Methodology (MODEL-EVALUATION.md)

## 1. Real Source Data Guarantee
1. **Zero Synthetic Generation**: All feature vectors $x \in [0, 1]^6$ are extracted dynamically from raw Evolution TSV records using `EvolutionBehaviorProfiler` and `extractAttributionFeatures`.
2. **Untouched Test Partition**: Model evaluation metrics are strictly reported on the `TEST` split, which is never accessed during feature selection, model training, or hyperparameter tuning.
3. **Bootstrap Confidence Intervals**: 1,000 bootstrap resamples are conducted on the test split predictions to report empirical 95% confidence bounds for ROC-AUC, PR-AUC, and F1 Score.
4. **Data-Driven Error Analysis**: All False Positives and False Negatives inspect the actual underlying feature values to generate diagnostic explanations.
