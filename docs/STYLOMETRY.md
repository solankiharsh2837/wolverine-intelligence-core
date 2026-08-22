# Wolverine Intelligence: Stylometry Subsystem

> [!IMPORTANT]
> **Philosophy**: Classical, EXPLAINABLE baseline. **No LLM or deep learning as primary authorship attribution.** Stylometry in Wolverine relies on mathematically sound, reviewable feature vectors.

## 1. Feature Categories

All texts are processed into numeric feature vectors.

### Character N-grams
- **Input**: Raw text string.
- **Process**: Extract all overlapping character n-grams ($n \in \{2,3,4\}$).
- **Output**: Frequency distribution vector $V_{char\_n}$.
- **Normalization**: $L1$ normalize: $v_i = \frac{v_i}{\sum |v_j|}$.
- **Similarity**: Cosine Similarity: $cos(\theta) = \frac{A \cdot B}{||A|| ||B||}$.

### Word N-grams
- **Input**: Tokenized text (lowercased, punctuation stripped).
- **Process**: Extract word n-grams ($n \in \{1,2,3\}$).
- **Output**: Frequency distribution vector $V_{word\_n}$.
- **Normalization**: $L1$ normalize.
- **Similarity**: Cosine Similarity.

### TF-IDF
- **Input**: Corpus of author texts.
- **Process**: Standard Term Frequency-Inverse Document Frequency. $$TF(t,d) = \frac{f_{t,d}}{\sum_{t' \in d} f_{t',d}}$$ $$IDF(t,D) = \log\frac{|D|}{|\{d \in D : t \in d\}|}$$
- **Output**: TF-IDF vector per document.
- **Similarity**: Cosine Similarity.

### Function Words
- **Input**: Tokenized text.
- **Process**: Count frequency of closed-class function words (e.g., *the, and, of, to, in, a, is, that, for* - exact list versioned).
- **Output**: Frequency vector.
- **Rationale**: Function word usage is largely unconscious and extremely difficult to intentionally obfuscate.

### Punctuation Profile
- **Input**: Raw text string.
- **Process**: Count instances of punctuation tokens (`, . ; : ! ? - ' " ( )`).
- **Output**: Punctuation frequency vector, normalized by total character count.

### POS Statistics
- **Input**: Raw text string.
- **Process**: Part-of-Speech tagging using **spaCy** (en_core_web_sm). Compute distribution of tags (NOUN, VERB, ADJ, etc.).
- **Output**: POS frequency vector (normalized to sum=1).

### Sentence-Length Statistics
- **Input**: Raw text string.
- **Process**: Tokenize into sentences. Compute character and word length per sentence.
- **Output**: Statistical summary vector (Mean, Median, StdDev, Skewness).

## 2. Baseline Models

- **Primary**: Logistic Regression (L2 regularized). Interpretable coefficients allow analysts to see *why* two texts matched.
- **Secondary**: Linear SVM (Support Vector Machine). Highly effective for sparse, high-dimensional n-gram spaces.

> [!WARNING]
> Deep learning models (e.g., BERT, LLMs) may ONLY be used in a secondary, `AI_HYPOTHESIS` capacity. They are NOT permitted to generate `STATISTICAL_MATCH` evidence directly without a classical vector breakdown.

## 3. Training Specification

- **Input**: Labeled text samples bounded to known author IDs.
- **Task**: Pairwise verification (open-set: "Are text A and text B by the same author?").
- **Splits Requirements**:
  - **Cross-author split**: Authors in the test set MUST NOT appear in the training set.
  - **Cross-forum split**: Evaluate on portals not seen in training.
  - **Cross-domain split**: Ensure model generalizes across post vs. listing vs. chat.

## 4. Evaluation Metrics

- **Classification Metrics**: Accuracy, Precision, Recall, F1 (calculated both per-author and macro-averaged).
- **Pairwise Metrics**: AUC-ROC, Equal Error Rate (EER).
- **Calibration**: Reliability diagrams and Brier score. The output probability MUST accurately reflect the real-world probability of a match.

## 5. Schema: StylometricProfile

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `id` | UUID | Yes | Profile ID | Unique |
| `personaId` | UUID | Yes | FK to Persona | |
| `charNgram` | Vector | Yes | Compressed feature array | Sum=1.0 |
| `wordNgram` | Vector | Yes | Compressed feature array | Sum=1.0 |
| `functionWords` | Vector | Yes | Frequency of functional lexicons | Sum=1.0 |
| `posDistribution`| Vector | Yes | Array of spaCy POS tag freqs | Sum=1.0 |
| `sentenceStats` | JSONB | Yes | Mean, median, stddev | Non-negative |
| `totalTokens` | Int | Yes | Total words analyzed | Minimum 500 required |
| `featureVersion` | String | Yes | Feature extractor version | e.g. `1.2.0` |

> [!NOTE]
> Profiles are incrementally updated. When new text is scraped, it is appended to a staging table. The batch pipeline recomputes `StylometricProfile` periodically.

## 6. Model Versioning
Every inference result is permanently bound to:
1. `featureVersion`: The exact code/list version that built the vectors.
2. `modelVersion`: The exact weights used to score the similarity.

If either increments, old scores remain valid but are flagged as `SUPERSEDED` when recomputed.

## 7. Human Operability
**HOW TO TEST STYLOMETRY:**
`agy ml stylometry compare --text-a <path1> --text-b <path2>`
This CLI tool returns the exact pairwise similarity score and prints the top 5 most distinguishing features (e.g., "Text A uses significantly more semicolons").

See [RELATIONSHIP-MODEL.md](RELATIONSHIP-MODEL.md) for how these scores convert into graph edges.
