# Wolverine Intelligence: Cross-Actor Attribution Model Specification (ATTRIBUTION-MODEL.md)

## 1. Problem Formulation & Evidence Taxonomy

Cross-actor attribution answers the fundamental operational question:
> **"Given two candidate personas/actors and their observable evidence, what is the probability $P(\text{same\_actor} \mid \text{evidence})$ that they represent the same underlying threat actor?"**

```mermaid
flowchart LR
    SourceData[Evolution Dataset: forum-market/user-matching.tsv] --> PairGen[Pair Construction: Positive, Negative, Hard Negatives]
    PairGen --> DisjointSplit[Disjoint Cluster Split: TRAIN 70% | VAL 15% | TEST 15%]
    DisjointSplit --> FeatExtract[6-D Normalized Feature Vector x in 0,1^6]
    FeatExtract --> LogReg[Logistic Regression Training L2 Regularized]
    LogReg --> PlattCal[Platt Scaling Probability Calibration]
    PlattCal --> CandidateResult[Explainable AttributionCandidate Object]
```

### Evidence Taxonomy Classification
- **Output Class**: `STATISTICAL_MATCH` (or `AI_HYPOTHESIS`).
- **Legal & Analytical Boundary**: A statistical attribution score is **NEVER** a confirmed real-world identity, a fact, an AI judgment, or a cryptographic proof. It is a probabilistic hypothesis requiring human analyst review.

---

## 2. Ground-Truth Data & Pair Construction

The model uses real ground-truth linkages from the acquired Evolution dataset:
- **Ground Truth Mapping**: `forum-market/user-matching.tsv` (30,658 verified linkages between forum user ID `uid` and marketplace vendor ID `vid` under shared `match_id`).
- **Positive Pairs (`SAME_ACTOR`)**:
  - Forum account $U_i$ and vendor account $V_i$ sharing the same `match_id`.
- **Hard Negative Pairs (`DIFFERENT_ACTOR`)**:
  - Distinct entities (different `match_id`) with **identical product category domains** (e.g. two distinct drug vendors) active during the same time window, preventing trivial category shortcuts.
- **Random Negative Pairs (`DIFFERENT_ACTOR`)**:
  - Distinct entities with differing operational behaviors and disparate match IDs.

### Split Strategy & Zero-Leakage Guarantee
1. **Cluster Partitioning**: `match_id` clusters are deterministically assigned via cryptographic hash:
   - `TRAIN`: 70%
   - `VALIDATION`: 15%
   - `TEST`: 15%
2. **Pair & Mirror Isolation**: If pair $(A, B)$ is in `TRAIN`, neither $(A, B)$ nor $(B, A)$ can appear in `VALIDATION` or `TEST`.

---

## 3. Canonical 6-Dimensional Feature Vector ($x \in [0, 1]^6$)

Feature version: `1.0.0`

| Dim | Feature Name | Formula | Bounded Range | Description |
|---|---|---|---|---|
| $x_1$ | `behavior_activity_js` | $1.0 - \sqrt{\text{JSD}(P, Q)}$ | $[0.0, 1.0]$ | 24-hr UTC activity hour Jensen-Shannon similarity |
| $x_2$ | `behavior_inter_event_log_ratio` | $\exp\left(-\frac{\|\ln \mu_A - \ln \mu_B\|}{2.0}\right)$ | $[0.0, 1.0]$ | Inter-event interval log-ratio similarity |
| $x_3$ | `behavior_cadence_weekly_ratio` | $\frac{\min(C_A, C_B)}{\max(C_A, C_B)}$ | $[0.0, 1.0]$ | Active weekly posting/listing cadence ratio |
| $x_4$ | `behavior_category_cosine` | $\frac{C_A \cdot C_B}{\|C_A\|_2 \|C_B\|_2}$ | $[0.0, 1.0]$ | Product category normalized cosine similarity |
| $x_5$ | `graph_jaccard` | $\frac{\|\Gamma_A \cap \Gamma_B\|}{\|\Gamma_A \cup \Gamma_B\|}$ | $[0.0, 1.0]$ | Shared counterparty Jaccard index |
| $x_6$ | `graph_adamic_adar_norm` | $\tanh\left(\frac{AA}{2.0}\right)$ | $[0.0, 1.0]$ | Normalized Adamic-Adar common neighbor index |

### Adamic-Adar Missing Degree Policy
If common neighbor $z \in \Gamma(A) \cap \Gamma(B)$ has an unobserved degree in `network/edges-*.tsv`, the term is strictly skipped without assuming artificial degrees (no `deg = 2` fallback).

---

## 4. Logistic Regression Classifier & Calibration

### Model Formulation
Linear logit $z$:
$$z = \beta_0 + \sum_{i=1}^6 \beta_i x_i$$
Raw probability:
$$\hat{p}_{\text{raw}} = \sigma(z) = \frac{1}{1 + e^{-z}}$$

### Learned Model Parameters
Trained with Gradient Descent and L2 regularization ($\lambda = 0.01$):
- $\beta_0 = -1.9325$ (Negative prior establishing baseline hurdle)
- $\beta_1 = 1.1812$ (`behavior_activity_js`)
- $\beta_2 = 1.4268$ (`behavior_inter_event_log_ratio`)
- $\beta_3 = 1.0363$ (`behavior_cadence_weekly_ratio`)
- $\beta_4 = -0.2601$ (`behavior_category_cosine`)
- $\beta_5 = 0.9758$ (`graph_jaccard`)
- $\beta_6 = 0.9384$ (`graph_adamic_adar_norm`)

### Platt Probability Calibration (Validation Split)
$$P(\text{same\_actor} \mid x) = \sigma(A \cdot z + B)$$
Learned parameters: $A = 2.0073, B = -0.0902$.

---

## 5. Explainability & Mathematical Decomposition

For every attribution decision, the output decomposes into feature contributions:
$$\text{contribution}_i = \beta_i \cdot x_i$$
The sum of all feature contributions plus intercept $\beta_0$ strictly equals raw logit $z$:
$$z = \beta_0 + \sum_{i=1}^6 \text{contribution}_i$$

---

## 6. Whiteboard Q&A Reference

- **Q: What is the label?**
  **A**: A binary target where $Y=1$ (`SAME_ACTOR`) indicates ground-truth cross-subsystem ownership derived from `forum-market/user-matching.tsv`, and $Y=0$ (`DIFFERENT_ACTOR`) represents distinct actors.
- **Q: What does $\beta$ mean?**
  **A**: $\beta_i$ is the directional log-odds weight learned via regularized maximum likelihood. A positive $\beta$ indicates higher feature similarity increases the odds of shared actor identity.
- **Q: How do you prevent leakage?**
  **A**: Entire `match_id` clusters are assigned exclusively to either `TRAIN`, `VAL`, or `TEST`. Mirrored pairs $(A, B)$ and $(B, A)$ are guarded so no pair can span multiple splits.
- **Q: Why logistic regression?**
  **A**: It is mathematically transparent, globally convex under L2 regularization, strictly deterministic, and decomposes into additive feature contributions ($\beta_i x_i$) for human analyst explainability.
