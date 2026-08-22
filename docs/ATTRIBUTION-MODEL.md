# Wolverine Intelligence — Cross-Actor Attribution Model Specification (Phase 4C)

## 1. Architectural Scope & Evidence Contract
The Attribution Engine computes statistical identity linkage between disparate intelligence artifacts.
- **Cross-Subsystem Pairing**: Forum User Persona ($u_i \in \text{Forum}$) $\longleftrightarrow$ Marketplace Vendor ($v_j \in \text{Market}$).
- **Evidence Class**: `STATISTICAL_MATCH`.
- **Interpretability Law**: Behavioral similarity $\ne$ identity proof. The model estimates whether observable telemetry resembles known ground-truth linkages.

---

## 2. Feature-by-Feature Semantic Audit

| Feature | Feature Name | Source A (Forum) | Source B (Market) | Mathematical Formulation | Unit | Namespace | Is Comparable? | Availability Mask |
|---|---|---|---|---|---|---|---|---|
| $x_1$ | `behavior_activity_js` | `forum/post.tsv` post timestamps | `market/scrapes.tsv` listing observation dates | $1 - \sqrt{\text{JSD}(P_{\text{hour}}, Q_{\text{hour}})}$ | $[0, 1]$ unitless | UTC Hour $[0, 23]$ | **YES** (Observed Activity Pattern) | `true` |
| $x_2$ | `behavior_inter_event_log_ratio` | Inter-post time intervals | Inter-listing scrape intervals | $\exp\left(-\frac{|\ln \mu_A - \ln \mu_B|}{2.0}\right)$ | $[0, 1]$ unitless | Log-hours | **YES** (Temporal Rhythm) | `true` |
| $x_3$ | `behavior_cadence_weekly_ratio` | Posts per active week | Listings per active week | $\frac{\min(C_A, C_B)}{\max(C_A, C_B)}$ | $[0, 1]$ unitless | Events / Week | **YES** (Weekly Cadence) | `true` |
| $x_4$ | `behavior_category_cosine` | Keyword-extracted topic distribution | CID-mapped listing category distribution | $\frac{C_A \cdot C_B}{\|C_A\|_2 \|C_B\|_2}$ | $[0, 1]$ unitless | 6 Canonical Bins | **YES** (Canonical Ontology) | `true` |
| $x_5$ | `graph_jaccard` | Thread IDs (`thread_<tid>`) | Vendor VIDs (`evo_vendor_<vid>`) | $\frac{|\Gamma_A \cap \Gamma_B|}{|\Gamma_A \cup \Gamma_B|}$ | $[0, 1]$ unitless | Disjoint Namespaces | **NO** (Incompatible Namespaces) | `false` |
| $x_6$ | `graph_adamic_adar_norm` | Thread IDs | Vendor VIDs | $\tanh\left(\frac{AA(A, B)}{2.0}\right)$ | $[0, 1]$ unitless | Disjoint Namespaces | **NO** (Incompatible Namespaces) | `false` |

---

## 3. Canonical Category Ontology (6 Bins)
Both forum textual artifacts and marketplace structured listings project onto a unified 6-dimensional category vector:
1. `Drugs`: Cannabis, Weed, Hash, Stimulants, Cocaine, MDMA, Ecstasy, Opioids, Psychedelics, Prescription, Steroids, Dissociatives.
2. `Fraud_Financial`: Carding, CVV, Fullz, Bank Accounts, Dumps, Counterfeit, PayPal, Transfers.
3. `Services_Escrow`: Hosting, VPN, SOCKS Proxies, Coding, Custom Development, Escrow.
4. `Digital_Goods`: Guides, Tutorials, E-Books, Exploits, Software, Database Leaks.
5. `Security_PGP`: PGP Encryption, Keys, OPSEC Guides, Privacy Tools.
6. `General_Other`: Discussion, Introductions, Announcements, Miscellaneous.

---

## 4. Mathematical Formulation & Inference
$$\mathbf{x} = [x_1, x_2, x_3, x_4, 0, 0], \quad \mathbf{m} = [\text{true}, \text{true}, \text{true}, \text{true}, \text{false}, \text{false}]$$
$$z = \beta_0 + \sum_{i=1}^4 \beta_i x_i$$
$$P_{\text{raw}} = \sigma(z) = \frac{1}{1 + e^{-z}}$$
$$P_{\text{calibrated}} = \sigma(A z + B)$$
