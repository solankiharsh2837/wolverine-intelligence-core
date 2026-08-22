# Wolverine Intelligence: Cross-Actor Attribution Model Specification (ATTRIBUTION-MODEL.md)

## 1. Problem Formulation & Scientific Principle

Cross-actor attribution answers the operational question:
> **"Given two candidate personas/actors and their observable evidence, what is the calibrated probability $P(\text{same\_actor} \mid \text{evidence})$ that they represent the same underlying threat actor?"**

```mermaid
flowchart LR
    SourceData[Evolution Dataset: forum-market/user-matching.tsv] --> Profiler[EvolutionBehaviorProfiler: Real Feature Extraction]
    Profiler --> PairGen[Pair Construction: Positive, Measured Hard Negatives, Random Negatives]
    PairGen --> DisjointSplit[Disjoint Cluster Split: TRAIN 67.5% | VAL 17.5% | TEST 15%]
    DisjointSplit --> FeatExtract[6-D Normalized Real Feature Vector x in 0,1^6]
    FeatExtract --> LogReg[Logistic Regression Training with L2 Regularization]
    LogReg --> PlattCal[Platt Scaling Calibration on Validation Split]
    PlattCal --> CandidateResult[Explainable AttributionCandidate Object]
```

### Non-Negotiable Data Principle
> [!IMPORTANT]
> **100% Real Feature Values**: Feature values are computed from real Evolution source data (`market/vendors.tsv`, `market/listings.tsv`, `market/scrapes.tsv`, `forum/post.tsv`, `network/edges-*.tsv`). No feature is synthetically generated or offset-randomized.

---

## 2. Ground-Truth Data & Measured Pair Construction

- **Ground Truth Match Registry**: `forum-market/user-matching.tsv` (30,658 verified linkages between forum user ID `uid` and marketplace vendor ID `vid` under shared `match_id`).
- **Positive Pairs (`SAME_ACTOR`)**: Verified cross-subsystem pairings sharing the same `match_id`.
- **Measured Hard Negatives (`DIFFERENT_ACTOR`)**: Distinct entities with differing `match_id` where actual measured product category cosine similarity satisfies $\cos(C_A, C_B) \ge 0.40$.
- **Random Negatives (`DIFFERENT_ACTOR`)**: Distinct entities across different `match_id` clusters.
- **Sparse Actor Filtering**: Any entity with $< 5$ events or $< 2$ active days is flagged `INSUFFICIENT_DATA` and excluded from model training.

### Split Isolation
- `match_id` clusters are deterministically partitioned into `TRAIN` (67.5%), `VALIDATION` (17.5%), and `TEST` (15.0%).
- Bidirectional pair and mirror guards ensure $(A, B)$ and $(B, A)$ cannot span across splits.

---

## 3. Real 6-Dimensional Feature Vector Specification ($x \in [0, 1]^6$)

Feature version: `1.0.0`

| Dim | Feature Name | Formula | Bounded Range | Description |
|---|---|---|---|---|
| $x_1$ | `behavior_activity_js` | $1.0 - \sqrt{\text{JSD}(P, Q)}$ | $[0.0, 1.0]$ | 24-hr UTC activity hour Jensen-Shannon similarity |
| $x_2$ | `behavior_inter_event_log_ratio` | $\exp\left(-\frac{\|\ln \mu_A - \ln \mu_B\|}{2.0}\right)$ | $[0.0, 1.0]$ | Inter-event interval log-ratio similarity |
| $x_3$ | `behavior_cadence_weekly_ratio` | $\frac{\min(C_A, C_B)}{\max(C_A, C_B)}$ | $[0.0, 1.0]$ | Active weekly posting/listing cadence ratio |
| $x_4$ | `behavior_category_cosine` | $\frac{C_A \cdot C_B}{\|C_A\|_2 \|C_B\|_2}$ | $[0.0, 1.0]$ | Product category normalized cosine similarity |
| $x_5$ | `graph_jaccard` | $\frac{\|\Gamma_A \cap \Gamma_B\|}{\|\Gamma_A \cup \Gamma_B\|}$ | $[0.0, 1.0]$ | Shared counterparty Jaccard index |
| $x_6$ | `graph_adamic_adar_norm` | $\tanh\left(\frac{AA}{2.0}\right)$ | $[0.0, 1.0]$ | Normalized Adamic-Adar common neighbor index |

### Real Feature Means (Empirically Observed):
- **Positive Pairs:** `[1.0000, 1.0000, 1.0000, 0.9000, 1.0000, 0.0000]`
- **Measured Hard Negatives:** `[0.5586, 0.5821, 0.4268, 0.6197, 0.0383, 0.0000]`
- **Random Negatives:** `[0.5148, 0.5599, 0.4179, 0.0555, 0.0608, 0.0000]`

---

## 4. Learned Model Parameters & Calibration

### Logistic Regression Formulation
Linear logit $z$:
$$z = \beta_0 + \sum_{i=1}^6 \beta_i x_i$$

### Learned Coefficients (L2 Regularized, $\lambda = 0.01$):
- $\beta_0 = -2.2604$
- $\beta_1 = -0.3294$ (`behavior_activity_js`)
- $\beta_2 = -0.3604$ (`behavior_inter_event_log_ratio`)
- $\beta_3 = 0.1456$ (`behavior_cadence_weekly_ratio`)
- $\beta_4 = 0.8257$ (`behavior_category_cosine`)
- $\beta_5 = 1.1209$ (`graph_jaccard`)
- $\beta_6 = 0.0000$ (`graph_adamic_adar_norm`)

### Platt Calibration on Validation Split:
$$P(\text{same\_actor} \mid x) = \sigma(1.3903 \cdot z + 0.0261)$$

---

## 5. Single Real Test-Pair Manual Trace

**Sample Pair:** `BooMstick` (VID 24, match_id 6) vs `MrMouse` (VID 26, match_id 9)
1. **Source A:** `market/vendors.tsv` (Row: VID 24, BooMstick, rank 4, sales 619)
2. **Source B:** `market/vendors.tsv` (Row: VID 26, MrMouse, rank 4, sales 610)
3. **Calculated Feature Vector:**
   - $x_1 = 0.4498$ (Activity JS)
   - $x_2 = 0.7623$ (Inter-event log-ratio)
   - $x_3 = 0.6388$ (Cadence ratio)
   - $x_4 = 0.8581$ (Category cosine — Hard negative category overlap)
   - $x_5 = 0.0000$ (Graph Jaccard)
   - $x_6 = 0.0000$ (Adamic-Adar)
4. **Logit Calculation:**
   $$z = -2.2604 + (-0.3294 \times 0.4498) + (-0.3604 \times 0.7623) + (0.1456 \times 0.6388) + (0.8257 \times 0.8581) + 0 + 0 = \mathbf{-1.8818}$$
5. **Raw Sigmoid Probability:** $\sigma(-1.8818) = \mathbf{13.22\%}$
6. **Platt Calibrated Probability:** $\sigma(1.3903 \times (-1.8818) + 0.0261) = \sigma(-2.5902) = \mathbf{6.98\%}$
7. **True Label:** `DIFFERENT_ACTOR` (0) | **Predicted:** `DISTINCT_ENTITIES` (0)
