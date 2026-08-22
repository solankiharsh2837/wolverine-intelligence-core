# Wolverine Intelligence — Attribution Model Specification

## 1. Mathematical Formulation
The Cross-Actor Attribution Engine evaluates candidate pairs $(A, B)$ using regularized logistic regression:
$$z = \beta_0 + \sum_{i=1}^6 \beta_i x_i$$
$$P_{\text{raw}} = \sigma(z) = \frac{1}{1 + e^{-z}}$$
$$P_{\text{calibrated}} = \sigma(A z + B)$$

## 2. Feature Definitions ($x_1 \dots x_6$)
1. $x_1$: `behavior_activity_js` $= 1 - \sqrt{\text{JSD}(P_{\text{hour}}, Q_{\text{hour}})} \in [0, 1]$
2. $x_2$: `behavior_inter_event_log_ratio` $= \exp\left(-\frac{|\ln \mu_A - \ln \mu_B|}{2.0}\right) \in [0, 1]$
3. $x_3$: `behavior_cadence_weekly_ratio` $= \frac{\min(C_A, C_B)}{\max(C_A, C_B)} \in [0, 1]$
4. $x_4$: `behavior_category_cosine` $= \frac{C_A \cdot C_B}{\|C_A\|_2 \|C_B\|_2} \in [0, 1]$
5. $x_5$: `graph_jaccard` $= \frac{|\Gamma_A \cap \Gamma_B|}{|\Gamma_A \cup \Gamma_B|} \in [0, 1]$
6. $x_6$: `graph_adamic_adar_norm` $= \tanh\left(\frac{AA(A, B)}{2.0}\right) \in [0, 1]$

## 3. Subsystem Cross-Attribution Pairing Contract
- **Positive Pair (`SAME_ACTOR`)**: Forum User $u_i \leftrightarrow$ Marketplace Vendor $v_j$ where $\text{match\_id}(u_i) = \text{match\_id}(v_j)$.
- **Negative Pair (`DIFFERENT_ACTOR`)**: Forum User $u_i \leftrightarrow$ Marketplace Vendor $v_k$ where $\text{match\_id}(u_i) \ne \text{match\_id}(v_k)$.
- **Strict Invariant**: Zero self-pair positives ($\text{entityA.id} \ne \text{entityB.id}$).
