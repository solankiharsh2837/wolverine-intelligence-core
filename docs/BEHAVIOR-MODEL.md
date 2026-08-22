# Wolverine Intelligence: Behavioral Profiling Subsystem

> [!IMPORTANT]
> **Axiom**: Behavioral telemetry represents the rhythms, habits, and cadences of threat actors. Behavior alone is rarely sufficient for attribution, but it is a critical multiplier in the overall fusion engine.

## 1. Behavior Profile Features

Every Persona in Wolverine Intelligence has a computed `BehaviorProfile`.

### Posting Frequency
- **Definition**: Average activity events per unit time (hour/day/week).
- **Computation**: Aggregate post timestamps into standard time windows.
- **Output**: Mean, standard deviation, and distribution parameters.

### Time-of-Day Distribution
- **Definition**: The probability distribution of activity across the 24 hours of a day (Normalized to UTC).
- **Computation**: Histogram counting events across 24 bins.
- **Output**: 24-bin probability vector.
- **Similarity**: Jensen-Shannon Divergence ($JSD$) or Cosine Similarity.
  $$JSD(P||Q) = \frac{1}{2} D_{KL}(P||M) + \frac{1}{2} D_{KL}(Q||M)$$ where $M = \frac{1}{2}(P+Q)$.

### Day-of-Week Distribution
- **Definition**: Distribution of activity across Monday-Sunday.
- **Computation**: 7-bin histogram normalized to sum=1.
- **Output**: 7-bin probability vector.

### Inter-Event Times
- **Definition**: Time intervals ($\Delta t$) between consecutive activities.
- **Computation**: Fit the sequence of $\Delta t$ values to a theoretical distribution (e.g., Log-Normal or Weibull).
- **Output**: Distribution parameters ($\mu, \sigma$).
- **Similarity**: Kullback-Leibler ($KL$) divergence between fitted distributions.

### Listing Cadence (Marketplaces)
- **Definition**: Frequency and timing of new store listings.
- **Output**: Periodic cadence parameters (e.g., "Batch uploads on Friday evenings").

### Transaction Cadence
- **Definition**: The rhythm of completed trades or blockchain transfers.
- **Output**: Volume velocity and batching behavior signatures.

### Forum Participation Pattern
- **Definition**: Ratio of threads initiated vs. replies, and average response latency to direct mentions.
- **Output**: Continuous ratio $[0.0, 1.0]$ and latency distribution.

### Migration Timing
- **Definition**: The temporal correlation between an actor ceasing activity on Forum A and commencing activity on Forum B.
- **Detection**: Cross-correlation of activity cessation on source and onset on target.

### Counterparty Diversity
- **Definition**: The breadth of a persona's network.
- **Computation**: Calculate the Gini coefficient of transaction volume distributed across unique counterparties.
- **Output**: Gini coefficient $G \in [0, 1]$.

## 2. Profile Comparison
To compute similarity $S(A, B)$ between two behavior profiles:
1. **Feature Wise Distance**: Each feature computes a specific distance (e.g., $JSD$ for Time-of-Day, Euclidean for Posting Frequency).
2. **Missing Data**: If a persona has $< 10$ events, missing features default to population averages, and the confidence bounds for those features widen severely.
3. **Aggregation**: Overall behavior score is a weighted sum of individual feature similarities.

## 4. Schema: BehaviorProfile

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `id` | UUID | Yes | Profile ID | Unique |
| `personaId` | UUID | Yes | FK to Persona | |
| `timeOfDay` | Vector | Yes | 24-bin UTC histogram | Sum=1.0 |
| `dayOfWeek` | Vector | Yes | 7-bin histogram | Sum=1.0 |
| `interEventParams` | JSONB | Yes | Fit params (mu, sigma) | |
| `postingFreq` | JSONB | Yes | Mean, StdDev | Non-negative |
| `networkGini` | Float | No | Counterparty diversity | $[0.0, 1.0]$ |
| `eventCount` | Int | Yes | Total events observed | Minimum 10 |
| `windowSize` | Enum | Yes | `30d`, `90d`, `all_time` | |

## 5. Connection to Attribution
- **Crucial Boundary**: Behavior similarity is ONE input feature to the overall Attribution Candidate model.
- **Restriction**: A high behavioral similarity score (e.g., same sleep cycle) CANNOT independently generate a `POSSIBLE_SAME_AS` edge. It must be fused with Stylometry, Infrastructure, or Deterministic overlaps.
- The behavior score is appended to the unified `featureVector` stored in the `RelationshipEvidence` table (see [RELATIONSHIP-MODEL.md](RELATIONSHIP-MODEL.md)).

## 6. Human Operability
**HOW TO INSPECT BEHAVIOR:**
`agy ml behavior plot <persona-id>`
Generates a terminal-based or SVG plot of the 24-hour activity heat map, allowing an analyst to visually confirm shared operational hours between two personas.
