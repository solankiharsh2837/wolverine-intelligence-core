# Wolverine Intelligence: Attribution Model Evaluation Methodology (MODEL-EVALUATION.md)

## 1. Evaluation Integrity Principles

1. **Untouched Test Partition**: Model evaluation metrics are strictly reported on the `TEST` split, which is never accessed during feature selection, model training, or hyperparameter tuning.
2. **Bootstrap Confidence Intervals**: 1,000 bootstrap resamples are conducted on the test split predictions to report empirical 95% confidence bounds for ROC-AUC, PR-AUC, and F1 Score.
3. **Brier Calibration Benchmark**: The Brier score ($\frac{1}{N}\sum (\hat{p}_i - y_i)^2$) is compared against a naive class-prior baseline to verify that predicted probabilities represent true probabilistic confidence.
4. **Error Analysis Mandate**: All False Positives and False Negatives are logged to `models/attribution/error-analysis.json` with dominant feature contributions and diagnostic reasons.
